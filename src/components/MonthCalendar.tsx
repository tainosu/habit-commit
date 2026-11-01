import { toDateString } from '../utils/dateUtils'
import { colorForLevel } from '../utils/levelUtils'

interface Props {
  levelMap: Record<string, number> // 日付 -> 濃さ（0〜4）
  color: string
  month: string // YYYY-MM
  onDayClick?: (date: string) => void
}

export default function MonthCalendar({ levelMap, color, month, onDayClick }: Props) {
  const todayStr = toDateString(new Date())

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
              const level = isFuture ? 0 : (levelMap[date] ?? 0)
              // 当日は記録・編集、記録のある過去日は閲覧のみ（記録があれば level >= 1）
              const clickable = isToday || level > 0
              const dayNum = parseInt(date.slice(8))
              const dow = di // 0=Sun in this layout
              return (
                <button
                  key={date}
                  onClick={() => clickable && onDayClick?.(date)}
                  disabled={!clickable}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                    clickable ? 'cursor-pointer transition-transform active:scale-95' : 'cursor-default'
                  } ${isFuture ? 'opacity-25' : ''}`}
                  style={{
                    backgroundColor: isFuture ? '#f3f4f6' : colorForLevel(color, level),
                    color: level >= 3 ? 'white' : dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : '#374151',
                    outline: isToday ? `2px solid ${color}` : undefined,
                    outlineOffset: isToday ? '2px' : undefined,
                  }}
                  title={date}
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
