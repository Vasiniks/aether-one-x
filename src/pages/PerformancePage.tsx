import { lazy, Suspense } from 'react'
import { CtaBand } from '../components/layout/CtaBand'
import { PageHero } from '../components/layout/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { SoCPanel } from '../components/SoC/SoCPanel'

const PhoneViewer = lazy(() => import('../components/PhoneViewer/PhoneViewer').then((m) => ({ default: m.PhoneViewer })))

const META = [
  { k: 'Process node', v: '3 nm' },
  { k: 'CPU cores', v: '8' },
  { k: 'GPU cores', v: '14' },
  { k: 'Neural engine', v: '46 TOPS' },
]

/** Performance product page: the full die, then the phone it powers. */
export function PerformancePage() {
  return (
    <>
      <PageHero
        kicker="Aether One X · Performance"
        title="The engine behind the quiet"
        lead="A 3-nanometer A1 Ultra with a core for every kind of work. Dedicated compute, dedicated graphics, dedicated intelligence - the phone gets out of your way because the chip already did the thinking."
        meta={META}
      >
        <div className="w-[15rem]">
          <Suspense fallback={null}>
            <PhoneViewer scene="hero" className="h-[20rem] w-full" />
          </Suspense>
        </div>
      </PageHero>

      <section className="relative py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SoCPanel />
          </Reveal>
        </div>
      </section>

      {/* Side-profile study */}
      <section className="relative py-8 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="relative h-[28rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0d14] lg:h-[32rem]">
              <Suspense fallback={null}>
                <PhoneViewer scene="performance" desktopOnly className="absolute inset-0" />
              </Suspense>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(90deg, rgba(10,10,12,0.5), rgba(10,10,12,0) 30%, rgba(10,10,12,0) 70%, rgba(10,10,12,0.45))' }}
              />
              <span className="pointer-events-none absolute bottom-6 left-6 flex items-center gap-3 border-l border-white/15 pl-3 font-mono text-[10px] tracking-[0.24em] text-white/60">
                SIDE PROFILE · 198 G
              </span>
              <span className="pointer-events-none absolute top-6 right-6 flex items-center gap-3 border-r border-white/15 pr-3 text-right font-mono text-[10px] tracking-[0.24em] text-white/60">
                TITANIUM ARMATURE · 7.8 MM
              </span>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-3">
            {[
              ['Thermal design', 'A vapor chamber keeps the A1 Ultra from throttling during sustained play.'],
              ['Sustained first', 'Frames stay high ten minutes in, not just on the first splash screen.'],
              ['Silent, always', 'No fan noise. The 3 nm process does the air conditioning.'],
            ].map(([k, v], index) => (
              <Reveal key={k} delay={index * 70}>
                <div className="h-full bg-[#0d0f17] p-6">
                  <h3 className="text-[15px] font-medium text-ink">{k}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-dim">{v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}