import { useState } from 'react'
import type { Habit } from '../types'

const PRESET_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

interface Props {
  onAdd: (habit: Pick<Habit, 'name' | 'unit' | 'color'>) => Promise<void>
  onClose: () => void
}

export default function AddHabitModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<'minutes' | 'count'>('minutes')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onAdd({ name: name.trim(), unit, color })
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-4">習慣を追加</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 名前 */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">習慣名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 読書、筋トレ..."
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          {/* 単位 */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">記録の単位</label>
            <div className="flex gap-2">
              {(['minutes', 'count'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    unit === u
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {u === 'minutes' ? '時間（分）' : '回数'}
                </button>
              ))}
            </div>
          </div>

          {/* 色 */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">草の色</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
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
              disabled={!name.trim() || loading}
              className="flex-1 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-40 transition-colors"
            >
              {loading ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
