import { useState } from 'react'
import type { Habit } from '../types'

interface Props {
  habit: Habit
  onSave: (dailyGoal: number) => Promise<void>
  onClose: () => void
}

export default function EditGoalModal({ habit, onSave, onClose }: Props) {
  const [goal, setGoal] = useState(String(habit.dailyGoal))
  const [loading, setLoading] = useState(false)
  const unit = habit.unit === 'minutes' ? '分' : '回'
  const value = parseFloat(goal)
  const valid = !isNaN(value) && value > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    await onSave(value)
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-1">「{habit.name}」の1日の目標</h2>
        <p className="text-xs text-gray-400 mb-4">目標に対する達成率で草の濃さが決まります（100%で目標達成の色）</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              autoFocus
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 text-right"
            />
            <span className="text-sm text-gray-600">{unit} / 日</span>
          </div>

          {/* ボタン */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!valid || loading}
              className="flex-1 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-40 transition-colors"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
