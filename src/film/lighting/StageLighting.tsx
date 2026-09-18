import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { actAt } from '../story'
import { DEFAULT_STAGE, STAGE_LIGHTING, type StageLightState } from './light-states'

/**
 * The film's studio rig. Key / rim / fill / accent directional lights plus an
 * interior glow and an IBL environment all lerp continuously toward the
 * current act's design; the background is a soft vertical gradient that shifts
 * with the story. The phone is the bright object on a dark stage.
 *
 * The environment is a coherent studio: one soft key panel, a long specular
 * strip for the machined edges, and a faint cool fill bounce. That is what
 * gives the metal its "baked in the studio" read, and since it is built from
 * actual Lightformers the reflections stay mathematically consistent with the
 * directional rig that lights the scene.
 */

const KEY_ELEVATION = 38 // degrees from horizon; high key keeps faces open.
const ENV_KEY_INTENSITY = 1.15
const ENV_STRIP_INTENSITY = 0.85
const ENV_FILL_INTENSITY = 0.5
const ENV_RIM_INTENSITY = 0.55

/** 1x128 vertical gradient painted whenever the act's palette changes. */
function makeBackground(top: string, base: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1
  c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, top)
  grad.addColorStop(1, base)
  g.fillStyle = grad
  g.fillRect(0, 0, 1, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const _from = new THREE.Color()
const _to = new THREE.Color()
const _mix = new THREE.Color()
const _accPos = new THREE.Vector3()

export { DEFAULT_STAGE, STAGE_LIGHTING }
export type { StageLightState }

export function StageLighting({ progress }: { progress: MotionValue<number> }) {
  const key = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const rimR = useRef<THREE.DirectionalLight>(null)
  const under = useRef<THREE.DirectionalLight>(null)
  const accent = useRef<THREE.PointLight>(null)
  const interior = useRef<THREE.PointLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const bgMat = useRef<THREE.MeshBasicMaterial>(null)
  const paletteKey = useRef('')
  const accPos = useRef(new THREE.Vector3(0, 0.1, 0.4))

  useFrame((state, delta) => {
    const act = actAt(progress.get()).id
    const target: StageLightState = STAGE_LIGHTING[act] ?? DEFAULT_STAGE
    const d = 1 - Math.exp(-delta * 5)

    if (ambient.current) {
      ambient.current.intensity += (0.08 + target.envIntensity * 0.04 - ambient.current.intensity) * d
    }
    if (key.current) key.current.intensity += (target.key - key.current.intensity) * d
    if (fill.current) fill.current.intensity += (target.fill - fill.current.intensity) * d
    if (rim.current) rim.current.intensity += (target.rim - rim.current.intensity) * d

    // Counter-key from the right so the far edge keeps a hairline of light even
    // in tall, narrow stages; the under-bounce stops shadows from swallowing
    // the bottom of the device during the hardware acts.
    if (rimR.current) rimR.current.intensity += (target.rim * 0.32 - rimR.current.intensity) * d
    if (under.current) under.current.intensity += (target.fill * 0.3 - under.current.intensity) * d

    if (interior.current) interior.current.intensity += (target.interiorGlow - interior.current.intensity) * d

    // IBL response per act (the "environment" channel): metal reflections
    // follow the story (thin and cool during the x-ray, hot during the chip)
    // instead of staying pinned at full studio brightness.
    const env = state.scene as THREE.Scene & { environmentIntensity: number }
    env.environmentIntensity += (target.envIntensity - env.environmentIntensity) * d

    // Accent parks on the subject of the act and drifts, rather than snapping.
    if (accent.current) {
      accent.current.intensity += (target.accent - accent.current.intensity) * d
      _from.copy(accent.current.color)
      _to.set(target.accentColor)
      accent.current.color.copy(_mix.copy(_from).lerp(_to, d))
      _accPos.set(target.accentPosition[0], target.accentPosition[1], target.accentPosition[2])
      accPos.current.lerp(_accPos, d)
      accent.current.position.copy(accPos.current)
    }

    // Background gradient follows the act's palette (repaint only on change).
    const palette = target.baseColor + target.topColor
    if (palette !== paletteKey.current) {
      paletteKey.current = palette
      if (bgMat.current) bgMat.current.map = makeBackground(target.topColor, target.baseColor)
    }
  })

  // High, slightly pulled key so the hero planes stay open and the machined
  // rails catch a long specular: `KEY_ELEVATION` off the horizon.
  const keyY = Math.tan((KEY_ELEVATION * Math.PI) / 180) * 2.8

  return (
    <>
      <BackgroundSphere bgMat={bgMat} initial={makeBackground(DEFAULT_STAGE.topColor, DEFAULT_STAGE.baseColor)} />
      <ambientLight ref={ambient} intensity={0.22} />
      <directionalLight ref={key} position={[2.1, keyY, 2.8]} intensity={1.1} color="#eef3ff" />
      <directionalLight ref={fill} position={[-3, 0.5, 1.4]} intensity={0.45} color="#9db4dd" />
      <directionalLight ref={rim} position={[-2.6, 1.1, -2.1]} intensity={1.4} color="#dfe8ff" />
      <directionalLight ref={rimR} position={[2.6, 0.3, -1.9]} intensity={0.45} color="#dce7ff" />
      <directionalLight ref={under} position={[0.4, -0.6, 1.2]} intensity={0.16} color="#8aa3d0" />
      <pointLight ref={accent} position={[0, 0.1, 0.4]} intensity={0.2} distance={1.6} decay={2} color="#7fb0ff" />
      <pointLight ref={interior} position={[0, 0, 0]} intensity={0} distance={1.4} decay={2} color="#7fb4ff" />
      <ContactShadows position={[0, -0.08, 0]} opacity={0.45} scale={5} blur={3.2} far={0.5} resolution={512} frames={90} />
      <Environment frames={1} resolution={256}>
        <Lightformer intensity={ENV_KEY_INTENSITY} position={[0, 3.4, 5]} scale={[10, 4, 1]} rotation-x={-Math.PI / 5} form="rect" color="#f0f5ff" />
        <Lightformer intensity={ENV_STRIP_INTENSITY} position={[-4.5, 1.4, 2.5]} scale={[3.4, 8, 1]} rotation-y={Math.PI / 4} form="rect" color="#dcecff" />
        <Lightformer intensity={ENV_FILL_INTENSITY} position={[5, -0.4, 1.8]} scale={[4, 5, 1]} rotation-y={-Math.PI / 2} form="rect" color="#9fb6df" />
        <Lightformer intensity={0.4} position={[0, -3.6, 2]} scale={[8, 2, 1]} rotation-x={-Math.PI / 2} color="#e9f2ff" />
        <Lightformer intensity={ENV_RIM_INTENSITY} position={[0, 2.4, -4]} scale={[8, 3, 1]} form="rect" color="#ffffff" />
      </Environment>
    </>
  )
}

function BackgroundSphere({
  bgMat,
  initial,
}: {
  bgMat: RefObject<THREE.MeshBasicMaterial | null>
  initial: THREE.CanvasTexture
}) {
  return (
    <mesh>
      <sphereGeometry args={[9, 16, 16]} />
      <meshBasicMaterial
        ref={bgMat}
        map={initial}
        color="#000000"
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}