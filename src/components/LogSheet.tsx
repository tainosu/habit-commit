import { useState, useEffect } from 'react'
import { createHabitLog } from '../db'
import type { Habit, HabitLog } from '../types'

interface Props {
  date: string
  habits: Habit[]
  logs: HabitLog[]
  onClose: () => void
  onSaved: () => void
}

const QUICK_MINUTES = [10, 30, 60]
const QUICK_COUNT = [1, 3, 5]

export default function LogSheet({ date, habits, logs, onClose, onSaved }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // mount後にアニメーション開始
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

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
      handleClose()
      return
    }

    setSaving(true)
    for (const e of entries) {
      await createHabitLog({ habitId: e.habitId, date, value: e.value })
    }
    setSaving(false)
    setVisible(false)
    setTimeout(onSaved, 300)
  }

  const [y, m, d] = date.split('-').map(Number)
  const dateLabel = `${y}年${m}月${d}日`

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
        className="relative w-full bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 max-h-[80vh] flex flex-col"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-2 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-800">{dateLabel} の記録</h2>
        </div>

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
      </div>
    </div>
  )
}
