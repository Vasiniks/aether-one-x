import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useState } from 'react'
import { CAMERA_LENSES, FOCAL_LENGTHS } from '../data/product'
import { CtaBand } from '../components/layout/CtaBand'
import { PageHero } from '../components/layout/PageHero'
import { usePhoneConfig } from '../components/PhoneViewer/PhoneConfig'
import { Reveal } from '../components/ui/Reveal'
import { cn } from '../utils/cn'

const PhoneViewer = lazy(() => import('../components/PhoneViewer/PhoneViewer').then((m) => ({ default: m.PhoneViewer })))

const META = [
  { k: 'Main sensor', v: '50 MP' },
  { k: 'Optical zoom', v: '5×' },
  { k: 'Ultra-wide', v: '122°' },
  { k: 'Video', v: '8K30' },
]

/** Cameras product page: focal-length strip, rear 3D study, lens legend. */
export function CamerasPage() {
  const [focalIndex, setFocalIndex] = useState(1)
  const { setFocusLens } = usePhoneConfig()

  const handleSelect = (index: number) => {
    setFocalIndex(index)
    const zoom = FOCAL_LENGTHS[index].zoom
    setFocusLens(zoom === '0.5×' ? 'ultra' : zoom === '5×' || zoom === '10×' ? 'tele' : 'main')
  }

  return (
    <>
      <PageHero
        kicker="Aether One X · Cameras"
        title="Five lenses, one quiet muscle"
        lead="A complete focus system that fits in one pocket: a 1-inch-class main, a 122-degree ultra-wide, and a floating telephoto at ten times. The processor decides the exposure before you do."
        meta={META}
      >
        <div className="w-[15rem]">
          <Suspense fallback={null}>
            <PhoneViewer scene="camera" className="h-[20rem] w-full" />
          </Suspense>
        </div>
      </PageHero>

      {/* Focal-length strip */}
      <section className="relative py-6 lg:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0d14]">
              <div className="relative aspect-[16/9] w-full">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.img
                    key={FOCAL_LENGTHS[focalIndex].image}
                    src={FOCAL_LENGTHS[focalIndex].image}
                    alt={`Aether One X ${FOCAL_LENGTHS[focalIndex].zoom} ${FOCAL_LENGTHS[focalIndex].note} scene`}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </AnimatePresence>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070c]/75 via-transparent to-[#05070c]/25"
                />
                <span className="glass absolute top-5 left-5 z-10 rounded-full px-3 py-1.5 font-mono text-[10.5px] tracking-wide text-white/90">
                  {FOCAL_LENGTHS[focalIndex].zoom} · {FOCAL_LENGTHS[focalIndex].note.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto border-t border-white/10 p-3">
                {FOCAL_LENGTHS.map((fl, index) => (
                  <button
                    key={fl.zoom}
                    type="button"
                    aria-pressed={focalIndex === index}
                    onClick={() => handleSelect(index)}
                    className={cn(
                      'relative whitespace-nowrap rounded-full px-4 py-2 font-mono text-[12px] tracking-wide transition-colors duration-200',
                      focalIndex === index ? 'text-night' : 'text-dim hover:text-white',
                    )}
                  >
                    {focalIndex === index ? (
                      <motion.span
                        layoutId="focal-strip-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-aether"
                      />
                    ) : null}
                    <span className="relative z-10">{fl.zoom}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Rear 3D study */}
      <section className="relative py-8 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="relative h-[28rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0d14] lg:h-[32rem]">
              <Suspense fallback={null}>
                <PhoneViewer scene="camera" desktopOnly className="absolute inset-0" />
              </Suspense>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(90deg, rgba(10,10,12,0.5), rgba(10,10,12,0) 30%, rgba(10,10,12,0) 70%, rgba(10,10,12,0.45))' }}
              />
              <span className="pointer-events-none absolute bottom-6 left-6 flex items-center gap-3 border-l border-white/15 pl-3 font-mono text-[10px] tracking-[0.24em] text-white/60">
                REAR SYSTEM · FIVE SENSORS
              </span>
              <span className="pointer-events-none absolute top-6 right-6 flex items-center gap-3 border-r border-white/15 pr-3 text-right font-mono text-[10px] tracking-[0.24em] text-white/60">
                FLOATING TELE · 10×
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Lens legend */}
      <section className="relative py-8 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">The focus system</h2>
            <p className="mt-3 max-w-xl text-pretty text-dim">
              Four apertures, one working rhythm. Each lens is tuned to the same capture engine, so the results
              read as one camera, not four.
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {CAMERA_LENSES.map((lens, index) => (
              <Reveal key={lens.id} delay={index * 60}>
                <div className="h-full bg-[#0d0f17] p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[15px] font-medium text-ink">{lens.label}</h3>
                    <span className="font-mono text-[11px] text-aether">{lens.zoom}</span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-dim">
                    {lens.mp} MP · {lens.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-5 font-mono text-[11px] text-faint">
            Scenes are stylized procedural renders for the fictional Aether One X camera system.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  )
}