import type { ReactNode } from 'react'

export interface SpecLine {
  k: string
  v: string
}

/** Primary editorial caption for an act: kicker, giant line, supporting note. */
export function Caption({
  index,
  label,
  title,
  note,
  lines,
  metric,
  align = 'left',
}: {
  index: number
  label: string
  title: string
  note?: string
  lines?: SpecLine[]
  metric?: ReactNode
  align?: 'left' | 'right'
}) {
  const right = align === 'right'
  return (
    <div className={right ? 'flex flex-row-reverse items-end justify-between gap-10' : 'flex items-end justify-between gap-10'}>
      <div className={right ? 'max-w-md text-right' : 'max-w-md'}>
        <p
          className={
            right
              ? 'flex items-center justify-end gap-2.5 font-mono text-[10px] tracking-[0.3em] text-aether'
              : 'flex items-center gap-2.5 font-mono text-[10px] tracking-[0.3em] text-aether'
          }
        >
          <span className={right ? 'order-3 inline-block h-1.5 w-1.5 rounded-[1px] bg-aether' : 'inline-block h-1.5 w-1.5 rounded-[1px] bg-aether'} />
          <span>CHAPTER {String(index).padStart(2, '0')} / 13</span>
          <span className="text-white/15">/</span>
          <span className="text-white/45">{label}</span>
        </p>
        <h3 className="mt-4 text-[40px] leading-[0.98] font-semibold tracking-tight text-ink sm:text-6xl">
          {title}
        </h3>
        {note ? <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-dim">{note}</p> : null}
        {lines?.length ? (
          <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
            {lines.map((l) => (
              <div
                key={l.k}
                className={
                  right
                    ? 'flex flex-row-reverse items-baseline justify-between gap-8 font-mono text-[11px] tracking-[0.18em]'
                    : 'flex items-baseline justify-between gap-8 font-mono text-[11px] tracking-[0.18em]'
                }
              >
                <span className="text-ink">{l.v}</span>
                <span className="text-white/40">{l.k}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {metric ? (
        <div className={right ? 'shrink-0 text-left leading-none' : 'shrink-0 text-right leading-none'}>
          <div className="bg-gradient-to-b from-white to-white/35 bg-clip-text text-[84px] font-semibold tracking-tight text-transparent sm:text-[120px]">
            {metric}
          </div>
        </div>
      ) : null}
    </div>
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