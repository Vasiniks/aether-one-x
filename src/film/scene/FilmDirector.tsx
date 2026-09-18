import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { sampleFilm, computeFilmStates } from '../camera'
import { actAt } from '../story'
import { centerBias, fitFov } from '../framing'
import { FILM_MATERIALS } from './materials'
import { getLiveScreen, type ScreenMode } from './display/LiveScreen'
import { STAGE_LIGHTING } from '../lighting/light-states'
import { setXrayActive, updatePick, hoverPointer } from '../xray/inspect'
import type { InternalsControl } from './internals/Internals'

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const XRAY_ACTS = new Set(['xray', 'rebuild'])

// Shell materials that dissolve together when the internals take over.
const SHELL_MATS = [
  'frame',
  'back',
  'island',
  'lensRing',
  'lensGlass',
  'lensBarrel',
  'lensCavity',
  'sensorGlint',
  'flashRing',
  'flashGlass',
  'antenna',
  'simTray',
  'port',
  'speaker',
] as const

const ENV_MATS = ['frame', 'back', 'island', 'flashRing'] as const
const SCRATCH: { look: THREE.Vector3; targetFov: number; screenTick: number; screenMode: ScreenMode } = {
  look: new THREE.Vector3(),
  targetFov: 18,
  screenTick: 0,
  screenMode: 'off',
}

const _ray = new THREE.Raycaster()

/**
 * The single frame director: samples the master timeline, then writes camera,
 * responsive FOV, phone pose, x-ray dissolve, screen, internals and the hover
 * pick without any React re-render. Authored curves are pre-eased in camera.ts;
 * only pose and FOV get a light damp so movement feels weighted.
 */
export function FilmDirector({
  progress,
  heroRef,
  internals,
  internalsGroup,
}: {
  progress: MotionValue<number>
  heroRef: RefObject<THREE.Group | null>
  internals: RefObject<InternalsControl | null>
  internalsGroup: RefObject<THREE.Group | null>
}) {
  useFrame((state, delta) => {
    const p = progress.get()
    const t = sampleFilm(p)
    const s = computeFilmStates(p)
    const act = actAt(p).id

    const cam = state.camera as THREE.PerspectiveCamera
    cam.position.copy(t.pos)
    SCRATCH.look.copy(t.target)
    cam.lookAt(SCRATCH.look)

    const d = REDUCED ? 1 : 1 - Math.exp(-delta * 7)
    const g = heroRef.current

    // Responsive framing: hero keys carry a `fit` (share of viewport height);
    // detail keys fall back to their authored macro fov. Both damp slightly so
    // resizes and transitions feel continuous instead of steppy.
    let targetFov = t.fov
    if (t.fit != null) {
      const aspect = state.size.width / state.size.height
      const poseRx = g ? g.rotation.x : t.rx
      const poseRy = g ? g.rotation.y : t.ry
      const poseScale = g ? g.scale.x : t.scale
      const distance = cam.position.distanceTo(SCRATCH.look)
      targetFov = fitFov({
        fit: t.fit,
        distance,
        aspect,
        scale: poseScale,
        rx: poseRx,
        ry: poseRy,
        horizontalMargin: 0.86,
        maxFov: t.fovMax,
      })

      // Pull off-center compositions back toward center as the frame narrows.
      const bx = centerBias(aspect, 'x')
      const by = centerBias(aspect, 'y')
      t.px *= bx
      t.py *= by
    }

    if (Math.abs(SCRATCH.targetFov - targetFov) > 0.001) {
      SCRATCH.targetFov += (targetFov - SCRATCH.targetFov) * (REDUCED ? 1 : 1 - Math.exp(-delta * 12))
    }
    if (Math.abs(cam.fov - SCRATCH.targetFov) > 0.01) {
      cam.fov = SCRATCH.targetFov
      cam.updateProjectionMatrix()
    }

    if (g) {
      if (REDUCED) {
        g.rotation.set(t.rx, t.ry, t.rz)
        g.scale.setScalar(t.scale)
        g.position.set(t.px, t.py, 0)
      } else {
        g.rotation.x += (t.rx - g.rotation.x) * d
        g.rotation.y += (t.ry - g.rotation.y) * d
        g.rotation.z += (t.rz - g.rotation.z) * d
        g.scale.x += (t.scale - g.scale.x) * d
        g.scale.y += (t.scale - g.scale.y) * d
        g.scale.z += (t.scale - g.scale.z) * d
        g.position.x += (t.px - g.position.x) * d
        g.position.y += (t.py - g.position.y) * d
      }
    }

    // X-ray dissolve: the outer shell + edge hardware fades together as the
    // internals take over; the display layer stays glassy and merely dims so a
    // ghosted outline still owns the silhouette.
    const ghost = s.shellGhost > 0.01
    if (ghost !== FILM_MATERIALS.frame.transparent) {
      for (const name of SHELL_MATS) {
        const mat = FILM_MATERIALS[name]
        mat.transparent = ghost
        if (ghost) mat.opacity = Math.max(0.02, 1 - s.shellGhost * 0.9)
        else mat.opacity = 1
      }
    } else if (ghost) {
      for (const name of SHELL_MATS) {
        FILM_MATERIALS[name].opacity = Math.max(0.02, 1 - s.shellGhost * 0.9)
      }
    }
    // Display + glass are always transparent and follow their own fades.
    FILM_MATERIALS.display.opacity = Math.max(0.02, 1 - s.shellGhost * 0.95)
    FILM_MATERIALS.screen.opacity = Math.max(0.03, 0.09 - s.shellGhost * 0.06)

    // Live display: emissive panel brightness + per-act mode.
    const screen = getLiveScreen()
    const actMode: ScreenMode =
      act === 'software' ? 'os' : act === 'display' ? 'display' : s.screenOn > 0.01 ? 'idle' : 'off'
    if (SCRATCH.screenMode !== actMode) {
      SCRATCH.screenMode = actMode
      screen.set(actMode, actMode === 'display' ? 0.85 : 0.6)
    }
    SCRATCH.screenTick += delta
    if (SCRATCH.screenTick > 0.11 && actMode !== 'off') {
      SCRATCH.screenTick = 0
      screen.tick(state.clock.elapsedTime)
    }
    FILM_MATERIALS.display.emissiveIntensity = s.screenOn * (actMode === 'display' ? 1.15 : 0.8)
    FILM_MATERIALS.display.color.set('#05080e')

    // IBL response per act (lights the machined titanium).
    const envInt = STAGE_LIGHTING[act]?.envIntensity ?? 0.9
    for (const name of ENV_MATS) {
      FILM_MATERIALS[name].envMapIntensity = envInt
    }

    // Internals control plane.
    const c = internals.current
    if (c) {
      c.opacity = s.internalOpacity
      c.explode = s.explode
      c.chipFocus = s.chipFocus
      c.energy = s.energy
    }

    // Hover inspection: only during the x-ray / rebuild pass on desktop.
    const pickActive =
      XRAY_ACTS.has(act) && state.size.width >= 768 && !REDUCED && hoverPointer.fine
    setXrayActive(pickActive)
    if (pickActive && internalsGroup.current && hoverPointer.dirty) {
      hoverPointer.dirty = false
      _ray.setFromCamera(hoverPointer.ndc, cam)
      updatePick(_ray, cam, internalsGroup.current)
    } else if (!pickActive) {
      updatePick(_ray, cam, null)
    }
  })

  return null
}