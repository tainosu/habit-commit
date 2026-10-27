import { useRef, useEffect } from 'react'
import type { Habit } from '../types'

interface Props {
  habits: Habit[]
  selected: string | null // null = 全体
  onChange: (id: string | null) => void
}

export default function TabBar({ habits, selected, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 選択タブが見えるようにスクロール
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const active = el.querySelector<HTMLElement>('[data-active="true"]')
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selected])

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10">
      <div
        ref={scrollRef}
        className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        <TabItem
          label="全体"
          color="#22c55e"
          active={selected === null}
          onClick={() => onChange(null)}
        />
        {habits.map((h) => (
          <TabItem
            key={h.id}
            label={h.name}
            color={h.color}
            active={selected === h.id}
            onClick={() => onChange(h.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TabItem({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
      }`}
      style={active ? { backgroundColor: color } : undefined}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : color }}
      />
      {label}
    </button>
  )
}
