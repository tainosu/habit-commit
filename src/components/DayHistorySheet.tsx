import { useState, useEffect } from 'react'
import type { Habit, HabitLog } from '../types'

interface Props {
  date: string
  habits: Habit[]
  logs: HabitLog[]
  onClose: () => void
}

/** 過去日の記録を閲覧するだけのシート（編集不可） */
export default function DayHistorySheet({ date, habits, logs, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // mount後にアニメーション開始
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  // その日に記録がある習慣と合計値
  const entries = habits
    .map((habit) => ({
      habit,
      total: logs.filter((l) => l.habitId === habit.id && l.date === date).reduce((s, l) => s + l.value, 0),
    }))
    .filter((e) => e.total > 0)

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

        <div className="px-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-800">{dateLabel} の記録</h2>
          <p className="text-xs text-gray-400 mt-0.5">過去の記録は閲覧のみです</p>
        </div>

        {/* 記録リスト */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 flex flex-col gap-2">
          {entries.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">この日の記録はありません</p>
          ) : (
            entries.map(({ habit, total }) => (
              <div key={habit.id} className="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                <span className="font-semibold text-gray-800">{habit.name}</span>
                <span className="ml-auto text-sm font-semibold tabular-nums" style={{ color: habit.color }}>
                  {total} {habit.unit === 'minutes' ? '分' : '回'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 閉じるボタン */}
        <div className="px-5 pb-8 pt-2 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-600 font-bold text-base hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
