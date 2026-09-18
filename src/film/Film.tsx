import { lazy, Suspense, useMemo, useRef } from 'react'
import { useScroll } from 'motion/react'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import { PhoneFrame } from '../components/Phone/PhoneFrame'
import { usePhoneConfig } from '../components/PhoneViewer/PhoneConfig'
import { FilmOverlay } from './overlay/FilmOverlay'
import { XrayTooltip } from './xray/XrayTooltip'

const FilmScene = lazy(() => import('./scene/FilmScene').then((m) => ({ default: m.FilmScene })))

/**
 * The Aether One X film: one very long scroll sequence whose sticky stage is
 * driven by a single master progress value. The 3D scene and the editorial
 * overlay both read that value, so the whole page behaves like one shot.
 */
export function Film() {
  const ref = useRef<HTMLDivElement>(null)
  const webgl = useMemo(() => WebGL.isWebGL2Available(), [])
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  return (
    <section
      ref={ref}
      aria-label="Aether One X, a product film"
      className="relative"
      style={{ height: 'var(--film-height)' }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* The phone, shot in real time. */}
        <div className="absolute inset-0">
          {webgl ? (
            <Suspense fallback={<FilmFallback />}>
              <FilmScene progress={scrollYProgress} />
            </Suspense>
          ) : (
            <FilmFallback />
          )}
        </div>

        <FilmOverlay progress={scrollYProgress} />
        <XrayTooltip />
      </div>
    </section>
  )
}

/** Graceful, static stand-in when WebGL is unavailable mid-load. */
function FilmFallback() {
  const { finish } = usePhoneConfig()
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-[30vh] sm:w-[28vh] lg:w-[33vh]">
        <PhoneFrame variant="front" finish={finish} />
      </div>
    </div>
  )
}