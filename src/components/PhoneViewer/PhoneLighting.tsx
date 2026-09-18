import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import type { RefObject } from 'react'
import { useRef } from 'react'
import type * as THREE from 'three'

export interface LightRig {
  /** Studio key light. Its intensity is driven by the scene's cinematic beats. */
  key: RefObject<THREE.DirectionalLight | null>
  fill: RefObject<THREE.DirectionalLight | null>
  back: RefObject<THREE.DirectionalLight | null>
}

/** Creates refs that a scene can use to animate the studio rig live. */
export function useLightRig(): LightRig {
  return {
    key: useRef<THREE.DirectionalLight | null>(null),
    fill: useRef<THREE.DirectionalLight | null>(null),
    back: useRef<THREE.DirectionalLight | null>(null),
  }
}

/** Studio-like local lighting rig - no remote HDRs, no bloom. Coherent env reflection. */
export function PhoneLighting({ rig }: { rig?: LightRig }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight ref={rig?.key} position={[2.5, 4, 3]} intensity={1.15} color="#fdfbff" />
      <directionalLight ref={rig?.fill} position={[-3, 1, 2.4]} intensity={0.45} color="#cfe0ff" />
      <directionalLight ref={rig?.back} position={[0, -2, 3]} intensity={0.25} color="#eef4ff" />

      {/* Local "studio" environment baked for coherent reflection across all materials. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.4} position={[0, 3.2, 5]} scale={[9, 4, 1]} rotation-x={-Math.PI / 5} form="rect" />
        <Lightformer
          intensity={0.7}
          position={[-5, 1.2, 2]}
          scale={[4, 7, 1]}
          rotation-y={Math.PI / 4}
          form="rect"
          color="#dff0ff"
        />
        <Lightformer intensity={0.55} position={[5, -0.5, 1.6]} scale={[4, 4, 1]} form="rect" color="#8fb6ff" />
        <Lightformer intensity={0.4} position={[0, -4, 2]} scale={[7, 2, 1]} rotation-x={Math.PI / 2} color="#eef4ff" />
        <Lightformer intensity={0.35} position={[0, 2, -4]} scale={[6, 3, 1]} form="rect" color="#ffffff" />
      </Environment>

      <ContactShadows position={[0, -0.085, 0]} opacity={0.5} scale={1.5} blur={2.2} far={0.3} resolution={512} frames={80} />
    </>
  )
}