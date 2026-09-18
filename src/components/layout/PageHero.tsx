import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { Reveal } from '../ui/Reveal'

interface PageHeroProps {
  /** Small mono technical label ("PRODUCT / CAMERAS"). Not a decorative eyebrow. */
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  meta?: { k: string; v: string }[]
  /** Right-hand slot: a 3D viewer, image, or decorative figure. */
  children?: ReactNode
  className?: string
  titleClassName?: string
}

/** Shared editorial page header: big display type, one lead line, a stat strip. */
export function PageHero({
  kicker,
  title,
  lead,
  meta,
  children,
  className,
  titleClassName,
}: PageHeroProps) {
  return (
    <section className={cn('relative overflow-hidden pt-36 pb-14 lg:pt-44 lg:pb-16', className)}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {kicker ? (
              <Reveal>
                <p className="font-mono text-[11px] tracking-[0.28em] text-aether uppercase">{kicker}</p>
              </Reveal>
            ) : null}
            <Reveal delay={80}>
              <h1
                className={cn(
                  'mt-5 text-5xl leading-[0.95] font-semibold tracking-tight text-ink sm:text-7xl lg:text-[5rem]',
                  titleClassName,
                )}
              >
                {title}
              </h1>
            </Reveal>
            {lead ? (
              <Reveal delay={160}>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-dim sm:text-xl">{lead}</p>
              </Reveal>
            ) : null}
            {meta ? (
              <Reveal delay={220}>
                <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-4">
                  {meta.map((m) => (
                    <div key={m.k} className="bg-[#0d0f17] px-4 py-4">
                      <dd className="font-mono text-lg font-medium text-ink tabular-nums">{m.v}</dd>
                      <dt className="mt-1 text-[10.5px] tracking-wide text-faint uppercase">{m.k}</dt>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ) : null}
          </div>
          {children ? <div className="lg:justify-self-end">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}