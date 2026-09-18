import { motion } from 'motion/react'
import { useState } from 'react'
import { PERFORMANCE, type SoCUnit } from '../../data/product'
import { useCountUp } from '../../hooks/useCountUp'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'

const UNIT_KEYS: SoCUnit['key'][] = ['cpu', 'gpu', 'npu']

/** The interactive A1 Ultra die: unit tabs, live hero number, metric bars. */
export function SoCPanel({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const [activeKey, setActiveKey] = useState<SoCUnit['key']>('cpu')
  const unit = PERFORMANCE[activeKey]

  return (
    <div ref={ref} className={cn('grid items-center gap-12 lg:grid-cols-2 lg:gap-10', className)}>
      <SoCDie activeKey={activeKey} />

      <div>
        <div className="mb-7 flex flex-wrap gap-2.5">
          {UNIT_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              aria-pressed={activeKey === key}
              className={cn(
                'rounded-full border px-5 py-2.5 font-mono text-[12.5px] tracking-[0.14em] uppercase transition-all duration-200',
                activeKey === key
                  ? 'border-aether/60 bg-aether/10 text-aether'
                  : 'border-white/10 text-dim hover:border-white/25 hover:text-ink',
              )}
            >
              {PERFORMANCE[key].name}
            </button>
          ))}
        </div>

        <div key={unit.key}>
          <div className="flex items-end justify-between gap-6">
            <h3 className="max-w-[16rem] text-xl leading-snug font-medium text-ink">{unit.headline}</h3>
            <p className="whitespace-nowrap text-right font-mono text-[11px] leading-tight text-faint">
              {unit.hero.prefix ?? ''}
              <HeroNumber value={unit.hero.value} run={inView} />
              <span className="text-aether">{unit.hero.suffix}</span>
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {unit.metrics.map((metric, index) => (
              <MetricBar
                key={metric.label}
                label={metric.label}
                value={metric.value}
                max={metric.max}
                suffix={metric.suffix}
                run={inView}
                delay={index * 120}
              />
            ))}
          </div>

          <p className="mt-7 border-l border-white/10 pl-4 font-mono text-[11.5px] leading-relaxed text-faint">
            {unit.footnote}
          </p>
        </div>
      </div>
    </div>
  )
}

function HeroNumber({ value, run }: { value: number; run: boolean }) {
  const count = useCountUp(value, run, 1000)
  return (
    <span className="mr-1.5 block text-5xl font-semibold tracking-tight text-ink tabular-nums">
      {Math.round(count).toLocaleString('en-US')}
    </span>
  )
}

function MetricBar({
  label,
  value,
  max,
  suffix,
  run,
  delay,
}: {
  label: string
  value: number
  max: number
  suffix: string
  run: boolean
  delay: number
}) {
  const pct = (value / max) * 100
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] text-dim">{label}</span>
        <span className="font-mono text-[12.5px] text-ink tabular-nums">
          {Number.isInteger(value) ? value.toLocaleString('en-US') : value.toFixed(1)}
          <span className="ml-1 text-faint">{suffix}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: run ? `${pct}%` : '0%' }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay / 1000 }}
          className="h-full rounded-full bg-gradient-to-r from-[#27548f] to-aether"
        />
      </div>
    </div>
  )
}

export function SoCDie({ activeKey }: { activeKey: SoCUnit['key'] }) {
  const glow =
    activeKey === 'cpu' ? 'rgba(127,180,255,0.5)' : activeKey === 'gpu' ? 'rgba(160,255,214,0.5)' : 'rgba(200,180,255,0.5)'
  const accent = activeKey === 'cpu' ? 'bg-aether' : activeKey === 'gpu' ? 'bg-[#7ae0c0]' : 'bg-[#b9a6ff]'

  return (
    <div
      className="glass relative aspect-square w-full max-w-[26rem] overflow-hidden rounded-[1.75rem] p-5 transition-shadow duration-500 sm:p-7"
      style={{ boxShadow: `0 0 90px -20px ${glow}` }}
    >
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.5]" style={{ background: 'radial-gradient(70% 60% at 50% 0%, rgba(30,60,110,0.55), transparent 70%), radial-gradient(50% 40% at 50% 100%, rgba(10,20,40,0.6), transparent 70%)' }} />

      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.2em] text-dim">AETHER A1 ULTRA</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-faint">3 NM</span>
      </div>

      <div className="relative mt-4 grid gap-2.5">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-2.5 font-mono text-[10px] tracking-[0.18em] text-faint">CPU · 8 CORES</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn('aspect-square rounded-md', accent, 'opacity-50')}
                style={{ animation: `core-pulse 3s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-2.5 font-mono text-[10px] tracking-[0.18em] text-faint">GPU · 14 CORES</p>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={cn('aspect-square rounded-md', accent, i < 6 ? 'opacity-60' : 'opacity-30')}
                style={{ animation: `core-pulse 3.6s ease-in-out infinite`, animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="col-span-2 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="mb-2.5 font-mono text-[10px] tracking-[0.18em] text-faint">NPU · {PERFORMANCE.npu.hero.value} TOPS</p>
            <div className="flex h-[34px] items-center gap-2">
              <div className={cn('h-full flex-1 rounded-md', accent, 'opacity-70')} style={{ animation: 'core-pulse 2.8s ease-in-out infinite' }} />
              <div className={cn('h-full flex-1 rounded-md', accent, 'opacity-50')} style={{ animation: 'core-pulse 2.8s ease-in-out infinite', animationDelay: '0.4s' }} />
              <div className={cn('h-full flex-1 rounded-md', accent, 'opacity-30')} style={{ animation: 'core-pulse 2.8s ease-in-out infinite', animationDelay: '0.9s' }} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 text-center">
            <span className="font-mono text-[9px] tracking-[0.18em] text-faint">CACHE</span>
            <span className="mt-1 font-mono text-[11px] text-dim">24 MB</span>
          </div>
        </div>
      </div>

      <p className="relative mt-4 text-center font-mono text-[10px] tracking-[0.18em] text-faint">
        TWO CLUSTERS · TUNABLE PER BLOCK
      </p>
    </div>
  )
}