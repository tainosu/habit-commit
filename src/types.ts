export interface Habit {
  id: string
  name: string
  unit: 'minutes' | 'count'
  color: string
  dailyGoal: number // 1日の目標（unit の単位）
  createdAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  value: number
}
