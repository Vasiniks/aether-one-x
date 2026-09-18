import { motion, useTransform, useReducedMotion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { ReactNode } from 'react'
import { PERFORMANCE } from '../../data/product'

/**
 * Art-directed spec annotations for the Aether A1 Ultra beat. Tags hang off
 * the die on hairlines that point back at it, datasheet style, over a faint
 * die outline and coordinate grid. Reveal is scroll-driven: the labels file in
 * one by one as the camera completes the dive into the cavity.
 */

interface ChipTag {
  label: string
  detail: string
  x: string
  y: string
  side: 'top' | 'bottom' | 'left' | 'right'
}

const TAGS: ChipTag[] = [
  { label: 'A1 ULTRA', detail: '171 mm²', x: '50%', y: '24%', side: 'bottom' },
  { label: '3 NM', detail: 'SECOND-GEN EUV', x: '74%', y: '38%', side: 'left' },
  { label: '8-CORE CPU', detail: '2x4.4 GHZ', x: '76%', y: '62%', side: 'top' },
  { label: `${PERFORMANCE.npu.hero.value} TOPS NPU`, detail: 'ON-DEVICE', x: '30%', y: '60%', side: 'right' },
  { label: '14-CORE GPU', detail: 'HW RAY-TRACING', x: '27%', y: '82%', side: 'top' },
]

const RULE = 36

function Tag({ tag, index, local, reduce }: {
  tag: ChipTag
  index: number
  local: MotionValue<number>
  reduce: boolean
}) {
  const from = 0.55 + index * 0.06
  const opacity = useTransform(local, [from, from + 0.05], [0, 1])
  const drift = useTransform(local, [from, from + 0.09], [12, 0])

  const dot = 'absolute top-1/2 left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/80 bg-sky-300/25'

  let rule: ReactNode
  let label: ReactNode
  if (tag.side === 'left') {
    rule = (
      <span className="absolute top-1/2 right-[calc(100%-2px)] h-px -translate-y-1/2 origin-right bg-gradient-to-r from-sky-300/70 to-transparent" style={{ width: RULE }} />
    )
    label = (
      <span className="absolute top-1/2 right-[calc(100%+34px)] -translate-y-1/2 text-right">
        <TagText tag={tag} />
      </span>
    )
  } else if (tag.side === 'right') {
    rule = (
      <span className="absolute top-1/2 left-[calc(100%-2px)] h-px -translate-y-1/2 bg-gradient-to-l from-sky-300/70 to-transparent" style={{ width: RULE }} />
    )
    label = (
      <span className="absolute top-1/2 left-[calc(100%+8px)] -translate-y-1/2 text-left">
        <TagText tag={tag} />
      </span>
    )
  } else if (tag.side === 'top') {
    rule = (
      <span className="absolute left-1/2 bottom-[calc(100%-2px)] w-px origin-bottom bg-gradient-to-t from-sky-300/70 to-transparent" style={{ height: RULE }} />
    )
    label = (
      <span className="absolute bottom-[calc(100%+34px)] left-1/2 -translate-x-1/2 text-center">
        <TagText tag={tag} />
      </span>
    )
  } else {
    rule = (
      <span className="absolute left-1/2 top-[calc(100%-2px)] w-px origin-top bg-gradient-to-b from-sky-300/70 to-transparent" style={{ height: RULE }} />
    )
    label = (
      <span className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 text-center">
        <TagText tag={tag} />
      </span>
    )
  }

  return (
    <motion.div
      className="absolute"
      style={{ left: tag.x, top: tag.y, opacity, x: reduce ? 0 : drift }}
    >
      <span className={dot} />
      <span className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/25" aria-hidden="true" />
      {rule}
      {label}
    </motion.div>
  )
}

function TagText({ tag }: { tag: ChipTag }) {
  return (
    <>
      <p className="whitespace-nowrap font-mono text-[10px] font-semibold tracking-[0.22em] text-sky-200">
        {tag.label}
      </p>
      <p className="mt-0.5 whitespace-nowrap font-mono text-[9px] tracking-[0.18em] text-white/45">
        {tag.detail}
      </p>
    </>
  )
}

export function ChipAnnotations({ local }: { local: MotionValue<number> }) {
  const reduce = useReducedMotion()

  // The whole board fades in around the dive, then holds.
  const boardOpacity = useTransform(local, [0.5, 0.62], [0, 1])

  return (
    <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
      {/* Die outline + coordinate grid reference */}
      <motion.div
        className="absolute left-1/2 top-[44%] h-[24vmin] w-[24vmin] -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: boardOpacity }}
      >
        <div className="absolute inset-0 border border-white/12" />
        <div className="absolute -top-3 left-0 h-px w-5 bg-white/20" />
        <div className="absolute -top-3 right-0 h-px w-5 bg-white/20" />
        <div className="absolute -bottom-3 left-0 h-px w-5 bg-white/20" />
        <div className="absolute -bottom-3 right-0 h-px w-5 bg-white/20" />
        <div className="absolute top-0 left-1/2 h-full w-px border-l border-dashed border-white/6" />
        <div className="absolute top-1/2 left-0 h-px w-full border-t border-dashed border-white/6" />
      </motion.div>

      {TAGS.map((tag, i) => (
        <Tag key={tag.label} tag={tag} index={i} local={local} reduce={!!reduce} />
      ))}
    </div>
  )
}