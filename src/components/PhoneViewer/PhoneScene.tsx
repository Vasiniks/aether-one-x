import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import type { FocusLensId } from './PhoneConfig'
import { usePhoneConfig } from './PhoneConfig'
import { PhoneLighting, useLightRig } from './PhoneLighting'
import { PhoneModel } from './PhoneModel'
import { useStorySnapshot } from './usePhoneScroll'

export type SceneId = 'hero' | 'reveal' | 'camera' | 'display' | 'performance' | 'config' | 'final'

/** Story section id that drives each scene's pose. */
export const SECTION_FOR_SCENE: Record<SceneId, string> = {
  hero: 'overview',
  reveal: 'reveal',
  camera: 'cameras',
  display: 'display',
  performance: 'performance',
  config: 'buy',
  final: 'final',
}

interface Pose {
  x: number
  y: number
  z: number
}

interface Beat {
  at: number
  rot: Pose
  /** 1 = phone fills exactly `fraction` of the viewport height. <1 pushes in. */
  dolly: number
  scale: number
  /** Studio key-light intensity multiplier. */
  light: number
  camX?: number
  camY?: number
}

/** Fictional Aether One X body height (meters). */
const PHONE_H = 0.1596

/** Target share of total viewport height that the phone must occupy (dolly 1). */
const FRACTION: Record<SceneId, number> = {
  hero: 0.58,
  reveal: 0.6,
  camera: 0.62,
  display: 0.62,
  performance: 0.5,
  config: 0.62,
  final: 0.66,
}

/**
 * Long cinematic orbit for the Product Reveal sticky film:
 * front three-quarter -> almost front -> edge profile -> rear -> camera
 * island emphasis -> back around -> front display takeover -> product angle.
 */
export const REVEAL_BEATS: Beat[] = [
  { at: 0, rot: { x: -0.3, y: 0.22, z: 0 }, dolly: 1.12, scale: 1, light: 0.9, camX: 0, camY: 0 },
  { at: 0.16, rot: { x: -0.18, y: 0.06, z: 0 }, dolly: 0.98, scale: 1.05, light: 1, camX: 0, camY: 0 },
  { at: 0.24, rot: { x: -0.48, y: 1.06, z: 0.03 }, dolly: 0.96, scale: 1.05, light: 1.05, camX: -0.05, camY: 0.02 },
  { at: 0.38, rot: { x: -0.5, y: 1.75, z: 0.04 }, dolly: 0.9, scale: 1.08, light: 1.1, camX: -0.06, camY: 0.02 },
  { at: 0.52, rot: { x: -0.55, y: 2.3, z: 0.05 }, dolly: 0.84, scale: 1.1, light: 1.15, camX: -0.07, camY: 0.02 },
  { at: 0.62, rot: { x: -0.62, y: 2.72, z: 0.05 }, dolly: 0.74, scale: 1.16, light: 1.2, camX: -0.08, camY: 0.03 },
  { at: 0.74, rot: { x: -0.32, y: 1.75, z: 0.04 }, dolly: 0.82, scale: 1.12, light: 1.1, camX: -0.04, camY: 0.01 },
  { at: 0.86, rot: { x: -0.05, y: 0.05, z: 0 }, dolly: 0.72, scale: 1.18, light: 1.05, camX: 0, camY: 0 },
  { at: 1, rot: { x: -0.28, y: 0.5, z: 0 }, dolly: 0.95, scale: 1.05, light: 1, camX: 0, camY: 0 },
]

const STATIC: Record<'hero' | 'performance' | 'config' | 'final', { base: Beat; sway: number }> = {
  hero: {
    base: { at: 0, rot: { x: -0.28, y: 0.35, z: 0 }, dolly: 1, scale: 1.08, light: 1, camX: 0, camY: 0 },
    sway: 0.028,
  },
  performance: {
    base: { at: 0, rot: { x: -0.06, y: 1.52, z: 0.02 }, dolly: 1, scale: 1.12, light: 1.05, camX: 0, camY: 0 },
    sway: 0.05,
  },
  config: {
    base: { at: 0, rot: { x: -0.32, y: 2.28, z: 0.05 }, dolly: 1, scale: 1.14, light: 1.1, camX: 0, camY: 0.02 },
    sway: 0.025,
  },
  final: {
    base: { at: 0, rot: { x: -0.3, y: 0.52, z: 0 }, dolly: 1, scale: 1.08, light: 1.15, camX: 0, camY: 0 },
    sway: 0.03,
  },
}

const CAMERA_BASE: Beat = {
  at: 0,
  rot: { x: -0.5, y: 2.25, z: 0.05 },
  dolly: 0.9,
  scale: 1.16,
  light: 1.1,
  camX: -0.03,
  camY: 0.02,
}

const DISPLAY_BASE: Beat = {
  at: 0,
  rot: { x: -0.05, y: 0.03, z: 0 },
  dolly: 0.82,
  scale: 1.2,
  light: 1.05,
  camX: 0,
  camY: 0,
}

/** Small pitch toward each lens so selection brings that optic into focus. */
const FOCUS_TILT: Record<FocusLensId, { x: number; y: number }> = {
  main: { x: -0.05, y: 0 },
  ultra: { x: -0.28, y: 0 },
  tele: { x: 0.35, y: 0 },
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }
}

function sampleBeat(beats: Beat[], p: number, reduce: boolean): Beat {
  if (reduce) return beats[0]
  if (p <= beats[0].at) return beats[0]
  for (let i = 1; i < beats.length; i++) {
    const b = beats[i]
    if (p <= b.at) {
      const a = beats[i - 1]
      const t = (p - a.at) / (b.at - a.at)
      return {
        at: p,
        rot: lerpPose(a.rot, b.rot, t),
        dolly: a.dolly + (b.dolly - a.dolly) * t,
        scale: a.scale + (b.scale - a.scale) * t,
        light: a.light + (b.light - a.light) * t,
        camX: (a.camX ?? 0) + ((b.camX ?? 0) - (a.camX ?? 0)) * t,
        camY: (a.camY ?? 0) + ((b.camY ?? 0) - (a.camY ?? 0)) * t,
      }
    }
  }
  return beats[beats.length - 1]
}

function computeTarget(scene: SceneId, progress: number, focusLens: FocusLensId, reduce: boolean, t: number): Beat {
  const sway = (amplitude: number) => (reduce ? 0 : Math.sin(t * 0.65) * amplitude)
  const p = reduce ? 0 : progress

  switch (scene) {
    case 'reveal':
      return sampleBeat(REVEAL_BEATS, p, reduce)
    case 'camera': {
      const tilt = FOCUS_TILT[focusLens]
      const base = CAMERA_BASE
      return {
        at: 0,
        rot: {
          x: base.rot.x + tilt.x + (p - 0.5) * 0.03,
          y: base.rot.y + tilt.y + (p - 0.5) * 0.05,
          z: base.rot.z + (p - 0.5) * 0.1,
        },
        dolly: base.dolly + (p - 0.5) * 0.06,
        scale: base.scale,
        light: base.light,
        camX: base.camX,
        camY: base.camY,
      }
    }
    case 'display': {
      const base = DISPLAY_BASE
      return {
        at: 0,
        rot: {
          x: base.rot.x + (p - 0.5) * 0.02,
          y: base.rot.y + (p - 0.5) * 0.08,
          z: base.rot.z + (p - 0.5) * 0.05,
        },
        dolly: base.dolly + (p - 0.5) * 0.03,
        scale: base.scale,
        light: base.light,
        camX: base.camX,
        camY: base.camY,
      }
    }
    default: {
      const { base, sway: amp } = STATIC[scene]
      const rot = reduce
        ? base.rot
        : { x: base.rot.x, y: base.rot.y + sway(amp), z: base.rot.z + sway(amp * 0.6) }
      return { ...base, rot }
    }
  }
}

/**
 * A scroll-driven 3D phone instance. Reads the shared story tracker and
 * continuously damps the phone group toward its target pose while a camera
 * rig keeps the phone at a viewport-aware size (a fixed fraction of visible
 * height), dollying in and out with the cinematic beats.
 */
export function PhoneScene({ scene }: { scene: SceneId }) {
  const rotor = useRef<THREE.Group>(null)
  const reduce = !!useReducedMotion()
  const { focusLens } = usePhoneConfig()
  const { progress } = useStorySnapshot()
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const rig = useLightRig()
  const raw = progress[SECTION_FOR_SCENE[scene]] ?? 0

  useFrame((state, delta) => {
    const g = rotor.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const target = computeTarget(scene, raw, focusLens, reduce, state.clock.elapsedTime)

    const damp = 1 - Math.exp(-dt * 5.5)
    const rot = target.rot

    if (reduce) {
      g.rotation.set(rot.x, rot.y, rot.z)
      g.scale.setScalar(target.scale)
    } else {
      g.rotation.x += (rot.x - g.rotation.x) * damp
      g.rotation.y += (rot.y - g.rotation.y) * damp
      g.rotation.z += (rot.z - g.rotation.z) * damp
      g.scale.x += (target.scale - g.scale.x) * damp
      g.scale.setScalar(g.scale.x)
    }

    const fovRad = (camera.fov * Math.PI) / 180
    const distance = (PHONE_H * g.scale.x) / (2 * FRACTION[scene] * Math.tan(fovRad / 2))

    if (reduce) {
      camera.position.set(target.camX ?? 0, target.camY ?? 0, distance)
    } else {
      camera.position.x += ((target.camX ?? 0) - camera.position.x) * damp
      camera.position.y += ((target.camY ?? 0) - camera.position.y) * damp
      camera.position.z += (distance - camera.position.z) * damp
    }
    camera.lookAt(0, 0, 0)

    const key = rig.key.current
    if (key) {
      const targetIntensity = 1.15 * target.light
      key.intensity += (targetIntensity - key.intensity) * damp
    }
  })

  return (
    <>
      <PhoneLighting rig={rig} />
      <group ref={rotor}>
        <PhoneModel />
      </group>
    </>
  )
}