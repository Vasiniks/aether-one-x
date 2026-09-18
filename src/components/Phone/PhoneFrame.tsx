import type { CSSProperties, ReactNode } from 'react'
import { FINISHES, type FinishId } from '../../data/product'
import { cn } from '../../utils/cn'

interface PhoneFrameProps {
  variant?: 'front' | 'back'
  finish?: FinishId
  children?: ReactNode
  className?: string
  innerClassName?: string
}

/**
 * A stylized, framework-agnostic smartphone renderer.
 * `front` shows a screen slot for children; `back` shows the finish
 * texture plus the Aether camera module.
 */
export function PhoneFrame({
  variant = 'front',
  finish = 'obsidian',
  children,
  className,
  innerClassName,
}: PhoneFrameProps) {
  const def = FINISHES.find((f) => f.id === finish) ?? FINISHES[0]
  const frameStyle = { background: def.frame } as CSSProperties

  return (
    <div className={cn('relative', className)}>
      <div className="relative aspect-[9/19.2] w-full will-change-transform">
        {/* Titanium frame acts as a border via inner padding. */}
        <div className="absolute inset-0 rounded-[2.6rem] p-[2.5px]" style={frameStyle}>
          <div className="relative h-full w-full overflow-hidden rounded-[2.45rem] bg-[#0b0b0e]">
            {variant === 'front' ? (
              <div className={cn('absolute inset-0', innerClassName)}>
                {children}
                <div
                  aria-hidden="true"
                  className="absolute top-[3.4%] left-1/2 h-[9px] w-[9px] -translate-x-1/2 rounded-full bg-[#050507] ring-1 ring-white/25"
                />
              </div>
            ) : (
              <div
                className="relative h-full w-full"
                style={{ backgroundImage: `url(${def.image})`, backgroundSize: 'cover' }}
              >
                <div
                  aria-hidden="true"
                  className="absolute top-[3.2%] left-1/2 flex w-[52%] -translate-x-1/2 items-center justify-between rounded-[1.4rem] border border-white/10 bg-black/45 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                >
                  <LensDot className="w-[20%] aspect-square" />
                  <LensDot className="w-[33%] aspect-square" size="large" />
                  <LensDot className="w-[20%] aspect-square" />
                </div>
                <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.5em] text-white/55">
                  AETHER
                </div>
                {/* Diffuse halo so the module reads as glass, not paint. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.06), transparent 30%)',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Physical side buttons */}
        <div aria-hidden="true" className="absolute top-[22%] -left-[2px] h-16 w-[3px] rounded-full bg-white/30" />
        <div aria-hidden="true" className="absolute top-[31%] -left-[2px] h-10 w-[3px] rounded-full bg-white/25" />
        <div aria-hidden="true" className="absolute top-[26%] -right-[2px] h-24 w-[3px] rounded-full bg-white/30" />
      </div>

      {/* Ground glow reflection */}
      <div
        aria-hidden="true"
        className="absolute -bottom-12 left-1/2 h-20 w-[135%] -translate-x-1/2 rounded-[100%] bg-aether/10 blur-2xl"
      />
    </div>
  )
}

function LensDot({ className, size = 'default' }: { className?: string; size?: 'default' | 'large' }) {
  return (
    <div
      className={cn(
        'relative rounded-full',
        size === 'large' ? 'ring-1 ring-white/20' : 'ring-1 ring-white/10',
        className,
      )}
      style={{
        background:
          'radial-gradient(circle at 32% 28%, #3d4a5e, #0d1117 62%, #05070a)',
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.25)',
      }}
    >
      <div
        className="absolute top-[26%] left-[28%] h-[24%] w-[24%] rounded-full"
        style={{ background: 'linear-gradient(145deg,#7f9cc0,#1b2633)' }}
      />
    </div>
  )
}