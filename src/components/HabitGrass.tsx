import { useMemo } from 'react'
import { buildCalendarDates, today } from '../utils/dateUtils'
import { colorForLevel } from '../utils/levelUtils'

interface Props {
  levelMap: Record<string, number> // 日付 -> 濃さ（0〜4）
  color: string
}

const WEEKS = 26 // 半年分

export default function HabitGrass({ levelMap, color }: Props) {
  const dates = useMemo(() => buildCalendarDates(WEEKS), [])
  const todayStr = today()

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
                const level = levelMap[date] ?? 0
                const isFuture = date > todayStr
                return (
                  <div
                    key={date}
                    title={date}
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
