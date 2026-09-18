import { motion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Editorial building blocks for the film overlay. The premium instrument look:
 * a compact display headline, a thin rule, then the giant hero numeral, then
 * hairline-ruled data rows. Everything reveals against the act-local `local`
 * motion value (0..1 inside the current act) in explicit progress windows, so
 * each number lands exactly as its hardware beat plays, without a re-render.
 */

export interface SpecLine {
  k: string
  v: string
}

export interface EditorialTier {
  num: string
  unit: string
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

/** A 1px editorial rule that draws itself in over a window. */
export function Hairline({
  local,
  from = 0,
  to = 0.12,
  className,
  vertical = false,
  reversed = false,
}: {
  local: MotionValue<number>
  from?: number
  to?: number
  /** Class controls the line's extent (w-* for horizontal, h-* for vertical). */
  className?: string
  vertical?: boolean
  reversed?: boolean
}) {
  const opacity = useTransform(local, [from, to], [0, 1])
  const growth = useTransform(local, [from, to], [0, 1])
  const style = vertical
    ? { opacity, scaleY: growth, transformOrigin: reversed ? 'bottom center' : 'top center' }
    : { opacity, scaleX: growth, transformOrigin: reversed ? 'right center' : 'left center' }
  return <motion.span aria-hidden="true" className={className} style={style} />
}

/**
 * The core editorial stat: [headline] / thin rule / [giant numeral + unit]
 * / hairline-ruled instrument rows / note. Left, right, or center aligned.
 */
export function EditorialStat({
  local,
  headline,
  headlineFrom = 0.1,
  num,
  numFrom = 0.28,
  numUnit,
  unitFrom = 0.4,
  rows,
  rowsFrom = 0.55,
  note,
  noteFrom = 0.68,
  align = 'left',
  ruleFrom = 0.24,
}: {
  local: MotionValue<number>
  headline?: string
  headlineFrom?: number
  num?: string
  numFrom?: number
  numUnit?: string
  unitFrom?: number
  rows?: SpecLine[]
  rowsFrom?: number
  note?: string
  noteFrom?: number
  align?: 'left' | 'center'
  ruleFrom?: number
}) {
  const dir = align === 'center' ? 'items-center text-center' : 'items-start text-left'
  const unitRow = align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <div className={`flex flex-col ${dir}`}>
      {headline ? (
        <RevealWindow
          local={local}
          from={headlineFrom}
          to={Math.min(1, headlineFrom + 0.1)}
        >
          <h3 className="text-2xl leading-[1.04] font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {headline}
          </h3>
        </RevealWindow>
      ) : null}

      <Hairline
        local={local}
        from={ruleFrom}
        to={Math.min(1, ruleFrom + 0.1)}
        className={`mt-4 h-px w-14 bg-gradient-to-r from-white/60 to-white/10 ${align === 'center' ? 'mx-auto' : ''}`}
      />

      {num ? (
        <RevealWindow local={local} from={numFrom} to={Math.min(1, numFrom + 0.1)} className="mt-5">
          <div className={`flex items-end gap-4 ${unitRow}`}>
            <span className="spec-num spec-num--gradient text-[clamp(88px,17vw,168px)]">{num}</span>
            {numUnit ? (
              <RevealWindow
                local={local}
                from={unitFrom ?? numFrom + 0.1}
                to={Math.min(1, (unitFrom ?? numFrom + 0.1) + 0.08)}
                className="mb-3"
              >
                <span className="spec-unit">{numUnit}</span>
              </RevealWindow>
            ) : null}
          </div>
        </RevealWindow>
      ) : null}

      {rows?.length ? <SpecList local={local} from={rowsFrom} rows={rows} /> : null}

      {note ? <NoteLine local={local} from={noteFrom} note={note} className="mt-5" /> : null}
    </div>
  )
}

/** Hairline-ruled spec rows with instrument-style display values. */
export function SpecList({
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
    <RevealWindow local={local} from={from} to={Math.min(1, from + 0.14)} className={`mt-5 ${className ?? ''}`}>
      <dl>
        {rows.map((row) => (
          <div key={row.k} className="mt-3 flex items-baseline justify-between gap-8 border-t border-white/10 pt-3">
            <dt className="spec-tech">{row.k}</dt>
            <dd className="font-display text-[17px] font-medium tracking-tight text-ink tabular-nums">
              {row.v}
            </dd>
          </div>
        ))}
      </dl>
    </RevealWindow>
  )
}

/** Wide bottom-banner composition for the display act: number + ruled columns. */
export function DisplayBar({
  local,
  title,
  num,
  numUnit,
  rows,
  titleFrom = 0.08,
  numFrom = 0.2,
  unitFrom = 0.3,
  rowsFrom = 0.5,
}: {
  local: MotionValue<number>
  title?: string
  num?: string
  numUnit?: string
  rows?: SpecLine[]
  titleFrom?: number
  numFrom?: number
  unitFrom?: number
  rowsFrom?: number
}) {
  return (
    <div className="flex w-full flex-col items-center text-center">
      {title ? <TitleLine local={local} from={titleFrom} title={title} /> : null}

      {num ? (
        <RevealWindow local={local} from={numFrom} to={Math.min(1, numFrom + 0.1)} className="mt-2">
          <div className="flex items-end justify-center gap-4">
            <span className="spec-num spec-num--gradient text-[clamp(72px,13vw,136px)]">{num}</span>
            {numUnit ? (
              <RevealWindow
                local={local}
                from={unitFrom ?? numFrom + 0.1}
                to={Math.min(1, (unitFrom ?? numFrom + 0.1) + 0.08)}
                className="mb-2"
              >
                <span className="spec-unit">{numUnit}</span>
              </RevealWindow>
            ) : null}
          </div>
        </RevealWindow>
      ) : null}

      {rows?.length ? (
        <RevealWindow local={local} from={rowsFrom} to={Math.min(1, rowsFrom + 0.16)} className="mt-5 w-full">
          <div className="mx-auto flex max-w-3xl items-stretch divide-x divide-white/10 border-t border-white/10">
            {rows.map((row) => (
              <div key={row.k} className="flex flex-1 flex-col items-center gap-1.5 px-3 pt-3 sm:px-6">
                <span className="spec-tech">{row.k}</span>
                <span className="font-display text-[13px] font-medium tracking-tight text-ink tabular-nums sm:text-[15px]">
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        </RevealWindow>
      ) : null}
    </div>
  )
}

/** Ascending editorial tier list (storage capacities), sparse hairlines. */
export function TierSeries({
  local,
  title,
  titleFrom = 0.08,
  tiers,
  from = 0.18,
  note,
  noteFrom = 0.7,
}: {
  local: MotionValue<number>
  title?: string
  titleFrom?: number
  tiers: EditorialTier[]
  from?: number
  note?: string
  noteFrom?: number
}) {
  return (
    <div className="flex w-full flex-col items-start">
      {title ? <TitleLine local={local} from={titleFrom} title={title} /> : null}
      <div className="w-full">
        {tiers.map((tier, i) => (
          <RevealWindow
            key={`${tier.num}-${tier.unit}`}
            local={local}
            from={from + i * 0.12}
            to={Math.min(1, from + i * 0.12 + 0.1)}
            className={i > 0 ? 'mt-0 w-full border-t border-white/10 pt-4' : 'mt-6 w-full'}
          >
            <div className="flex items-baseline gap-4">
              <span className="spec-num spec-num--gradient text-[clamp(46px,8vw,84px)]">{tier.num}</span>
              <span className="spec-unit">{tier.unit}</span>
            </div>
          </RevealWindow>
        ))}
      </div>
      {note ? <NoteLine local={local} from={noteFrom} note={note} className="mt-6" /> : null}
    </div>
  )
}

/** Large display wordmark, left-set, with a short rule and optional note. */
export function Wordmark({
  local,
  from = 0.1,
  ruleFrom = 0.24,
  title,
  note,
  noteFrom = 0.45,
  className,
}: {
  local: MotionValue<number>
  from?: number
  ruleFrom?: number
  title: string
  note?: string
  noteFrom?: number
  className?: string
}) {
  return (
    <div className={`flex flex-col items-start ${className ?? ''}`}>
      <RevealWindow local={local} from={from} to={Math.min(1, from + 0.1)}>
        <h2 className="spec-num text-[clamp(52px,8.5vw,120px)] leading-[0.86] tracking-[-0.02em] text-ink">
          {title}
        </h2>
      </RevealWindow>
      <Hairline
        local={local}
        from={ruleFrom}
        to={Math.min(1, ruleFrom + 0.12)}
        className="mt-5 h-px w-24 bg-gradient-to-r from-white/50 to-white/10"
      />
      {note ? <NoteLine local={local} from={noteFrom} note={note} className="mt-4" /> : null}
    </div>
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