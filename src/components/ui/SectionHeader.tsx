import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { Reveal } from './Reveal'

interface SectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  className?: string
  titleClassName?: string
}

/** Consistent editorial section heading: eyebrow, display title, one lead line. */
export function SectionHeader({ eyebrow, title, lead, className, titleClassName }: SectionHeaderProps) {
  return (
    <div className={cn('max-w-3xl', className)}>
      {eyebrow ? (
        <Reveal>
          <p className="font-mono text-[11px] tracking-[0.28em] text-aether uppercase">{eyebrow}</p>
        </Reveal>
      ) : null}
      <Reveal delay={80}>
        <h2
          className={cn(
            'mt-4 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl',
            titleClassName,
          )}
        >
          {title}
        </h2>
      </Reveal>
      {lead ? (
        <Reveal delay={160}>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-dim sm:text-lg">{lead}</p>
        </Reveal>
      ) : null}
    </div>
  )
}