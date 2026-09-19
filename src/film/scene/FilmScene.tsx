import { Canvas, type RootState } from '@react-three/fiber'
import { Suspense, useEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { PhoneModel } from '../../components/PhoneViewer/PhoneModel'
import type { OpticsControl } from '../../components/PhoneViewer/CameraAssembly'
import { Internals, type InternalsControl } from './internals/Internals'
import { FILM_MATERIALS } from './materials'
import { getLiveScreen } from './display/LiveScreen'
import { StageLighting } from '../lighting/StageLighting'
import { FilmDirector } from './FilmDirector'

/**
 * Film DPR policy: mobile holds 1.3 so the 390x844 macro floor (wider fov on
 * chip/camera) never spikes fragment cost; desktop caps at 1.5 on typical
 * panels but steps down on large canvases where buffer pixels explode:
 * above 1080p class it holds 1.25, at 1440p class and 4K/ultrawide it holds
 * 1.0. A 3440x1440 panel at 1.5 would shade ~11M pixels per frame; at 1.0 it
 * shades ~5M with no visible softness at film distances.
 */
function resolveFilmDpr(): number {
  if (typeof window === 'undefined') return 1
  const dpr = window.devicePixelRatio || 1
  if (window.matchMedia('(max-width: 767px)').matches) return Math.min(dpr, 1.3)
  const cssPixels = window.innerWidth * window.innerHeight
  if (cssPixels > 3686400) return 1
  if (cssPixels > 2073600) return Math.min(dpr, 1.25)
  return Math.min(dpr, 1.5)
}

const DPR = typeof window !== 'undefined' ? resolveFilmDpr() : 1

// Fixed film rig: identity-stable config objects so a parent re-render never
// freshly allocates a camera or gl props object. R3F guards reapplication via
// shallow compare, but stable identities also keep the GL-diff path a no-op.
const CAMERA_POSITION: [number, number, number] = [0, 0, 0.92]
const FILM_CAMERA = { position: CAMERA_POSITION, fov: 18, near: 0.003, far: 4 }
const GL_PROPS: THREE.WebGLRendererParameters = {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
}

function onCreated(state: RootState) {
  // Photographic rolloff instead of raw linear output: highlights and metal
  // speculars stop clipping, blacks hold their shape.
  state.gl.toneMapping = THREE.ACESFilmicToneMapping
  state.gl.toneMappingExposure = 1.1
  // Shadow scope lock: the film uses one baked ContactShadows plane
  // (frames=1, 512) and zero shadow-casting lights, so the shadow map stays
  // off and never pays a depth pass. PhoneModel keeps castShadow flags for
  // the product pages; they are no-ops here by design.
  state.gl.shadowMap.enabled = false
  state.gl.shadowMap.autoUpdate = false
  state.gl.shadowMap.needsUpdate = false
  if (import.meta.env.DEV) {
    // QA-only handle: read-only GL probes drive the film state in tests.
    ;(window as unknown as { __film?: RootState }).__film = state
  }
}

/** The film's full-height scene: phone hero, internals, ghost, lights. */
export function FilmScene({ progress, playing = true }: { progress: MotionValue<number>; playing?: boolean }) {
  const heroRef = useRef<THREE.Group>(null)
  const internalsGroup = useRef<THREE.Group>(null)
  const internals = useRef<InternalsControl>({
    opacity: 0,
    explode: 0,
    explodeBatt: 0,
    chipFocus: 0,
    energy: 0,
    chipLift: 0,
    battLift: 0,
    subjectDim: 0,
  })
  const frameShell = useRef<THREE.Group>(null)
  const backShell = useRef<THREE.Group>(null)
  const glassShell = useRef<THREE.Group>(null)
  const optics = useRef<OpticsControl>({ optics: 0 })

  useEffect(() => {
    const bright = (0.55 + Math.random() * 0.25).toFixed(2)
    getLiveScreen().set('idle', Number(bright))
  }, [])

  return (
    <Canvas
      frameloop={playing ? 'always' : 'never'}
      dpr={DPR}
      camera={FILM_CAMERA}
      gl={GL_PROPS}
      shadows={false}
      onCreated={onCreated}
    >
      <Suspense fallback={null}>
        <FilmDirector
          progress={progress}
          heroRef={heroRef as RefObject<THREE.Group | null>}
          internals={internals as RefObject<InternalsControl | null>}
          internalsGroup={internalsGroup as RefObject<THREE.Group | null>}
          opticsRef={optics as RefObject<OpticsControl | null>}
          shellRefs={{
            frame: frameShell as MutableRefObject<THREE.Group | null>,
            back: backShell as MutableRefObject<THREE.Group | null>,
            glass: glassShell as MutableRefObject<THREE.Group | null>,
          }}
        />
        <group ref={heroRef}>
          <PhoneModel
            materials={FILM_MATERIALS}
            animateFocusRing={false}
            opticsControl={optics as RefObject<OpticsControl | null>}
            groups={{
              frame: frameShell as MutableRefObject<THREE.Group | null>,
              back: backShell as MutableRefObject<THREE.Group | null>,
              glass: glassShell as MutableRefObject<THREE.Group | null>,
            }}
          />
          <Internals control={internals} groupRef={internalsGroup} />
        </group>
        <StageLighting progress={progress} />
      </Suspense>
    </Canvas>
  )
}