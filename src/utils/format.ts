export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}