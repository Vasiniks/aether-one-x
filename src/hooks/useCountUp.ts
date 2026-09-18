import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

/** Animates a number from 0 to `target` when `run` becomes true. */
export function useCountUp(target: number, run: boolean, duration = 1000): number {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!run) return
    const effective = reduce ? 0 : duration
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / effective)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, target, duration, reduce])

  return run ? value : 0
}