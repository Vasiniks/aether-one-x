import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import { PhoneFrame } from '../Phone/PhoneFrame'
import { usePhoneConfig } from './PhoneConfig'
import type { SceneId } from './PhoneScene'

const PhoneScene = lazy(() => import('./PhoneScene').then((m) => ({ default: m.PhoneScene })))

/**
 * Initial camera recipes per scene. The scene itself frames the phone to a
 * viewport-aware size every frame; `position` only seeds the first frame.
 */
const CAMERA: Record<SceneId, { position: [number, number, number]; fov: number }> = {
  hero: { position: [0, 0.1, 1.1], fov: 20 },
  reveal: { position: [0, 0.1, 1.1], fov: 20 },
  camera: { position: [-0.03, 0.02, 0.75], fov: 18 },
  display: { position: [0, 0, 0.68], fov: 20 },
  performance: { position: [0, 0.1, 1.05], fov: 22 },
  config: { position: [0, 0.02, 0.72], fov: 20 },
  final: { position: [0, 0.1, 0.95], fov: 16 },
}

const DESKTOP_QUERY = '(min-width: 1024px)'
const DESKTOP = typeof window !== 'undefined' ? window.matchMedia(DESKTOP_QUERY).matches : false
const DPR = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 1.3 : 1.75

interface PhoneViewerProps {
  scene: SceneId
  className?: string
  /** Mount only on lg+ viewports (used for the in-page rails). */
  desktopOnly?: boolean
}

/** The rear panel is the "story" side for these scenes. */
const REAR_SCENES: SceneId[] = ['camera', 'config']

/**
 * Renders a lazily-loaded, scroll-driven 3D phone.
 * - Falls back to the static CSS `PhoneFrame` when WebGL is unavailable.
 * - Keeps per-viewport GPU cost bounded (DPR caps) and only constructs the
 *   heavy scene once it is near the viewport.
 */
export function PhoneViewer({ scene, className, desktopOnly = false }: PhoneViewerProps) {
  const webgl = useMemo(() => WebGL.isWebGL2Available(), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const { finish } = usePhoneConfig()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '260px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (desktopOnly && !DESKTOP) return null
  if (!webgl) {
    return (
      <PhoneFrame variant={REAR_SCENES.includes(scene) ? 'back' : 'front'} finish={finish} className={className} />
    )
  }

  return (
    <div ref={containerRef} className={className} style={{ pointerEvents: 'none', touchAction: 'pan-y' }} aria-hidden="true">
      {mounted ? (
        <Canvas
          dpr={DPR}
          camera={CAMERA[scene]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <PhoneScene scene={scene} />
          </Suspense>
        </Canvas>
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  )
}