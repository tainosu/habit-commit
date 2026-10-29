import { useState } from 'react'
import { createHabitLog } from '../db'
import { today } from '../utils/dateUtils'
import { formatElapsed, type Stopwatch } from '../hooks/useStopwatch'
import type { Habit } from '../types'

interface Props {
  stopwatch: Stopwatch
  habits: Habit[]
  defaultHabitId: string | null
  onSaved: () => void
}

export default function StopwatchPanel({ stopwatch, habits, defaultHabitId, onSaved }: Props) {
  const { elapsed, running, start, pause, reset } = stopwatch
  // 時間で記録できるのは「分」単位の習慣のみ
  const minuteHabits = habits.filter((h) => h.unit === 'minutes')
  const [habitId, setHabitId] = useState<string | null>(
    minuteHabits.find((h) => h.id === defaultHabitId)?.id ?? minuteHabits[0]?.id ?? null,
  )
  const [saving, setSaving] = useState(false)

  const minutes = Math.round(elapsed / 60000)
  const habit = minuteHabits.find((h) => h.id === habitId)
  const color = habit?.color ?? '#22c55e'

  async function handleSave() {
    if (!habitId || minutes < 1) return
    setSaving(true)
    await createHabitLog({ habitId, date: today(), value: minutes })
    setSaving(false)
    reset()
    onSaved()
  }

  return (
    <>
      <div className="overflow-y-auto flex-1 px-5 pb-4 flex flex-col gap-6">
        {/* 経過時間 */}
        <div className="pt-4 text-center">
          <p
            className="text-6xl font-bold tabular-nums tracking-tight transition-colors"
            style={{ color: running ? color : '#1f2937' }}
          >
            {formatElapsed(elapsed)}
          </p>
          <p className="text-xs text-gray-400 mt-2 h-4">
            {running ? '計測中… 画面を閉じても計測は続きます' : elapsed > 0 ? '一時停止中' : ''}
          </p>
        </div>

        {/* 操作 */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            disabled={running || elapsed === 0}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            リセット
          </button>
          <button
            onClick={running ? pause : start}
            className="flex-[2] py-3.5 rounded-2xl text-white font-bold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: running ? '#6b7280' : color }}
          >
            {running ? '一時停止' : elapsed > 0 ? '再開' : 'スタート'}
          </button>
        </div>

        {/* 記録先の習慣 */}
        <div>
          <p className="text-sm text-gray-600 mb-2">記録する習慣</p>
          {minuteHabits.length === 0 ? (
            <p className="text-sm text-gray-400">単位が「分」の習慣を追加すると、計測した時間を記録できます</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {minuteHabits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHabitId(h.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                  style={
                    h.id === habitId
                      ? { borderColor: h.color, backgroundColor: `${h.color}1a`, color: h.color }
                      : { borderColor: '#e5e7eb', color: '#4b5563' }
                  }
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                  {h.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 記録ボタン */}
      <div className="px-5 pb-8 pt-2 flex-shrink-0 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving || !habit || minutes < 1}
          className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-base disabled:opacity-50 transition-colors"
        >
          {saving
            ? '保存中...'
            : !habit
              ? '記録できる習慣がありません'
              : minutes >= 1
                ? `今日の「${habit.name}」に ${minutes} 分を記録`
                : '1分以上計測すると記録できます'}
        </button>
      </div>
    </>
  )
}
