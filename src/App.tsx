import { useState, useMemo, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { fetchHabits, fetchHabitLogs, createHabit, removeHabit, updateHabitGoal } from './db'
import { today } from './utils/dateUtils'
import { calcStreak } from './utils/streakUtils'
import { goalLevel, overallLevel } from './utils/levelUtils'
import HabitGrass from './components/HabitGrass'
import MonthCalendar from './components/MonthCalendar'
import TabBar from './components/TabBar'
import LogSheet from './components/LogSheet'
import AddHabitModal from './components/AddHabitModal'
import DayHistorySheet from './components/DayHistorySheet'
import EditGoalModal from './components/EditGoalModal'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import { useStopwatch, formatElapsed } from './hooks/useStopwatch'
import type { Habit, HabitLog } from './types'

export default function App() {
  const [session, setSession] = useState<boolean | null>(null) // null=loading, false=unauth, true=authed
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [logSheetDate, setLogSheetDate] = useState<string | null>(null)
  const [historyDate, setHistoryDate] = useState<string | null>(null)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [showEditGoal, setShowEditGoal] = useState(false)
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

  // 草の濃さ（日付 -> 0〜4）: 全体 or 特定習慣
  const { levelMap, grassColor } = useMemo(() => {
    const habs = habits ?? []

    // 日付 -> 習慣ID -> その日の合計
    const totals: Record<string, Record<string, number>> = {}
    for (const log of allLogs ?? []) {
      const byHabit = (totals[log.date] ??= {})
      byHabit[log.habitId] = (byHabit[log.habitId] ?? 0) + log.value
    }

    const levelMap: Record<string, number> = {}

    if (selectedHabitId != null) {
      // 特定習慣: その日の目標に対する達成率
      const habit = habs.find((h) => h.id === selectedHabitId)
      if (habit) {
        for (const [date, byHabit] of Object.entries(totals)) {
          const level = goalLevel(byHabit[habit.id] ?? 0, habit.dailyGoal)
          if (level > 0) levelMap[date] = level
        }
      }
      return { levelMap, grassColor: habit?.color ?? '#22c55e' }
    }

    // 全体: 目標を達成した習慣の数 ÷ 習慣の数
    for (const [date, byHabit] of Object.entries(totals)) {
      const achieved = habs.filter((h) => (byHabit[h.id] ?? 0) >= h.dailyGoal).length
      levelMap[date] = overallLevel(achieved, habs.length)
    }
    return { levelMap, grassColor: '#22c55e' }
  }, [allLogs, habits, selectedHabitId])

  const selectedHabit = habits?.find((h) => h.id === selectedHabitId)

  const streak = useMemo(
    () => calcStreak(allLogs ?? [], selectedHabitId ?? undefined),
    [allLogs, selectedHabitId],
  )

  async function handleAddHabit(data: Pick<Habit, 'name' | 'unit' | 'color' | 'dailyGoal'>) {
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
          {/* 個別習慣タブで目標の編集・削除ボタン */}
          {selectedHabit != null && (
            <div className="ml-auto flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowEditGoal(true)}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
              >
                目標 {selectedHabit.dailyGoal}{selectedHabit.unit === 'minutes' ? '分' : '回'} ✎
              </button>
              <button
                onClick={() => deleteHabit(selectedHabit.id)}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors whitespace-nowrap"
              >
                削除
              </button>
            </div>
          )}
        </div>

        {/* 草グラフ（過去半年） */}
        <div className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 px-4 py-4 mb-4">
          <p className="text-xs text-gray-400 mb-3">過去26週</p>
          <HabitGrass levelMap={levelMap} color={grassColor} />
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
              levelMap={levelMap}
              color={grassColor}
              month={viewMonth}
              onDayClick={(date) => (date === today() ? setLogSheetDate(date) : setHistoryDate(date))}
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

      {/* 過去日の記録（閲覧のみ） */}
      {historyDate && (
        <DayHistorySheet
          date={historyDate}
          habits={selectedHabitId != null ? habits.filter((h) => h.id === selectedHabitId) : habits}
          logs={allLogs ?? []}
          onClose={() => setHistoryDate(null)}
        />
      )}

      {/* 目標編集モーダル */}
      {showEditGoal && selectedHabit != null && (
        <EditGoalModal
          habit={selectedHabit}
          onSave={async (goal) => {
            await updateHabitGoal(selectedHabit.id, goal)
            await loadData()
          }}
          onClose={() => setShowEditGoal(false)}
        />
      )}

      {/* 習慣追加モーダル */}
      {showAddHabit && (
        <AddHabitModal onAdd={handleAddHabit} onClose={() => setShowAddHabit(false)} />
      )}
    </div>
  )
}
