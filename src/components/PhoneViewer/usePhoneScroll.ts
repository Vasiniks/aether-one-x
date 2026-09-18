import { useEffect, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'

/**
 * Feature sections that drive the 3D presentation. `id` values map 1:1 to
 * section element ids used across the pages. Missing sections are ignored.
 */
export const STORY_SECTIONS = [
  'overview',
  'reveal',
  'cameras',
  'performance',
  'display',
  'software',
  'buy',
  'specs',
  'final',
]

export interface StoryState {
  /** Section id currently closest to the viewport's upper-middle line. */
  active: string
  /** Progress (0..1) of each section through the viewport. */
  progress: Record<string, number>
}

let story: StoryState = { active: 'overview', progress: {} }
const listeners = new Set<(state: StoryState) => void>()
let cache = ''

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function measure(): StoryState {
  const progress: Record<string, number> = {}
  const mid = window.innerHeight * 0.55
  let active = 'overview'
  let best = Infinity
  for (const id of STORY_SECTIONS) {
    const el = document.getElementById(id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    progress[id] = clamp01((mid - rect.top) / Math.max(1, rect.height))
    const distance = Math.abs(mid - (rect.top + rect.height / 2))
    if (distance < best) {
      best = distance
      active = id
    }
  }
  return { active, progress }
}

function publish(next: StoryState) {
  const key = `${next.active}|${STORY_SECTIONS.map((id) => `${id}:${(next.progress[id] ?? 0).toFixed(3)}`).join('|')}`
  if (key === cache) return
  cache = key
  story = next
  listeners.forEach((listener) => listener(story))
}

/**
 * Global scroll position tracker. Mount once (App): re-flow existence is
 * measured from Motion's scroll position, then shared with every 3D viewer.
 */
export function StoryTracker() {
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', () => {
    if (typeof window === 'undefined') return
    publish(measure())
  })
  useEffect(() => {
    publish(measure())
  }, [])
  return null
}

/** Reactive handle to the global story state shared by every 3D viewer. */
export function useStorySnapshot(): StoryState {
  const [, force] = useState(0)
  useEffect(() => {
    const listener = (state: StoryState) => {
      story = state
      force((n) => n + 1)
    }
    listeners.add(listener)
    listener(story)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return story
}