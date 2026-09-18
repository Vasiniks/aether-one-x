import { useEffect, useState } from 'react'
import { XRAY_TOOLTIP_EVENT, type XrayTooltip as XrayTooltipData } from './inspect'

/**
 * Imperative tooltip host for the x-ray part inspection. Subscribes only to the
 * director's change events, so tooltips never drive a per-frame render. The
 * anchor is a hairline crosshair at the world-projected pick point; the card
 * hangs from it. No neon outline, no marker circle, no HUD chrome.
 */
export function XrayTooltip() {
  const [tip, setTip] = useState<XrayTooltipData | null>(null)

  useEffect(() => {
    const onTip = (event: Event) => {
      setTip((event as CustomEvent<XrayTooltipData | null>).detail ?? null)
    }
    window.addEventListener(XRAY_TOOLTIP_EVENT, onTip)
    return () => window.removeEventListener(XRAY_TOOLTIP_EVENT, onTip)
  }, [])

  if (!tip) return null

  const left = `calc(${tip.x * 100}% )`
  const top = `calc(${tip.y * 100}% )`
  const at = `translate(-50%, -50%)`

  return (
    <div className="pointer-events-none fixed z-40" style={{ left, top }}>
      {/* Hairline crosshair anchored on the probed part */}
      <div
        className="absolute flex"
        style={{ transform: at, width: 16, height: 16, opacity: 0.95 }}
        aria-hidden="true"
      >
        {/* 12px hairline, gradient fade out toward the card so the rule reads
            as an annotation line rather than a targeting reticle. */}
        <span className="absolute left-1/2 top-1/2 h-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-200/45 to-transparent" style={{ width: 16 }} />
        <span className="absolute left-1/2 top-1/2 w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-sky-200/45 to-transparent" style={{ height: 16 }} />

        <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-sky-200/50" />
        <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-sky-200/50" />
        <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-sky-200/50" />
        <span className="absolute left-1/2 bottom-0 h-1.5 w-px -translate-x-1/2 bg-sky-200/50" />

        <span className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/80 shadow-[0_0_6px_rgba(125,180,255,0.55)]" />
      </div>

      <div
        className="absolute top-1/2 z-10 min-w-40 max-w-64 border-l border-white/10 bg-black/55 px-4 py-3 pl-5 backdrop-blur-md"
        style={{ transform: 'translateY(-50%)', marginLeft: 18 }}
      >
        {/* Hairline seam under the kicker */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-sky-200/15"
          aria-hidden="true"
        />

        <div className="text-[9px] font-semibold uppercase leading-none tracking-[0.3em] text-sky-200/40">
          INSIDE THE X
        </div>
        <div className="mt-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-ink">
          {tip.label}
        </div>
        <div className="mt-2 h-px w-7 bg-sky-200/30" aria-hidden="true" />
        <div className="mt-2 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-white/55">
          {tip.detail}
        </div>
      </div>
    </div>
  )
}