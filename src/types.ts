export interface Habit {
  id: string
  name: string
  unit: 'minutes' | 'count'
  color: string
  createdAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  value: number
}
