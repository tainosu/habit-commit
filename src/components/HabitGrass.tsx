import { useMemo } from 'react'
import { buildCalendarDates, today } from '../utils/dateUtils'
import type { HabitLog } from '../types'

interface Props {
  logs: HabitLog[]
  color: string
  maxValue?: number
}

const WEEKS = 26 // 半年分

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

export default function HabitGrass({ logs, color, maxValue }: Props) {
  const dates = useMemo(() => buildCalendarDates(WEEKS), [])
  const todayStr = today()

  const logMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const log of logs) m[log.date] = (m[log.date] ?? 0) + log.value
    return m
  }, [logs])

  const autoMax = useMemo(() => {
    const vals = Object.values(logMap)
    return vals.length ? Math.max(...vals) : 1
  }, [logMap])

  const effectiveMax = maxValue ?? autoMax

  function levelOf(date: string): number {
    const val = logMap[date] ?? 0
    if (val === 0) return 0
    return Math.min(4, Math.ceil((val / effectiveMax) * 4))
  }

  // 日曜始まりで列に分割
  const columns: string[][] = []
  let col: string[] = []
  for (const d of dates) {
    const dow = new Date(d + 'T00:00:00').getDay()
    if (dow === 0 && col.length) {
      columns.push(col)
      col = []
    }
    col.push(d)
  }
  if (col.length) columns.push(col)

  // 月ラベル（列インデックス -> 月名）
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = ''
  columns.forEach((c, i) => {
    const month = c[0].slice(0, 7)
    if (month !== lastMonth) {
      const label = new Date(c[0] + 'T00:00:00').toLocaleString('ja-JP', { month: 'short' })
      monthLabels.push({ col: i, label })
      lastMonth = month
    }
  })

  const dayLabels = ['', '月', '', '水', '', '金', '']

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 select-none">
        {/* 月ラベル */}
        <div className="flex gap-[3px] ml-7 text-[10px] text-gray-500 mb-1" style={{ position: 'relative', height: 14 }}>
          {monthLabels.map(({ col, label }) => (
            <span
              key={col}
              style={{ position: 'absolute', left: col * 15 }}
              className="whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </div>
        {/* グリッド本体 */}
        <div className="flex gap-[3px]">
          {/* 曜日ラベル */}
          <div className="flex flex-col gap-[3px] mr-1">
            {dayLabels.map((l, i) => (
              <div key={i} className="w-5 h-[11px] text-[9px] text-gray-400 leading-none flex items-center">
                {l}
              </div>
            ))}
          </div>
          {/* セル */}
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {/* 列の先頭が日曜じゃない場合は空セルでパディング */}
              {Array.from({ length: new Date(col[0] + 'T00:00:00').getDay() }).map((_, pi) => (
                <div key={`p-${pi}`} className="w-[11px] h-[11px]" />
              ))}
              {col.map((date) => {
                const level = levelOf(date)
                const isFuture = date > todayStr
                return (
                  <div
                    key={date}
                    title={`${date}: ${logMap[date] ?? 0}`}
                    className="w-[11px] h-[11px] rounded-[2px]"
                    style={{
                      backgroundColor: isFuture ? 'transparent' : colorForLevel(color, level),
                      border: isFuture ? 'none' : undefined,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
