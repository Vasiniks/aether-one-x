import { useState } from 'react'
import type { MotionValue } from 'motion/react'
import { useMotionValue, useMotionValueEvent } from 'motion/react'
import { ACTS, actAt, type ActDef } from '../story'

/**
 * Tracks which movie act the viewer is inside of, driven purely by the master
 * scroll progress. React only re-renders on act boundaries; `local` (a motion
 * value) flows to styles without re-rendering.
 */
export function useChapter(progress: MotionValue<number>) {
  const [act, setAct] = useState<ActDef>(ACTS[0])
  const local = useMotionValue(0)

  useMotionValueEvent(progress, 'change', (v) => {
    const a = actAt(v)
    setAct((prev) => (prev.id === a.id ? prev : a))
    local.set(Number(((v - a.start) / (a.end - a.start)).toFixed(4)))
  })

  return { act, local }
}