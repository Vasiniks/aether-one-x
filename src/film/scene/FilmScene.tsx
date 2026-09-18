import { Canvas, type RootState } from '@react-three/fiber'
import { Suspense, useEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { PhoneModel } from '../../components/PhoneViewer/PhoneModel'
import { Internals, type InternalsControl } from './internals/Internals'
import { FILM_MATERIALS } from './materials'
import { getLiveScreen } from './display/LiveScreen'
import { StageLighting } from '../lighting/StageLighting'
import { FilmDirector } from './FilmDirector'

const DPR =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    ? 1.3
    : Math.min(window.devicePixelRatio || 1, 1.5)

function onCreated(state: RootState) {
  // Photographic rolloff instead of raw linear output: highlights and metal
  // speculars stop clipping, blacks hold their shape.
  state.gl.toneMapping = THREE.ACESFilmicToneMapping
  state.gl.toneMappingExposure = 1.1
}

/** The film's full-height scene: phone hero, internals, ghost, lights. */
export function FilmScene({ progress }: { progress: MotionValue<number> }) {
  const heroRef = useRef<THREE.Group>(null)
  const internalsGroup = useRef<THREE.Group>(null)
  const internals = useRef<InternalsControl>({ opacity: 0, explode: 0, chipFocus: 0, energy: 0 })
  const frameShell = useRef<THREE.Group>(null)
  const backShell = useRef<THREE.Group>(null)
  const glassShell = useRef<THREE.Group>(null)

  useEffect(() => {
    const bright = (0.55 + Math.random() * 0.25).toFixed(2)
    getLiveScreen().set('idle', Number(bright))
  }, [])

  return (
    <Canvas
      dpr={DPR}
      camera={{ position: [0, 0, 0.92], fov: 18, near: 0.01, far: 20 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={onCreated}
    >
      <Suspense fallback={null}>
        <FilmDirector
          progress={progress}
          heroRef={heroRef as RefObject<THREE.Group | null>}
          internals={internals as RefObject<InternalsControl | null>}
          internalsGroup={internalsGroup as RefObject<THREE.Group | null>}
          shellRefs={{
            frame: frameShell as MutableRefObject<THREE.Group | null>,
            back: backShell as MutableRefObject<THREE.Group | null>,
            glass: glassShell as MutableRefObject<THREE.Group | null>,
          }}
        />
        <group ref={heroRef}>
          <PhoneModel
            materials={FILM_MATERIALS}
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