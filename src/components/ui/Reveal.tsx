import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger support: pass a per-item millisecond delay. */
  delay?: number
  style?: CSSProperties
}

/** Fades and lifts children into view on first intersection. */
export function Reveal({ children, className, delay = 0, style }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn('reveal', inView && 'is-visible', className)}
      style={{ '--reveal-delay': `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </div>
  )
}