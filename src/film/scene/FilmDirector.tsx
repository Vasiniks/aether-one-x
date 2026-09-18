import { useFrame } from '@react-three/fiber'
import type { MutableRefObject, RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { sampleFilm, computeFilmStates } from '../camera'
import { actAt } from '../story'
import { centerBias, fitFov } from '../framing'
import { FILM_MATERIALS } from './materials'
import { getLiveScreen, type ScreenMode } from './display/LiveScreen'
import { STAGE_LIGHTING } from '../lighting/light-states'
import { setXrayActive, updatePick, hoverPointer, tick as tickInspect, resyncPick } from '../xray/inspect'
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
  'button',
  'logo',
  'focusRing',
] as const

// The bezel + edge hardware group sits between the camera and the die during
// the macro dive; it dials out harder than the rear shell so the ring can
// never paint over nearer internals in the transparent pass.
const FRAME_MATS = ['frame', 'button', 'simTray', 'port', 'speaker', 'antenna'] as const

const ENV_MATS = ['frame', 'back', 'island', 'flashRing'] as const

/** Distances the shell layers travel apart while the internals are staged. */
const GLASS_LIFT = 0.0045
const BACK_LIFT = 0.0036

const SCRATCH: {
  look: THREE.Vector3
  screenTick: number
  screenMode: ScreenMode
  envInt: number
  lastGhost: boolean
  lastShellGhost: number
  lastEnvInt: number
  lastFrameGhost: number
} = {
  look: new THREE.Vector3(),
  screenTick: 0,
  screenMode: 'off',
  envInt: 0.9,
  lastGhost: false,
  lastShellGhost: -1,
  lastEnvInt: -1,
  lastFrameGhost: -1,
}

const _ray = new THREE.Raycaster()

/**
 * The single frame director: samples the master timeline, then writes camera,
 * responsive FOV, phone pose, x-ray dissolve, shell split, screen, internals
 * and the hover pick without any React re-render. Authored curves are already
 * eased in camera.ts; pose and FOV carry a light damp so camera work feels
 * weighted rather than steppy.
 */
export function FilmDirector({
  progress,
  heroRef,
  internals,
  internalsGroup,
  shellRefs,
}: {
  progress: MotionValue<number>
  heroRef: RefObject<THREE.Group | null>
  internals: RefObject<InternalsControl | null>
  internalsGroup: RefObject<THREE.Group | null>
  shellRefs: {
    frame: MutableRefObject<THREE.Group | null>
    back: MutableRefObject<THREE.Group | null>
    glass: MutableRefObject<THREE.Group | null>
  }
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

    const aspect = state.size.width / state.size.height
    const bx = centerBias(aspect, 'x')
    const by = centerBias(aspect, 'y')
    // Read the off-center offset once; never mutate the shared sample buffer.
    const px = t.fit != null ? t.px * bx : t.px
    const py = t.fit != null ? t.py * by : t.py

    // Pose is written before framing so the responsive fit reads the live
    // (damped) silhouette and can never lag the group it is framing.
    if (g) {
      if (REDUCED) {
        g.rotation.set(t.rx, t.ry, t.rz)
        g.scale.setScalar(t.scale)
        g.position.set(px, py, 0)
      } else {
        g.rotation.x += (t.rx - g.rotation.x) * d
        g.rotation.y += (t.ry - g.rotation.y) * d
        g.rotation.z += (t.rz - g.rotation.z) * d
        g.scale.x += (t.scale - g.scale.x) * d
        g.scale.y += (t.scale - g.scale.y) * d
        g.scale.z += (t.scale - g.scale.z) * d
        g.position.x += (px - g.position.x) * d
        g.position.y += (py - g.position.y) * d
      }
    }

    // Responsive framing: hero keys carry a `fit` (share of viewport height);
    // detail keys fall back to their authored macro fov. The fitFov sampler
    // always reads the authored pose (t.*) rather than the live damped g.* so
    // the responsive FOV can never lag the phone and create a feedback loop.
    let targetFov = t.fov
    if (t.fit != null) {
      const distance = cam.position.distanceTo(SCRATCH.look)
      const fitValue = fitFov({
        fit: t.fit,
        distance,
        aspect,
        scale: t.scale,
        rx: t.rx,
        ry: t.ry,
        px: t.px,
        horizontalMargin: 0.86,
        maxFov: t.fovMax,
      })
      const w = Math.min(1, Math.max(0, t.fit))
      targetFov = Math.min(t.fovMax, t.fov + (fitValue - t.fov) * w)
    }

    // Pose and FOV share one damp: slow weight on big moves, no overshoot.
    if (REDUCED) {
      if (Math.abs(cam.fov - targetFov) > 0.001) {
        cam.fov = targetFov
        cam.updateProjectionMatrix()
      }
    } else if (Math.abs(cam.fov - targetFov) > 0.01) {
      cam.fov += (targetFov - cam.fov) * (1 - Math.exp(-delta * 7))
      cam.updateProjectionMatrix()
    }

    // X-ray dissolve: the outer shell + edge hardware fades together as the
    // internals take over; the front glass stays and merely dims so a ghosted
    // outline still owns the silhouette. Shell materials are permanently
    // transparent; the shell only toggles depthWrite (occluder when solid,
    // see-through when ghost) so the pass never needs a shader recompile.
    const ghost = s.shellGhost > 0.01
    if (ghost !== SCRATCH.lastGhost) {
      SCRATCH.lastGhost = ghost
      for (const name of SHELL_MATS) {
        const mat = FILM_MATERIALS[name]
        mat.depthWrite = !ghost
        mat.opacity = ghost ? Math.max(0.02, 1 - s.shellGhost * 0.9) : 1
      }
      SCRATCH.lastShellGhost = ghost ? s.shellGhost : -1
    } else if (ghost && Math.abs(s.shellGhost - SCRATCH.lastShellGhost) > 0.004) {
      SCRATCH.lastShellGhost = s.shellGhost
      for (const name of SHELL_MATS) {
        FILM_MATERIALS[name].opacity = Math.max(0.02, 1 - s.shellGhost * 0.9)
      }
    }

    // The bezel + edge hardware dials out harder during the macro dive (camera
    // inside the cavity, between the ring and the die) so the titanium ring can
    // never blend over nearer internals in the transparent pass. The rear shell
    // + ghost line still carry the silhouette.
    if (ghost) {
      const frameAlpha = Math.max(
        0.02,
        1 - s.shellGhost * 0.9 - s.chipFocus * 0.8 - s.cameraFocus * 0.5,
      )
      if (Math.abs(frameAlpha - SCRATCH.lastFrameGhost) > 0.004) {
        SCRATCH.lastFrameGhost = frameAlpha
        for (const name of FRAME_MATS) {
          FILM_MATERIALS[name].opacity = frameAlpha
        }
      }
    }

    // Shell split: the front glass stack and rear ceramic part from the frame
    // while the internals parade, so the molecular read stays physical.
    const split = s.shellSplit
    if (shellRefs.glass.current) shellRefs.glass.current.position.z = split * GLASS_LIFT
    if (shellRefs.back.current) shellRefs.back.current.position.z = -split * BACK_LIFT

    // Display + glass follow their own fades. The glass keeps real presence in
    // solid acts (gloss + specular read) and thins out only on the x-ray stage.
    FILM_MATERIALS.display.opacity = Math.max(0.02, 1 - s.shellGhost * 0.95)
    FILM_MATERIALS.screen.opacity = Math.max(0.05, 0.42 - s.shellGhost * 0.36)

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
    // The panel dims under the ghost shell so the hardware dominates the read.
    const dim = 1 - s.shellGhost * 0.75
    FILM_MATERIALS.display.emissiveIntensity = s.screenOn * dim * (actMode === 'display' ? 1.35 : 0.95)

    // IBL response per act (lights the machined titanium). Damped and gated so
    // the strip lights glide instead of snapping between scenes.
    const envInt = STAGE_LIGHTING[act]?.envIntensity ?? 0.9
    SCRATCH.envInt += (envInt - SCRATCH.envInt) * (REDUCED ? 1 : 1 - Math.exp(-delta * 5))
    if (Math.abs(SCRATCH.envInt - SCRATCH.lastEnvInt) > 0.004) {
      SCRATCH.lastEnvInt = SCRATCH.envInt
      for (const name of ENV_MATS) {
        FILM_MATERIALS[name].envMapIntensity = SCRATCH.envInt
      }
    }

    // Internals control plane. The battery window separates only the cell, so
    // the 0.9 climax does not shake the whole stack.
    const c = internals.current
    if (c) {
      c.opacity = s.internalOpacity
      c.explode = s.explodeXray
      c.explodeBatt = s.explodeBatt
      c.chipFocus = s.chipFocus
      c.energy = s.energy
      c.chipLift = s.chipLift
      c.battLift = s.battLift
      c.subjectDim = s.subjectDim
    }

    // Hover inspection: only during the x-ray / rebuild pass. Fine pointers
    // inspect continuously; coarse pointers (phones/tablets) still can tap the
    // internals and see the same tooltip for a beat. The window is short so a
    // finger-led scroll never reads as a pick.
    const tapActive = performance.now() - hoverPointer.lastTap < 350
    const pickActive = XRAY_ACTS.has(act) && !REDUCED && (hoverPointer.fine || tapActive)
    setXrayActive(pickActive)
    // Blend-in of hover highlights is frame-driven from the shared inspect
    // module, so the die / cell glow never pops.
    tickInspect(delta)
    if (pickActive && internalsGroup.current && hoverPointer.dirty) {
      hoverPointer.dirty = false
      _ray.setFromCamera(hoverPointer.ndc, cam)
      updatePick(_ray, cam, internalsGroup.current)
    } else if (!pickActive) {
      resyncPick(cam)
      updatePick(_ray, cam, null)
    }
  })

  return null
}