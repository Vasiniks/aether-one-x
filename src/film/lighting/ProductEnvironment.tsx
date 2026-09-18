import { Environment, Lightformer } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect } from 'react'
import * as THREE from 'three'

/**
 * Self-contained product-filmmaking IBL. Replaces the drei <Environment> block
 * that lives inside StageLighting.tsx with a brighter procedural studio: one
 * broad soft key (ceramic), a tall crisp strip (titanium rails), cool fill, a
 * floor bounce and an overhead strip so reflections keep a full vertical range
 * in tall / ultrawide framing. Owns renderer tonemapping (idempotent writes)
 * and the scene.environmentIntensity channel. See ENV_TONEMAP.
 *
 * Swap: in StageLighting.tsx delete the <Environment> element and its
 * Lightformer children, and mount <ProductEnvironment /> in their place.
 *
 * Driving scene.environmentIntensity:
 *  - Keep `intensity` at 1 (default) to preserve StageLighting's per-act story
 *    lerp of scene.environmentIntensity (its frame loop still runs).
 *  - To take over the channel, call setEnvIntensity(v) from your own useFrame
 *    (registered after StageLighting's, so it wins per frame after a lerp),
 *    or pass a changing `intensity` prop; use exactly one driver at a time.
 */

export const ENV_TONEMAP = {
  toneMapping: THREE.ACESFilmicToneMapping,
  exposure: 1.1,
  colorspace: THREE.SRGBColorSpace,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
} as const

let activeScene: THREE.Scene | null = null

export function setEnvIntensity(value: number): void {
  if (activeScene) activeScene.environmentIntensity = value
}

export interface ProductEnvironmentProps {
  /** Master IBL gain on scene.environmentIntensity. Keep 1 for the story lerp. */
  intensity?: number
  /** Per-face PMREM cube size. */
  resolution?: number
}

export function ProductEnvironment({ intensity = 1, resolution = 256 }: ProductEnvironmentProps) {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)

  useLayoutEffect(() => {
    activeScene = scene
    setEnvIntensity(intensity)
    return () => {
      if (activeScene === scene) activeScene = null
    }
  }, [scene, intensity])

  useEffect(() => {
    const prev = {
      toneMapping: gl.toneMapping,
      toneMappingExposure: gl.toneMappingExposure,
      outputColorSpace: gl.outputColorSpace,
    }
    if (gl.toneMapping !== ENV_TONEMAP.toneMapping) gl.toneMapping = ENV_TONEMAP.toneMapping
    if (gl.toneMappingExposure !== ENV_TONEMAP.exposure) gl.toneMappingExposure = ENV_TONEMAP.exposure
    if (gl.outputColorSpace !== ENV_TONEMAP.colorspace) gl.outputColorSpace = ENV_TONEMAP.colorspace
    return () => {
      gl.toneMapping = prev.toneMapping
      gl.toneMappingExposure = prev.toneMappingExposure
      gl.outputColorSpace = prev.outputColorSpace
    }
  }, [gl])

  return (
    <Environment frames={1} resolution={resolution}>
      <Lightformer intensity={1.25} position={[2, 3.4, 4.6]} scale={[9.5, 5.2, 1]} rotation-x={-0.55} rotation-y={0.32} form="rect" color="#f1f6ff" />
      <Lightformer intensity={0.9} position={[-4.4, 1.6, 2.6]} scale={[3.3, 9.5, 1]} rotation-y={Math.PI / 4} form="rect" color="#dcecff" />
      <Lightformer intensity={0.5} position={[4.9, 0.3, 2.2]} scale={[5, 6.5, 1]} rotation-y={-Math.PI / 2} form="rect" color="#a9bde4" />
      <Lightformer intensity={0.45} position={[0, -4.2, 2.2]} scale={[9, 2.4, 1]} rotation-x={-Math.PI / 2} color="#e9f2ff" />
      <Lightformer intensity={0.4} position={[0, 4.6, 1.4]} scale={[8, 1.9, 1]} rotation-x={Math.PI / 2} color="#dde9ff" />
      <Lightformer intensity={0.6} position={[0, 2.6, -4.2]} scale={[9, 3.5, 1]} form="rect" color="#ffffff" />
    </Environment>
  )
}

export default ProductEnvironment