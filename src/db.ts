import { supabase } from './lib/supabase'
import type { Habit, HabitLog } from './types'

// Supabase の snake_case 行型
interface HabitRow {
  id: string
  user_id: string
  name: string
  unit: 'minutes' | 'count'
  color: string
  created_at: string
}

interface HabitLogRow {
  id: string
  habit_id: string
  user_id: string
  date: string
  value: number
}

const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  unit: r.unit,
  color: r.color,
  createdAt: r.created_at,
})

const toHabitLog = (r: HabitLogRow): HabitLog => ({
  id: r.id,
  habitId: r.habit_id,
  date: r.date,
  value: r.value,
})

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase.from('habits').select('*').order('created_at')
  if (error) throw error
  return (data as HabitRow[]).map(toHabit)
}

export async function createHabit(
  data: Pick<Habit, 'name' | 'unit' | 'color'>,
): Promise<Habit> {
  const { data: row, error } = await supabase
    .from('habits')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return toHabit(row as HabitRow)
}

export async function removeHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

export async function fetchHabitLogs(): Promise<HabitLog[]> {
  const { data, error } = await supabase.from('habit_logs').select('*')
  if (error) throw error
  return (data as HabitLogRow[]).map(toHabitLog)
}

export async function createHabitLog(data: {
  habitId: string
  date: string
  value: number
}): Promise<void> {
  const { error } = await supabase.from('habit_logs').insert({
    habit_id: data.habitId,
    date: data.date,
    value: data.value,
  })
  if (error) throw error
}
