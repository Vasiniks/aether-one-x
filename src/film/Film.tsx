import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useScroll, useTransform } from 'motion/react'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import { PhoneFrame } from '../components/Phone/PhoneFrame'
import { usePhoneConfig } from '../components/PhoneViewer/PhoneConfig'
import { useInView } from '../hooks/useInView'
import { createGuideSession, smoothGuide } from './guide'
import { FilmOverlay } from './overlay/FilmOverlay'
import { XrayTooltip } from './xray/XrayTooltip'

const FilmScene = lazy(() => import('./scene/FilmScene').then((m) => ({ default: m.FilmScene })))

/**
 * The Aether One X film: one very long scroll sequence whose sticky stage is
 * driven by a single master progress value. The 3D scene and the editorial
 * overlay both read that value, so the whole page behaves like one shot.
 *
 * Raw scroll first flows through a magnetic guidance pass (`smoothGuide`):
 * while scroll is slow the value is gently attracted to the nearest authored
 * story node (the 13 act midpoints) with hysteresis around each node, and the
 * attraction releases entirely at speed, so the film is never locked or
 * hijacked. Fast scrolls and the opening/finale pass straight through.
 *
 * The heavy scene is never mounted until the sticky stage first touches the
 * viewport (shared useInView once-flag), and the Canvas frameloop runs only
 * while the stage is on screen AND the tab is foreground. An already-watched
 * film mounts nothing and a scrolled-past film stops paying the WebGL tax.
 */
export function Film() {
  const ref = useRef<HTMLDivElement>(null)
  const webgl = useMemo(() => WebGL.isWebGL2Available(), [])
  // Once-flag from the shared hook: flips true the first time the stage enters
  // the viewport, then disconnects. Gates every heavy mount in the tree.
  const { ref: stageRef, inView: stageSeen } = useInView<HTMLDivElement>(0)
  const [intersecting, setIntersecting] = useState(false)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  // Guidance session: every raw scroll reading passes through one magnetic
  // pass before the director and the overlay see it, so slow scrolls settle
  // onto the nearest authored beat while fast scrolls pass straight through.
  const session = useRef(createGuideSession())
  const t0 = useRef(performance.now())
  const smooth = useCallback(
    (v: number) =>
      smoothGuide(v, session.current, Number.isNaN(session.current.lastP) ? t0.current : performance.now()),
    [],
  )
  const guided = useTransform(scrollYProgress, smooth)

  // Continuous visibility gate. The shared hook fires once by design, so the
  // per-frame pause needs its own observer. It watches the sticky stage, not
  // the 1500vh section: at the film's tail the section still intersects while
  // the stage has already scrolled away, which would keep the loop rendering
  // into empty space. A hidden tab also drops `playing` so rAF never wakes.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const io = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), { threshold: 0 })
    const onVisibility = () => setHidden(document.visibilityState === 'hidden')
    io.observe(stage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [stageRef])

  const playing = intersecting && !hidden

  return (
    <section
      ref={ref}
      aria-label="Aether One X, a product film"
      className="relative"
      style={{ height: 'var(--film-height)' }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* The phone, shot in real time. */}
        <div className="absolute inset-0">
          {webgl && stageSeen ? (
            <Suspense fallback={<FilmFallback />}>
              <FilmScene progress={guided} playing={playing} />
            </Suspense>
          ) : (
            <FilmFallback />
          )}
        </div>

        {/* Overlay + tooltip mount with the scene: before the stage approaches
            they would only burn the scroll cue's infinite animation loop. */}
        {stageSeen ? <FilmOverlay progress={guided} /> : null}
        {stageSeen ? <XrayTooltip /> : null}
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