import { useState, useMemo, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { fetchHabits, fetchHabitLogs, createHabit, removeHabit } from './db'
import { today } from './utils/dateUtils'
import { calcStreak } from './utils/streakUtils'
import HabitGrass from './components/HabitGrass'
import MonthCalendar from './components/MonthCalendar'
import TabBar from './components/TabBar'
import LogSheet from './components/LogSheet'
import AddHabitModal from './components/AddHabitModal'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import { useStopwatch, formatElapsed } from './hooks/useStopwatch'
import type { Habit, HabitLog } from './types'

export default function App() {
  const [session, setSession] = useState<boolean | null>(null) // null=loading, false=unauth, true=authed
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [logSheetDate, setLogSheetDate] = useState<string | null>(null)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const stopwatch = useStopwatch()
  const [viewMonth, setViewMonth] = useState<string>(today().slice(0, 7))
  const [habits, setHabits] = useState<Habit[] | undefined>(undefined)
  const [allLogs, setAllLogs] = useState<HabitLog[] | undefined>(undefined)

  // 認証状態の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(!!s)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(!!s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // データ取得
  const loadData = useCallback(async () => {
    const [h, l] = await Promise.all([fetchHabits(), fetchHabitLogs()])
    setHabits(h)
    setAllLogs(l)
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session, loadData])

  // 表示用ログ: 全体 or 特定習慣
  const { effectiveLogs, grassColor, maxValue } = useMemo(() => {
    const logs = allLogs ?? []
    const habs = habits ?? []

    if (selectedHabitId != null) {
      const habit = habs.find((h) => h.id === selectedHabitId)
      return {
        effectiveLogs: logs.filter((l) => l.habitId === selectedHabitId),
        grassColor: habit?.color ?? '#22c55e',
        maxValue: undefined,
      }
    }

    // 全体: 日付ごとに「何習慣こなしたか」を集計
    const dateHabitSets: Record<string, Set<string>> = {}
    for (const log of logs) {
      if (!dateHabitSets[log.date]) dateHabitSets[log.date] = new Set()
      dateHabitSets[log.date].add(log.habitId)
    }
    const syntheticLogs: HabitLog[] = Object.entries(dateHabitSets).map(([date, s]) => ({
      id: '',
      habitId: '',
      date,
      value: s.size,
    }))
    return {
      effectiveLogs: syntheticLogs,
      grassColor: '#22c55e',
      maxValue: Math.max(habs.length, 1),
    }
  }, [allLogs, habits, selectedHabitId])

  const streak = useMemo(
    () => calcStreak(allLogs ?? [], selectedHabitId ?? undefined),
    [allLogs, selectedHabitId],
  )

  async function handleAddHabit(data: Pick<Habit, 'name' | 'unit' | 'color'>) {
    await createHabit(data)
    await loadData()
  }

  async function deleteHabit(id: string) {
    if (!confirm('この習慣と記録をすべて削除しますか？')) return
    await removeHabit(id)
    await loadData()
    if (selectedHabitId === id) setSelectedHabitId(null)
  }

  function prevMonth() {
    const [y, m] = viewMonth.split('-').map(Number)
    const newY = m === 1 ? y - 1 : y
    const newM = m === 1 ? 12 : m - 1
    setViewMonth(`${newY}-${String(newM).padStart(2, '0')}`)
  }

  function nextMonth() {
    const [y, m] = viewMonth.split('-').map(Number)
    const newY = m === 12 ? y + 1 : y
    const newM = m === 12 ? 1 : m + 1
    setViewMonth(`${newY}-${String(newM).padStart(2, '0')}`)
  }

  const isCurrentMonth = viewMonth === today().slice(0, 7)
  const [vy, vm] = viewMonth.split('-').map(Number)
  const monthLabel = `${vy}年${vm}月`

  // 認証チェック中
  if (session === null) {
    return <LoadingScreen />
  }

  // 未認証 → ログイン画面
  if (!session) return <AuthScreen />

  // データ取得中
  if (habits === undefined) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <h1 className="text-base font-bold text-gray-800 tracking-tight whitespace-nowrap">habit-commit</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddHabit(true)}
              className="text-sm font-semibold text-green-600 hover:text-green-700 px-2 py-1.5 rounded-xl hover:bg-green-50 transition-colors whitespace-nowrap"
            >
              + 習慣を追加
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
              title="ログアウト"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* タブバー */}
      <TabBar
        habits={habits}
        selected={selectedHabitId}
        onChange={setSelectedHabitId}
      />

      <main className="max-w-2xl mx-auto">
        {/* ストリーク */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <span className="text-xl">{streak > 0 ? '🔥' : '💤'}</span>
          {streak > 0 ? (
            <span className="text-sm font-semibold text-gray-700">
              <span className="text-orange-500 text-base">{streak}</span> 日連続コミット中！
            </span>
          ) : (
            <span className="text-sm text-gray-400">まだ記録がありません。今日から始めよう！</span>
          )}
          {/* 個別習慣タブで削除ボタン */}
          {selectedHabitId != null && (
            <button
              onClick={() => deleteHabit(selectedHabitId)}
              className="ml-auto text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              習慣を削除
            </button>
          )}
        </div>

        {/* 草グラフ（過去半年） */}
        <div className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 px-4 py-4 mb-4">
          <p className="text-xs text-gray-400 mb-3">過去26週</p>
          <HabitGrass logs={effectiveLogs} color={grassColor} maxValue={maxValue} />
        </div>

        {/* 月カレンダー */}
        <div className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 px-4 py-4">
          {/* 月ナビゲーション */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-700">{monthLabel}</span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30"
            >
              ›
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              習慣を追加してから記録しましょう
            </div>
          ) : (
            <MonthCalendar
              logs={effectiveLogs}
              color={grassColor}
              maxValue={maxValue ?? 1}
              month={viewMonth}
              onDayClick={(date) => setLogSheetDate(date)}
            />
          )}
        </div>
      </main>

      {/* 今日を記録するボタン（固定フッタ） */}
      {habits.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pointer-events-none z-10">
          <button
            onClick={() => setLogSheetDate(today())}
            className="pointer-events-auto w-full max-w-2xl mx-auto block py-4 rounded-2xl font-bold text-base text-white shadow-lg transition-transform active:scale-[0.98]"
            style={{ backgroundColor: grassColor }}
          >
            記録する
            {/* タイマー計測中は経過時間を表示 */}
            {stopwatch.elapsed > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-sm font-semibold tabular-nums bg-white/20 rounded-full px-2.5 py-0.5 align-middle">
                ⏱ {formatElapsed(stopwatch.elapsed)}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ログシート */}
      {logSheetDate && (
        <LogSheet
          date={logSheetDate}
          habits={habits}
          selectedHabitId={selectedHabitId}
          logs={allLogs ?? []}
          stopwatch={stopwatch}
          onClose={() => setLogSheetDate(null)}
          onSaved={async () => {
            setLogSheetDate(null)
            await loadData()
          }}
        />
      )}

      {/* 習慣追加モーダル */}
      {showAddHabit && (
        <AddHabitModal onAdd={handleAddHabit} onClose={() => setShowAddHabit(false)} />
      )}
    </div>
  )
}
