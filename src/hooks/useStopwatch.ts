import { useState, useEffect } from 'react'

const STORAGE_KEY = 'habit-commit:stopwatch'

interface StopwatchState {
  startedAt: number | null // 計測中なら開始時刻（ms）、停止中は null
  accumulated: number // 一時停止までに積み上げた時間（ms）
}

const INITIAL: StopwatchState = { startedAt: null, accumulated: 0 }

function load(): StopwatchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StopwatchState
  } catch {
    // 読めなければ初期状態から
  }
  return INITIAL
}

/**
 * 開始時刻ベースのストップウォッチ。
 * iOS でアプリがバックグラウンドに回ったり再読み込みされても、
 * 経過時間は時刻の差分で求めるのでずれない（状態は localStorage に保持）。
 */
export function useStopwatch() {
  const [state, setState] = useState<StopwatchState>(load)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 保存できなくても計測自体は続ける
    }
  }, [state])

  // 計測中だけ表示を更新
  useEffect(() => {
    if (state.startedAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state.startedAt])

  const running = state.startedAt != null
  const elapsed = state.accumulated + (state.startedAt != null ? Math.max(0, now - state.startedAt) : 0)

  function start() {
    const t = Date.now()
    setNow(t)
    setState((s) => (s.startedAt != null ? s : { ...s, startedAt: t }))
  }

  function pause() {
    const t = Date.now()
    setNow(t)
    setState((s) =>
      s.startedAt == null ? s : { startedAt: null, accumulated: s.accumulated + (t - s.startedAt) },
    )
  }

  function reset() {
    setState(INITIAL)
  }

  return { elapsed, running, start, pause, reset }
}

export type Stopwatch = ReturnType<typeof useStopwatch>

/** ms -> "m:ss" / "h:mm:ss" */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
