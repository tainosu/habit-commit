import { useState, useEffect, useRef } from 'react'
import { createHabitLog } from '../db'
import { today } from '../utils/dateUtils'
import type { Stopwatch } from '../hooks/useStopwatch'
import StopwatchPanel from './StopwatchPanel'
import type { Habit, HabitLog } from '../types'

interface Props {
  date: string
  habits: Habit[]
  selectedHabitId: string | null
  logs: HabitLog[]
  stopwatch: Stopwatch
  onClose: () => void
  onSaved: () => void
}

type Mode = 'manual' | 'timer'

const QUICK_MINUTES = [10, 30, 60]
const QUICK_COUNT = [1, 3, 5]
const SWIPE_THRESHOLD = 50 // px

export default function LogSheet({ date, habits, selectedHabitId, logs, stopwatch, onClose, onSaved }: Props) {
  // タイマーは「今日」の記録のみ
  const canTimer = date === today()
  const [mode, setMode] = useState<Mode>(canTimer && stopwatch.elapsed > 0 ? 'timer' : 'manual')
  const [visible, setVisible] = useState(false)
  const [dragX, setDragX] = useState<number | null>(null)
  const touch = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null)

  useEffect(() => {
    // mount後にアニメーション開始
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  function handleSaved() {
    setVisible(false)
    setTimeout(onSaved, 300)
  }

  // 横スワイプでモード切り替え（縦スクロールは邪魔しない）
  function handleTouchStart(e: React.TouchEvent) {
    if (!canTimer) return
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY, axis: null }
  }

  function handleTouchMove(e: React.TouchEvent) {
    const s = touch.current
    if (!s) return
    const t = e.touches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (s.axis == null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (s.axis === 'x') {
      // 端より先へは抵抗をつける
      const atEdge = (mode === 'manual' && dx > 0) || (mode === 'timer' && dx < 0)
      setDragX(atEdge ? dx / 4 : dx)
    }
  }

  function handleTouchEnd() {
    if (dragX != null) {
      if (dragX < -SWIPE_THRESHOLD) setMode('timer')
      else if (dragX > SWIPE_THRESHOLD) setMode('manual')
    }
    touch.current = null
    setDragX(null)
  }

  const [y, m, d] = date.split('-').map(Number)
  const dateLabel = `${y}年${m}月${d}日`
  const manualHabits = selectedHabitId != null ? habits.filter((h) => h.id === selectedHabitId) : habits

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      {/* シート */}
      <div
        className="relative w-full bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 max-h-[85vh] flex flex-col overflow-hidden"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-3 flex-shrink-0 flex flex-col gap-3">
          <h2 className="text-base font-bold text-gray-800">{dateLabel} の記録</h2>

          {/* モード切り替え */}
          {canTimer && (
            <div className="relative grid grid-cols-2 bg-gray-100 rounded-xl p-1">
              <div
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300"
                style={{ transform: mode === 'timer' ? 'translateX(100%)' : 'translateX(0)' }}
              />
              {(['manual', 'timer'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative py-1.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    mode === m ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {m === 'manual' ? '手動入力' : 'タイマー'}
                  {/* 計測中インジケータ */}
                  {m === 'timer' && stopwatch.running && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* パネル（横に並べてスライド） */}
        <div
          className="flex flex-1 min-h-0"
          style={{
            touchAction: 'pan-y',
            transform: `translateX(calc(${mode === 'timer' ? -100 : 0}% + ${dragX ?? 0}px))`,
            transition: dragX != null ? 'none' : 'transform 300ms ease',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="w-full flex-shrink-0 flex flex-col min-h-0">
            <ManualPanel date={date} habits={manualHabits} logs={logs} onClose={handleClose} onSaved={handleSaved} />
          </div>
          {canTimer && (
            <div className="w-full flex-shrink-0 flex flex-col min-h-0">
              <StopwatchPanel
                stopwatch={stopwatch}
                habits={habits}
                defaultHabitId={selectedHabitId}
                onSaved={handleSaved}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ManualPanelProps {
  date: string
  habits: Habit[]
  logs: HabitLog[]
  onClose: () => void
  onSaved: () => void
}

function ManualPanel({ date, habits, logs, onClose, onSaved }: ManualPanelProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function todayTotal(habitId: string): number {
    return logs.filter((l) => l.habitId === habitId && l.date === date).reduce((s, l) => s + l.value, 0)
  }

  function addQuick(habitId: string, amount: number) {
    setInputs((prev) => {
      const cur = parseFloat(prev[habitId] ?? '0') || 0
      return { ...prev, [habitId]: String(cur + amount) }
    })
  }

  async function handleSave() {
    const entries = Object.entries(inputs)
      .map(([id, val]) => ({ habitId: id, value: parseFloat(val) }))
      .filter((e) => !isNaN(e.value) && e.value > 0)

    if (entries.length === 0) {
      onClose()
      return
    }

    setSaving(true)
    for (const e of entries) {
      await createHabitLog({ habitId: e.habitId, date, value: e.value })
    }
    setSaving(false)
    onSaved()
  }

  return (
    <>
      {/* 習慣リスト */}
      <div className="overflow-y-auto flex-1 px-5 pb-4 flex flex-col gap-4">
        {habits.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">習慣がまだありません</p>
        ) : (
          habits.map((habit) => {
            const total = todayTotal(habit.id)
            const unit = habit.unit === 'minutes' ? '分' : '回'
            const presets = habit.unit === 'minutes' ? QUICK_MINUTES : QUICK_COUNT
            return (
              <div key={habit.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                  <span className="font-semibold text-gray-800">{habit.name}</span>
                  {total > 0 && (
                    <span className="text-xs text-gray-400 ml-auto">
                      記録済: {total} {unit}
                    </span>
                  )}
                </div>
                {/* クイック追加 */}
                <div className="flex gap-2 items-center">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => addQuick(habit.id, p)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-400 active:bg-gray-100 transition-colors"
                      style={{ color: habit.color }}
                    >
                      +{p}{unit}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={inputs[habit.id] ?? ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [habit.id]: e.target.value }))}
                      placeholder="0"
                      className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 text-right"
                      style={{ '--tw-ring-color': habit.color } as React.CSSProperties}
                    />
                    <span className="text-sm text-gray-500">{unit}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 保存ボタン */}
      <div className="px-5 pb-8 pt-2 flex-shrink-0 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-base disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '記録する'}
        </button>
      </div>
    </>
  )
}
