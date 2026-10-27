export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today(): string {
  return toDateString(new Date())
}

/** 過去 weeksCount 週分の日付を月曜始まりで返す（古い順） */
export function buildCalendarDates(weeksCount = 52): string[] {
  const dates: string[] = []
  const end = new Date()
  // 今週の日曜日まで伸ばす（列を揃えるため）
  const dayOfWeek = end.getDay() // 0=Sun
  const start = new Date(end)
  start.setDate(end.getDate() - weeksCount * 7 - dayOfWeek)

  const cur = new Date(start)
  while (cur <= end) {
    dates.push(toDateString(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

/** YYYY-MM-DD -> 月名 */
export function monthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleString('ja-JP', { month: 'short' })
}
