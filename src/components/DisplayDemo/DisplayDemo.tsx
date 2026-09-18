import { Moon, Sun } from '@phosphor-icons/react'
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { DISPLAY } from '../../data/product'
import { cn } from '../../utils/cn'
import { formatNumber } from '../../utils/format'

const PhoneViewer = lazy(() => import('../../components/PhoneViewer/PhoneViewer').then((m) => ({ default: m.PhoneViewer })))

/** The interactive 1-to-144 Hz display demo, with an optional live 3D front rail. */
export function DisplayDemo({ showRail = true }: { showRail?: boolean }) {
  const [refresh, setRefresh] = useState(120)
  const [adaptive, setAdaptive] = useState(true)
  const [brightness, setBrightness] = useState(72)
  const [day, setDay] = useState(false)
  const [adaptiveFrame, setAdaptiveFrame] = useState(60)

  useEffect(() => {
    if (!adaptive) return
    const id = window.setInterval(() => {
      setAdaptiveFrame((f) => (f >= 144 ? 1 : f * 2 < 60 ? f * 2 : f + 24))
    }, 700)
    return () => window.clearInterval(id)
  }, [adaptive])

  const activeRefresh = adaptive ? adaptiveFrame : refresh
  const effectiveRefresh = adaptive ? 'adaptive' : String(refresh)

  return (
    <div className={`grid gap-5 ${showRail ? 'lg:grid-cols-[1.35fr_1fr_0.9fr]' : 'lg:grid-cols-[1.35fr_1fr]'}`}>
      {/* Live panel */}
      <div
        className="relative overflow-hidden rounded-[1.5rem] border border-white/10"
        style={{ background: day ? 'linear-gradient(180deg,#0d1a2e,#1a2b46)' : '#0b0f17' }}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          {day ? <DayScene /> : <NightScene refresh={activeRefresh} />}

          <div
            aria-hidden="true"
            className="absolute inset-0 transition-colors duration-500"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,8,14,0.35), rgba(5,8,14,0) 30%, rgba(5,8,14,0) 65%, rgba(5,8,14,0.45))',
              filter: `brightness(${0.45 + (brightness / 100) * 0.55})`,
            }}
          />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="glass rounded-full px-3 py-1.5 font-mono text-[10.5px] tracking-wide text-white/90">
              {effectiveRefresh} Hz
            </span>
            {adaptive ? (
              <span className="glass rounded-full px-3 py-1.5 font-mono text-[10.5px] tracking-wide text-aether">
                ADAPTIVE
              </span>
            ) : null}
          </div>
          <p className="absolute bottom-4 left-4 font-mono text-[11px] tracking-[0.2em] text-white/55">
            AETHER DYNAMIC DISPLAY
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col justify-between gap-7 rounded-[1.5rem] border border-white/10 bg-[#0d0f17] p-6 sm:p-7">
        <div className="space-y-7">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="refresh" className="text-[14px] font-medium text-ink">
                Refresh ceiling
              </label>
              <span className="font-mono text-[12.5px] text-aether tabular-nums">
                {adaptive ? 'adaptive' : `${refresh} Hz`}
              </span>
            </div>
            <input
              id="refresh"
              type="range"
              min={DISPLAY.refreshMin}
              max={DISPLAY.refreshMax}
              step={1}
              value={refresh}
              disabled={adaptive}
              onChange={(e) => setRefresh(Number(e.target.value))}
              className={cn('w-full accent-aether disabled:opacity-40', !adaptive && 'cursor-pointer')}
            />
            <div className="mt-1.5 flex justify-between font-mono text-[10.5px] text-faint">
              <span>1 Hz</span>
              <span>144 Hz</span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={adaptive}
            onClick={() => setAdaptive((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:border-white/20"
          >
            <span>
              <span className="block text-[14px] font-medium text-ink">Adaptive refresh</span>
              <span className="block text-[12px] text-dim">
                Lowers the rate to save power, raises it only when you need it.
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200', adaptive ? 'bg-aether' : 'bg-white/10')}
            >
              <span
                className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-200', adaptive ? 'left-[22px]' : 'left-0.5')}
              />
            </span>
          </button>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="brightness" className="text-[14px] font-medium text-ink">
                Brightness
              </label>
              <span className="font-mono text-[12.5px] text-ink tabular-nums">{brightness}%</span>
            </div>
            <input
              id="brightness"
              type="range"
              min={20}
              max={100}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full cursor-pointer accent-aether"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-ink">Scene</span>
            <div className="flex rounded-full border border-white/10 p-1">
              <button
                type="button"
                aria-pressed={!day}
                onClick={() => setDay(false)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors',
                  !day ? 'bg-ink text-night' : 'text-dim hover:text-ink',
                )}
              >
                <Moon size={14} /> Night
              </button>
              <button
                type="button"
                aria-pressed={day}
                onClick={() => setDay(true)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors',
                  day ? 'bg-ink text-night' : 'text-dim hover:text-ink',
                )}
              >
                <Sun size={14} /> Day
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px rounded-xl bg-white/5">
          {[
            { k: `${formatNumber(DISPLAY.peakNits)} nits`, v: 'Peak brightness' },
            { k: `${DISPLAY.colorBits}-bit`, v: 'HDR color' },
            { k: `${formatNumber(DISPLAY.pwm)} Hz`, v: 'Flicker-free dimming' },
          ].map((stat) => (
            <div key={stat.v} className="bg-[#0d0f17] px-3 py-4 text-center">
              <p className="font-mono text-[13px] font-medium text-ink">{stat.k}</p>
              <p className="mt-1 text-[10.5px] leading-tight text-faint">{stat.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live 3D front rail */}
      {showRail ? (
        <div className="relative hidden flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0d14] lg:flex lg:min-h-[28rem]">
          <div className="flex flex-1 items-center justify-center py-6">
            <Suspense fallback={null}>
              <PhoneViewer scene="display" desktopOnly className="h-full w-full" />
            </Suspense>
          </div>
          <div className="pointer-events-none absolute top-4 left-4 z-10">
            <span className="glass rounded-full px-3 py-1.5 font-mono text-[10.5px] tracking-wide text-white/70">
              LIVE RENDER · FRONT
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NightScene({ refresh }: { refresh: number }) {
  return (
    <div className="absolute inset-0">
      <img
        src="/images/camera/scene-main.svg"
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <QuantizerDot refresh={refresh} baseColor="rgba(190,215,255,0.9)" />
    </div>
  )
}

function DayScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#2b425f 0%,#51708f 55%,#93aec4 100%)' }} />
      <div className="absolute top-8 right-10 h-16 w-16 rounded-full bg-[#ffe9b8] blur-[2px]" />
      <div className="absolute top-8 right-8 h-24 w-24 rounded-full bg-[#ffe9b8]/20 blur-lg" />
      <div className="absolute top-24 left-8 h-10 w-40 rounded-full bg-white/25 blur-md" />
      <div className="absolute top-40 left-24 h-8 w-56 rounded-full bg-white/15 blur-lg" />
      <QuantizerDot refresh={120} baseColor="rgba(255,255,255,0.85)" />
      <div className="absolute right-0 bottom-0 left-0 h-24" style={{ background: 'linear-gradient(0deg,#0b1220 0%,#0b1220 55%,rgba(11,18,32,0) 100%)' }} />
    </div>
  )
}

function QuantizerDot({ refresh, baseColor }: { refresh: number; baseColor: string }) {
  const progress = useMotionValue(0)
  const acc = useRef(0)

  useAnimationFrame((_, delta) => {
    const dt = Math.min(delta, 32) / 1000
    acc.current += dt
    const period = 1 / refresh
    let ticks = 0
    while (acc.current >= period && ticks < 3) {
      acc.current -= period
      ticks += 1
    }
    if (ticks > 0) {
      const step = (0.32 / refresh) * ticks
      progress.set((progress.get() + step) % 1)
    }
  })

  const xPercent = useTransform(progress, (v) => `${8 + v * 84}%`)

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute right-6 bottom-7 left-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${baseColor}, transparent)`, opacity: 0.6 }}
      />
      <motion.div aria-hidden="true" style={{ left: xPercent }} className="absolute bottom-[26px] -translate-x-1/2">
        <div className="h-3 w-3 rounded-full" style={{ background: baseColor, boxShadow: `0 0 14px 2px ${baseColor}` }} />
      </motion.div>
    </>
  )
}