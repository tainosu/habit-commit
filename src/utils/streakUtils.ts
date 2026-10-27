import { toDateString } from './dateUtils'
import type { HabitLog } from '../types'

export function calcStreak(logs: HabitLog[], habitId?: string): number {
  const relevant = habitId != null ? logs.filter((l) => l.habitId === habitId) : logs
  const logDates = new Set(relevant.map((l) => l.date))

  const d = new Date()
  // 今日まだ記録がなければ昨日から数える（streak は壊れていない）
  if (!logDates.has(toDateString(d))) {
    d.setDate(d.getDate() - 1)
  }

  let streak = 0
  while (logDates.has(toDateString(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
