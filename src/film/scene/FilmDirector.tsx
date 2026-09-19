import { useFrame } from '@react-three/fiber'
import type { MutableRefObject, RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { sampleFilm, computeFilmStates } from '../camera'
import { actAt } from '../story'
import { centerBias, fitFov, macroFloorFov } from '../framing'
import { FILM_MATERIALS } from './materials'
import { getLiveScreen, type ScreenMode } from './display/LiveScreen'
import { STAGE_LIGHTING } from '../lighting/light-states'
import { setXrayActive, updatePick, hoverPointer, tick as tickInspect, resyncPick } from '../xray/inspect'
import type { InternalsControl } from './internals/Internals'
import type { OpticsControl } from '../../components/PhoneViewer/CameraAssembly'

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
  ordered: boolean
  warmed: boolean
  bgMesh: THREE.Mesh | null
  lastBgMap: THREE.Texture | null
} = {
  look: new THREE.Vector3(),
  screenTick: 0,
  screenMode: 'off',
  envInt: 0.9,
  lastGhost: false,
  lastShellGhost: -1,
  lastEnvInt: -1,
  lastFrameGhost: -1,
  ordered: false,
  warmed: false,
  bgMesh: null,
  lastBgMap: null,
}

const _ray = new THREE.Raycaster()

/**
 * One-time transparent pass ordering. materials.ts tags each shell material
 * with a tier (1 rear, 2 internals, 3 frame, 4 front glass, 5 additive), but
 * three.js sorts by Object3D.renderOrder, not material state, so that tag
 * alone never orders the pass. This copies the tier onto the meshes once at
 * mount: rear shell draws first, internals next, frame, then front glass and
 * display, additive traces last. Far to near, no per-frame sort churn, no
 * shader recompile. Background sphere pins to -10 so it always opens.
 */
function orderTransparentPass(
  state: { scene: THREE.Scene },
  shellRefs: {
    frame: MutableRefObject<THREE.Group | null>
    back: MutableRefObject<THREE.Group | null>
    glass: MutableRefObject<THREE.Group | null>
  },
  internalsGroup: RefObject<THREE.Group | null>,
): THREE.Mesh | null {
  const setTier = (root: THREE.Object3D | null, tier: number) => {
    if (!root) return
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.renderOrder = tier
    })
  }
  setTier(shellRefs.back.current, 1)
  const ig = internalsGroup.current
  if (ig) {
    ig.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      let additive = false
      for (const m of mats) {
        if (m && (m as THREE.Material).blending === THREE.AdditiveBlending) {
          additive = true
          break
        }
      }
      mesh.renderOrder = additive ? 5 : 2
    })
  }
  setTier(shellRefs.frame.current, 3)
  setTier(shellRefs.glass.current, 4)

  // Background gradient sphere opens the pass so the phone never sorts
  // against it mid-stack.
  let bg: THREE.Mesh | null = null
  state.scene.traverse((o) => {
    if (bg || !(o as THREE.Mesh).isMesh) return
    const mesh = o as THREE.Mesh
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      const mat = m as THREE.MeshBasicMaterial
      if (mat && mat.side === THREE.BackSide) {
        mesh.renderOrder = -10
        bg = mesh
        break
      }
    }
  })
  return bg
}

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
  opticsRef,
  shellRefs,
}: {
  progress: MotionValue<number>
  heroRef: RefObject<THREE.Group | null>
  internals: RefObject<InternalsControl | null>
  internalsGroup: RefObject<THREE.Group | null>
  opticsRef: RefObject<OpticsControl | null>
  shellRefs: {
    frame: MutableRefObject<THREE.Group | null>
    back: MutableRefObject<THREE.Group | null>
    glass: MutableRefObject<THREE.Group | null>
  }
}) {
  useFrame((state, delta) => {
    // One-time pass setup: deterministic renderOrder tiers plus a single
    // shader prewarm once every group ref resolves. After this flag flips the
    // frame loop stays allocation-free again.
    if (!SCRATCH.ordered) {
      if (
        shellRefs.back.current &&
        shellRefs.frame.current &&
        shellRefs.glass.current &&
        internalsGroup.current
      ) {
        SCRATCH.bgMesh = orderTransparentPass(state, shellRefs, internalsGroup)
        if (SCRATCH.bgMesh) {
          const mat = SCRATCH.bgMesh.material as THREE.MeshBasicMaterial
          SCRATCH.lastBgMap = mat.map ?? null
        }
        SCRATCH.ordered = true
        if (!SCRATCH.warmed) {
          SCRATCH.warmed = true
          try {
            state.gl.compile(state.scene, state.camera)
          } catch {
            // Prewarm is best effort; the film runs unwarmed rather than loud.
          }
        }
      }
    } else if (SCRATCH.bgMesh) {
      // Act-change texture disposal: StageLighting repaints its 1x128
      // gradient onto a fresh CanvasTexture per palette step. The old map is
      // already unbound here, so dispose it before adopting the new one.
      // Rare path (a few times per full scroll), never per frame.
      const mat = SCRATCH.bgMesh.material as THREE.MeshBasicMaterial
      const cur = mat.map ?? null
      if (cur !== SCRATCH.lastBgMap) {
        if (SCRATCH.lastBgMap) SCRATCH.lastBgMap.dispose()
        SCRATCH.lastBgMap = cur
      }
    }

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
    // Detail shots (no `fit`) are authored against a 3:2 frame; on ultrawides
    // the fixed world offset leaves the focused optics hugging the near edge
    // (the hero glass ring gets cropped). Amplify the macro offset with the
    // wide-frame room - the phone slides deeper into the open space the same
    // way centerBias already does for hero keys, so the module reads centered.
    const macroPx = t.fit == null ? 1 + Math.min(1, Math.max(0, (aspect - 1.9) / 1.6)) * 5 : 1
    // Read the off-center offset once; never mutate the shared sample buffer.
    const px = t.fit != null ? t.px * bx : t.px * macroPx
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
    const distance = cam.position.distanceTo(SCRATCH.look)
    let targetFov = t.fov
    if (t.fit != null) {
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
    // Narrow-aspect macro floor: authored macro shots are tuned against a 3:2
    // frame, so on a portrait phone the module / die / cell can overrun the
    // horizontal frame. Widen the lens just enough to keep the subject fully
    // in view (desktop and ultrawide keep their tight, hand-tuned macro).
    if (aspect < 0.8) {
      const floor = macroFloorFov(p, distance, aspect)
      if (floor > targetFov) targetFov = floor
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
    // + ghost line still carry the silhouette. At the 0.02 floor the group is
    // fully culled: 23 transparent draws for zero pixels become zero draws,
    // and the die keeps every pixel. Restored as soon as alpha lifts.
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
      if (shellRefs.frame.current) {
        shellRefs.frame.current.visible = !(frameAlpha <= 0.05 && s.chipFocus > 0.4)
      }
    } else if (shellRefs.frame.current && !shellRefs.frame.current.visible) {
      shellRefs.frame.current.visible = true
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

    // Camera optics explosion: the shell module's elements part from the body
    // along the optical axis only while the macro owns the frame. While the
    // internals own the frame (x-ray/rebuild) the shell module is culled so
    // its 38 meshes don't render a redundant pass over their internals twins.
    // The chip dive culls it too: the macro camera sits inside the cavity on
    // the die while the island sits far off-frame, so the seated module would
    // shade 38 draws for zero pixels. Hero and camera macro keep it.
    if (opticsRef.current) {
      opticsRef.current.optics = s.optical
      const chipOffFrame = s.chipFocus > 0.4 && s.cameraFocus < 0.01 && s.optical < 0.01
      opticsRef.current.visible = !ghost && !chipOffFrame
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