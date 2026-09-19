import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { actAt } from '../story'
import { ProductEnvironment } from './ProductEnvironment'
import { DEFAULT_STAGE, STAGE_LIGHTING, type StageLightState } from './light-states'

/**
 * The film's studio rig. Key / fill / rim / counter-rim / underside /
 * accent + interior glow all lerp continuously toward the current act's
 * design, joined by a rear rim and an optical pin that only wake during the
 * camera macro; the background is a soft vertical gradient that shifts with
 * the story, and the IBL/PMREM environment rides next to it. The phone is the
 * bright object on a dark stage.
 *
 * The environment (ProductEnvironment) is a coherent studio: one soft key
 * panel, a long thin rail that runs the titanium edges, a broad soft slab for
 * the rear ceramic, and a faint cool fill bounce. That is what gives the metal
 * its "baked in the studio" read, and since it is built from actual
 * Lightformers the reflections stay mathematically consistent with the
 * directional rig that lights the scene.
 */

const KEY_ELEVATION = 38 // degrees from horizon; high key keeps faces open.

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
const _intPos = new THREE.Vector3()

export function StageLighting({ progress }: { progress: MotionValue<number> }) {
  const key = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const rimR = useRef<THREE.DirectionalLight>(null)
  const under = useRef<THREE.DirectionalLight>(null)
  const accent = useRef<THREE.PointLight>(null)
  const interior = useRef<THREE.PointLight>(null)
  const rearRim = useRef<THREE.DirectionalLight>(null)
  const optic = useRef<THREE.PointLight>(null)
  const opticPos = useRef(new THREE.Vector3(0.03, 0.05, 0.006))
  const ambient = useRef<THREE.AmbientLight>(null)
  const bgMat = useRef<THREE.MeshBasicMaterial>(null)
  const bgTop = useRef(new THREE.Color(DEFAULT_STAGE.topColor))
  const bgBase = useRef(new THREE.Color(DEFAULT_STAGE.baseColor))
  const paintedTop = useRef(new THREE.Color(DEFAULT_STAGE.topColor))
  const paintedBase = useRef(new THREE.Color(DEFAULT_STAGE.baseColor))
  const accPos = useRef(new THREE.Vector3(0, 0.1, 0.4))
  const intPos = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state, delta) => {
    const act = actAt(progress.get()).id
    const target: StageLightState = STAGE_LIGHTING[act] ?? DEFAULT_STAGE
    // Two damping rates: k=6 lets accent/intensity channels track the moving
    // camera tightly; k=3.5 lets the background grade breathe across acts
    // instead of snapping, so nothing jumps between acts.
    const d = 1 - Math.exp(-delta * 6)
    const dSlow = 1 - Math.exp(-delta * 3.5)

    if (ambient.current) {
      ambient.current.intensity += (0.08 + target.envIntensity * 0.04 - ambient.current.intensity) * d
    }
    // Key / fill / rim track both intensity and tint, so a warm cell act or a
    // cool board pass shifts the whole hero trio without a sudden re-grade.
    if (key.current) {
      key.current.intensity += (target.key - key.current.intensity) * d
      _from.copy(key.current.color)
      _to.set(target.keyColor)
      key.current.color.copy(_mix.copy(_from).lerp(_to, d))
    }
    if (fill.current) {
      fill.current.intensity += (target.fill - fill.current.intensity) * d
      _from.copy(fill.current.color)
      _to.set(target.fillColor)
      fill.current.color.copy(_mix.copy(_from).lerp(_to, d))
    }
    if (rim.current) {
      rim.current.intensity += (target.rim - rim.current.intensity) * d
      _from.copy(rim.current.color)
      _to.set(target.rimColor)
      rim.current.color.copy(_mix.copy(_from).lerp(_to, d))
    }

    // Counter-rim keeps a hairline on the far edge, and the underside bounce
    // stops shadows from swallowing the bottom of the device. Each has its own
    // per-act value so dark hardware acts keep a lit floor and a silhouette.
    if (rimR.current) rimR.current.intensity += (target.rimR - rimR.current.intensity) * d
    if (under.current) under.current.intensity += (target.under - under.current.intensity) * d

    // Rear rim only engages while the rear faces the camera (camera act), so
    // the housing edge stays traced as the lens macro breathes in.
    if (rearRim.current) rearRim.current.intensity += (target.rearRim - rearRim.current.intensity) * d

    // Optical pin: a micro point sparkle parked on the outer lens ring. It
    // reads only on the macro, sitting just off the ring so the falloff edge
    // lands on the housing rim instead of the void.
    if (optic.current) {
      optic.current.intensity += (target.optic - optic.current.intensity) * d
      _accPos.set(target.opticPosition[0], target.opticPosition[1], target.opticPosition[2])
      opticPos.current.lerp(_accPos, d)
      optic.current.position.copy(opticPos.current)
    }

    // Interior glow moves to the act's energy center and shifts its color
    // (amber over the die, teal at the cell) instead of pinning one static hue.
    if (interior.current) {
      interior.current.intensity += (target.interiorGlow - interior.current.intensity) * d
      _from.copy(interior.current.color)
      _to.set(target.interiorColor)
      interior.current.color.copy(_mix.copy(_from).lerp(_to, d))
      _intPos.set(target.interiorPosition[0], target.interiorPosition[1], target.interiorPosition[2])
      intPos.current.lerp(_intPos, d)
      interior.current.position.copy(intPos.current)
    }

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

    // Background palette damps at the slow rate (dSlow) so the grade breathes
    // while the rig follows the camera. Repaint the 1x128 canvas only when a
    // channel has moved at least one 8-bit step (~1/255) to stay cheap.
    _from.copy(bgTop.current).lerp(_to.set(target.topColor), dSlow)
    bgTop.current.copy(_from)
    _from.copy(bgBase.current).lerp(_to.set(target.baseColor), dSlow)
    bgBase.current.copy(_from)
    if (bgMat.current) {
      const step = 1 / 255
      const moved =
        Math.abs(bgTop.current.r - paintedTop.current.r) > step ||
        Math.abs(bgTop.current.g - paintedTop.current.g) > step ||
        Math.abs(bgTop.current.b - paintedTop.current.b) > step ||
        Math.abs(bgBase.current.r - paintedBase.current.r) > step ||
        Math.abs(bgBase.current.g - paintedBase.current.g) > step ||
        Math.abs(bgBase.current.b - paintedBase.current.b) > step
      if (moved) {
        const next = makeBackground('#' + bgTop.current.getHexString(), '#' + bgBase.current.getHexString())
        if (bgMat.current.map) bgMat.current.map.dispose()
        bgMat.current.map = next
        paintedTop.current.copy(bgTop.current)
        paintedBase.current.copy(bgBase.current)
      }
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
      <directionalLight ref={rearRim} position={[0.7, 0.35, -1.2]} intensity={0} color="#eef3ff" />
      <pointLight ref={optic} position={[0.03, 0.05, 0.006]} intensity={0} distance={0.5} decay={2} color="#f4f9ff" />
      <ContactShadows position={[0, -0.08, 0]} opacity={0.45} scale={5} blur={3.2} far={0.5} resolution={512} frames={1} />
      <ProductEnvironment />
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
      {/* Radius 2.5 keeps every wall inside the film camera far plane while the
          phone and the exploded stack stay deep inside; white base color lets
          the gradient map show, and BackSide faces the camera. */}
      <sphereGeometry args={[2.5, 16, 16]} />
      <meshBasicMaterial
        ref={bgMat}
        map={initial}
        color="#ffffff"
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}