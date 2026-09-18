import { motion, useReducedMotion } from 'motion/react'

/**
 * Art-directed spec annotations for the Aether A1 Ultra beat. Small anchored
 * tags hang off the die the way a silicon datasheet draws block diagrams -
 * dots with hairlines radiating from the chip outline. Screen-space only, so
 * they stay legible at every viewport.
 */

interface ChipTag {
  label: string
  detail: string
  x: string
  y: string
  from: 'top' | 'bottom' | 'left' | 'right'
}

const TAGS: ChipTag[] = [
  { label: '3 NM', detail: 'SECOND-GEN EUV', x: '50%', y: '20%', from: 'bottom' },
  { label: '8-CORE CPU', detail: '2x4.4 GHZ', x: '72%', y: '39%', from: 'left' },
  { label: '14-CORE GPU', detail: 'HW RAY-TRACING', x: '70%', y: '60%', from: 'top' },
  { label: '25 TOPS NPU', detail: 'ON-DEVICE AETHER', x: '28%', y: '44%', from: 'right' },
  { label: 'A1 ULTRA', detail: '171 mm²', x: '33%', y: '70%', from: 'top' },
]

export function ChipAnnotations() {
  const reduce = useReducedMotion()

  return (
    <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
      {TAGS.map((tag, i) => (
        <motion.div
          key={tag.label}
          initial={reduce ? false : { opacity: 0, scale: 0.92, x: tag.from === 'left' ? 12 : tag.from === 'right' ? -12 : 0 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
          className="absolute"
          style={{ left: tag.x, top: tag.y }}
        >
          {/* Anchor dot + short hairline pointing at the die */}
          <span className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-sky-300/80 bg-sky-300/25" />
          <span className="absolute top-1/2 h-px w-9 -translate-y-1/2 bg-gradient-to-r from-white/25 to-transparent" />
          <div className="translate-x-12 -translate-y-1/2">
            <p className="font-mono text-[10px] font-semibold tracking-[0.22em] text-sky-200">{tag.label}</p>
            <p className="mt-0.5 font-mono text-[9px] tracking-[0.18em] text-white/45">{tag.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}