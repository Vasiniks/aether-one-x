import { useEffect, useState } from 'react'
import { XRAY_TOOLTIP_EVENT, type XrayTooltip as XrayTooltipData } from './inspect'

/**
 * Imperative tooltip host for the x-ray hover inspection. It subscribes only to
 * the director's change events, so tooltips never drive a per-frame render.
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
  const offset = tip.x < 0.5 ? 'left' : 'right'

  return (
    <div
      className="pointer-events-none fixed z-40 hidden lg:block"
      style={{ left, top }}
      aria-live="polite"
    >
      {/* Anchor dot on the inspected part */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/70 bg-sky-300/20 p-[3px]" />

      <div
        className={`
          absolute top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-black/70 px-4 py-2.5
          backdrop-blur-md
          ${offset === 'left' ? 'left-4' : 'right-4'}`}
      >
        <div className="font-[Geist] text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
          {tip.label}
        </div>
        <div className="mt-0.5 font-[GeistMono] text-[11px] text-white/85">{tip.detail}</div>
      </div>
    </div>
  )
}