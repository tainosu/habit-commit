/** 草の濃さは 0（記録なし）〜 4 の5段階 */
export const MAX_LEVEL = 4

/**
 * 習慣ごとの濃さ: その日の合計 ÷ 1日の目標
 * 0: 記録なし / 1: 〜49% / 2: 50〜99% / 3: 100〜149%（目標達成） / 4: 150%〜
 */
export function goalLevel(value: number, dailyGoal: number): number {
  if (value <= 0) return 0
  const ratio = value / dailyGoal
  if (ratio < 0.5) return 1
  if (ratio < 1) return 2
  if (ratio < 1.5) return 3
  return 4
}

/**
 * 全体の濃さ: 目標を達成した習慣の数 ÷ 習慣の数
 * 記録のある日にだけ使う（記録はあるが未達成なら 1、全習慣達成で 4）
 */
export function overallLevel(achieved: number, total: number): number {
  if (achieved === 0 || total === 0) return 1
  if (achieved >= total) return 4
  return achieved / total < 0.5 ? 2 : 3
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function colorForLevel(baseColor: string, level: number): string {
  if (level === 0) return '#ebedf0'
  const { r, g, b } = hexToRgb(baseColor)
  const alpha = 0.2 + (level / MAX_LEVEL) * 0.8
  const bg = 235
  return `rgb(${Math.round(bg + (r - bg) * alpha)}, ${Math.round(bg + (g - bg) * alpha)}, ${Math.round(bg + (b - bg) * alpha)})`
}
