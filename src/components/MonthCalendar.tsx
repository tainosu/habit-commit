import { useMemo } from 'react'
import { toDateString } from '../utils/dateUtils'
import type { HabitLog } from '../types'

interface Props {
  logs: HabitLog[]
  color: string
  maxValue: number
  month: string // YYYY-MM
  onDayClick?: (date: string) => void
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function colorForLevel(baseColor: string, level: number): string {
  if (level === 0) return '#ebedf0'
  const { r, g, b } = hexToRgb(baseColor)
  const alpha = 0.2 + (level / 4) * 0.8
  const bg = 235
  return `rgb(${Math.round(bg + (r - bg) * alpha)}, ${Math.round(bg + (g - bg) * alpha)}, ${Math.round(bg + (b - bg) * alpha)})`
}

export default function MonthCalendar({ logs, color, maxValue, month, onDayClick }: Props) {
  const todayStr = toDateString(new Date())

  const logMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const log of logs) m[log.date] = (m[log.date] ?? 0) + log.value
    return m
  }, [logs])

  // 月の全日付を生成
  const [year, monthNum] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const firstDow = new Date(year, monthNum - 1, 1).getDay() // 0=Sun

  // カレンダーグリッド（日曜始まり、前月の空白を含む）
  const cells: Array<string | null> = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, '0')}`)
  }
  // 最終行を埋める
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: Array<Array<string | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  function levelOf(date: string): number {
    const val = logMap[date] ?? 0
    if (val === 0) return 0
    return Math.min(4, Math.ceil((val / maxValue) * 4))
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="select-none">
      {/* 曜日ヘッダ */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs py-1 font-medium ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      {/* 日付グリッド */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date, di) => {
              if (!date) return <div key={di} />
              const isFuture = date > todayStr
              const isToday = date === todayStr
              const level = isFuture ? 0 : levelOf(date)
              const dayNum = parseInt(date.slice(8))
              const dow = di // 0=Sun in this layout
              return (
                // 記録・編集できるのは当日のみ（過去日は閲覧のみ）
                <button
                  key={date}
                  onClick={() => isToday && onDayClick?.(date)}
                  disabled={!isToday}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                    isToday ? 'cursor-pointer transition-transform active:scale-95' : 'cursor-default'
                  } ${isFuture ? 'opacity-25' : ''}`}
                  style={{
                    backgroundColor: isFuture ? '#f3f4f6' : colorForLevel(color, level),
                    color: level >= 3 ? 'white' : dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : '#374151',
                    outline: isToday ? `2px solid ${color}` : undefined,
                    outlineOffset: isToday ? '2px' : undefined,
                  }}
                  title={`${date}: ${logMap[date] ?? 0}`}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
