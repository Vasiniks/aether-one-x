import { BATTERY, type UsageHours, type UsageKey } from '../data/product'

/** Total energy consumed for a given usage schedule, in mAh. Deterministic. */
export function consumedMah(usage: UsageHours): number {
  return Object.entries(usage).reduce((total, [key, hours]) => {
    return total + hours * BATTERY.drainPerHour[key as UsageKey]
  }, 0)
}

/** Percentage of the 5200 mAh cell remaining after the schedule. Clamped to 0-100. */
export function remainingPercent(usage: UsageHours): number {
  const consumed = consumedMah(usage)
  const pct = ((BATTERY.capacity - consumed) / BATTERY.capacity) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

/** Rough remaining on-time given the measured average drain. Deterministic. */
export function hoursToEmpty(usage: UsageHours): number | null {
  const consumed = consumedMah(usage)
  const totalHours = Object.values(usage).reduce((a, b) => a + b, 0)
  if (consumed >= BATTERY.capacity) return 0
  if (totalHours <= 0) return null
  const avgDrain = consumed / totalHours
  return (BATTERY.capacity - consumed) / avgDrain
}

export function totalHours(usage: UsageHours): number {
  return Object.values(usage).reduce((a, b) => a + b, 0)
}