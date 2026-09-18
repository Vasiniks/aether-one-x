import { lazy, Suspense } from 'react'
import { CtaBand } from '../components/layout/CtaBand'
import { PageHero } from '../components/layout/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { DisplayDemo } from '../components/DisplayDemo/DisplayDemo'

const PhoneViewer = lazy(() => import('../components/PhoneViewer/PhoneViewer').then((m) => ({ default: m.PhoneViewer })))

const META = [
  { k: 'Panel', v: '6.7" LTPO' },
  { k: 'Resolution', v: '3200 × 1440' },
  { k: 'Refresh', v: '1 - 144 Hz' },
  { k: 'Peak', v: '2800 nits' },
]

/** Display product page: the interactive 1-to-144 Hz demo with a live front rail. */
export function DisplayPage() {
  return (
    <>
      <PageHero
        kicker="Aether One X · Display"
        title="See everything, spend almost nothing"
        lead="A 6.7-inch LTPO OLED that idles at one frame per second and wakes to 144. Whatever the content needs, the panel pays exactly that - no more, no less."
        meta={META}
      >
        <div className="w-[15rem]">
          <Suspense fallback={null}>
            <PhoneViewer scene="display" className="h-[20rem] w-full" />
          </Suspense>
        </div>
      </PageHero>

      <section className="relative py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <DisplayDemo />
          </Reveal>
        </div>
      </section>

      <section className="relative py-8 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Engineered for the eyes</h2>
              <p className="mt-3 max-w-xl text-pretty text-dim">
                The panel never stutters and never strains: 10-bit color, flicker-free dimming at 2160 Hz, and the
                same tone curve whether you are reading at dawn or watching a film in the dark.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/5">
              {[
                ['10-bit color', 'A billion shades, graded to stay true in both HDR and standard modes.'],
                ['2160 Hz PWM dimming', 'Flicker measured by the thousands, not the tens.'],
                ['1 to 144 Hz LTPO', 'The rate matches the content, so the battery pays per frame.'],
              ].map(([k, v], index) => (
                <Reveal key={k} delay={index * 60}>
                  <div className="flex items-start justify-between gap-6 bg-[#0d0f17] p-5">
                    <div>
                      <h3 className="text-[15px] font-medium text-ink">{k}</h3>
                      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-dim">{v}</p>
                    </div>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aether" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}