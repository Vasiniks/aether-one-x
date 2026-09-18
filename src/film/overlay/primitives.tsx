import { motion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Editorial building blocks for the film overlay. Everything reveals against
 * the act-local `local` motion value (0..1 inside the current act), so blocks
 * sequence in as the camera work lands, without any re-render.
 */

export interface SpecLine {
  k: string
  v: string
}

/** Fades/slides a block in as `local` crosses a window. */
export function RevealWindow({
  local,
  from = 0,
  to = 1,
  children,
  className,
}: {
  local: MotionValue<number>
  from?: number
  to?: number
  children?: ReactNode
  className?: string
}) {
  const opacity = useTransform(local, [from, to], [0, 1])
  const y = useTransform(local, [from, to], [16, 0])
  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  )
}

export function NumeralBlock({
  local,
  from,
  unitFrom,
  num,
  unit,
  align = 'center',
}: {
  local: MotionValue<number>
  from: number
  unitFrom?: number
  num: string
  unit?: string
  align?: 'center' | 'left' | 'right'
}) {
  const dir =
    align === 'center' ? 'items-center' : align === 'left' ? 'items-start' : 'items-end'
  const unitWrap =
    align === 'center'
      ? 'flex w-full justify-center'
      : align === 'left'
        ? 'flex w-full justify-start'
        : 'flex w-full justify-end'
  return (
    <RevealWindow local={local} from={from} to={Math.min(1, from + 0.08)} className={`flex flex-col ${dir}`}>
      <span className="spec-num spec-num--gradient text-[clamp(92px,19vw,192px)]">{num}</span>
      {unit ? (
        <RevealWindow local={local} from={unitFrom ?? from + 0.1} to={Math.min(1, (unitFrom ?? from + 0.1) + 0.08)} className={unitWrap}>
          <span className="spec-unit mt-3">{unit}</span>
        </RevealWindow>
      ) : null}
    </RevealWindow>
  )
}

/** Stacked technical rows with hairline seams (the datasheet column). */
export function TechRuler({
  local,
  from,
  rows,
  className,
}: {
  local: MotionValue<number>
  from: number
  rows: SpecLine[]
  className?: string
}) {
  return (
    <RevealWindow local={local} from={from} to={Math.min(1, from + 0.12)} className={className}>
      <dl className="min-w-52">
        {rows.map((row) => (
          <div key={row.k} className="mt-2.5 flex items-baseline justify-between gap-8 border-t border-white/10 pt-2.5">
            <dt className="spec-tech">{row.k}</dt>
            <dd className="spec-tech">
              <strong>{row.v}</strong>
            </dd>
          </div>
        ))}
        <div className="spec-hair mt-2.5 opacity-50" aria-hidden="true" />
      </dl>
    </RevealWindow>
  )
}

/** Display title used on the centered acts. */
export function TitleLine({
  local,
  from,
  title,
  className,
}: {
  local: MotionValue<number>
  from: number
  title: string
  className?: string
}) {
  return (
    <RevealWindow local={local} from={from} to={Math.min(1, from + 0.1)} className={className}>
      <h3 className="text-4xl leading-[0.98] font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
        {title}
      </h3>
    </RevealWindow>
  )
}

export function NoteLine({
  local,
  from,
  note,
  className,
}: {
  local: MotionValue<number>
  from: number
  note: string
  className?: string
}) {
  return (
    <RevealWindow local={local} from={from} to={Math.min(1, from + 0.12)} className={className}>
      <p className="max-w-sm text-[13px] leading-relaxed text-dim sm:text-[14px]">{note}</p>
    </RevealWindow>
  )
}

/** Big borderline numbers for the x-ray editorial moment. */
export function XRayRead({ x, y, z }: { x: string; y: string; z: string }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.22em] text-white/45">
      <div className="flex gap-6">
        <span>X {x}</span>
        <span>Y {y}</span>
        <span>Z {z}</span>
      </div>
      <p className="mt-2 text-[9px] tracking-[0.3em] text-faint">INTERNAL LAYOUT, LIVE</p>
    </div>
  )
}