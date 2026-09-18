import { ContactShadows, Environment } from '@react-three/drei'
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
 * The environment is painted like a photo studio rather than a sky: one soft
 * key panel, a long specular strip for the machined edges, and a faint cool
 * fill bounce. That is what gives the metal its "baked in the studio" read.
 */

const ENV_SPHERE_TEX = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const w = c.width
  const h = c.height

  // Deep stage base with a faint horizon seam.
  const base = g.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#070b14')
  base.addColorStop(0.72, '#05070d')
  base.addColorStop(1, '#0a0f1c')
  g.fillStyle = base
  g.fillRect(0, 0, w, h)

  // Soft key panel, upper right: the hero reflection on the titanium edge.
  let panel = g.createRadialGradient((w * 0.72), h * 0.26, 4, w * 0.72, h * 0.26, w * 0.18)
  panel.addColorStop(0, 'rgba(236,241,250,0.95)')
  panel.addColorStop(0.55, 'rgba(158,178,216,0.5)')
  panel.addColorStop(1, 'rgba(120,145,200,0)')
  g.fillStyle = panel
  g.fillRect(0, 0, w, h)

  // Long narrow specular strip, upper left: one continuous edge light.
  for (let i = 0; i < 5; i++) {
    g.fillStyle = `rgba(250,253,255,${0.28 - i * 0.045})`
    g.fillRect(w * 0.1 + i, h * 0.24, w * 0.085, h * 0.015)
  }

  // Cool fill bounce, lower left: rounds the dark ceramic without lifting it.
  panel = g.createRadialGradient(w * 0.18, h * 0.78, 3, w * 0.18, h * 0.78, w * 0.16)
  panel.addColorStop(0, 'rgba(140,164,214,0.32)')
  panel.addColorStop(1, 'rgba(140,164,214,0)')
  g.fillStyle = panel
  g.fillRect(0, 0, w, h)

  // Tiny cool glint lower right (the far rim catching the fill).
  panel = g.createRadialGradient(w * 0.88, h * 0.66, 2, w * 0.88, h * 0.66, w * 0.07)
  panel.addColorStop(0, 'rgba(180,196,234,0.22)')
  panel.addColorStop(1, 'rgba(180,196,234,0)')
  g.fillStyle = panel
  g.fillRect(0, 0, w, h)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
})()

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
  const accent = useRef<THREE.PointLight>(null)
  const interior = useRef<THREE.PointLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const bgMat = useRef<THREE.MeshBasicMaterial>(null)
  const paletteKey = useRef('')
  const accPos = useRef(new THREE.Vector3(0, 0.1, 0.4))

  useFrame((_, delta) => {
    const act = actAt(progress.get()).id
    const target: StageLightState = STAGE_LIGHTING[act] ?? DEFAULT_STAGE
    const d = 1 - Math.exp(-delta * 5)

    if (ambient.current) {
      ambient.current.intensity += (0.1 + target.envIntensity * 0.05 - ambient.current.intensity) * d
    }
    if (key.current) key.current.intensity += (target.key - key.current.intensity) * d
    if (fill.current) fill.current.intensity += (target.fill - fill.current.intensity) * d
    if (rim.current) rim.current.intensity += (target.rim - rim.current.intensity) * d
    if (interior.current) interior.current.intensity += (target.interiorGlow - interior.current.intensity) * d

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

  return (
    <>
      <BackgroundSphere bgMat={bgMat} initial={makeBackground(DEFAULT_STAGE.topColor, DEFAULT_STAGE.baseColor)} />
      <ambientLight ref={ambient} intensity={0.22} />
      <directionalLight ref={key} position={[2.1, 1.5, 2.8]} intensity={1.1} color="#eef3ff" />
      <directionalLight ref={fill} position={[-3, 0.5, 1.4]} intensity={0.45} color="#9db4dd" />
      <directionalLight ref={rim} position={[-2.6, 1.1, -2.1]} intensity={1.4} color="#dfe8ff" />
      <pointLight ref={accent} position={[0, 0.1, 0.4]} intensity={0.2} distance={1.6} decay={2} color="#7fb0ff" />
      <pointLight ref={interior} position={[0, 0, 0]} intensity={0} distance={1.4} decay={2} color="#7fb4ff" />
      <ContactShadows position={[0, -0.22, 0]} opacity={0.5} scale={6} blur={3.4} far={0.5} resolution={256} frames={30} />
      <Environment frames={1} resolution={256}>
        <mesh>
          <sphereGeometry args={[6, 32, 32]} />
          <meshBasicMaterial map={ENV_SPHERE_TEX} side={THREE.BackSide} />
        </mesh>
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