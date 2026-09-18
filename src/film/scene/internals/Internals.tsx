import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { GHOST_LINE } from '../materials'
import {
  AntennaPlates,
  Battery,
  CameraModules,
  FrontSensors,
  GhostShellOutline,
  MainBoardAndSoC,
  MidframeRails,
  SubBoard,
  WpcCoil,
} from './parts'
import { createInternalsMaterials } from './materials'

/** Mutable control surface written by the film director each frame. */
export interface InternalsControl {
  /** Global hardware opacity (0..1). */
  opacity: number
  /** Exploded-parts separation (0..1). */
  explode: number
  /** 0..1 emphasis on the A1 Ultra die. */
  chipFocus: number
  /** 0..1 energy-story pulse. */
  energy: number
}

const ZERO: InternalsControl = { opacity: 0, explode: 0, chipFocus: 0, energy: 0 }

/** Watch your step: these offsets keep the separation small and engineered. */
const BOARD = { base: new THREE.Vector3(0.008, 0.05, 0.0002), off: new THREE.Vector3(0.012, 0.004, 0.006) }
const CAM = { base: new THREE.Vector3(-0.023, 0.05, -0.0016), off: new THREE.Vector3(-0.01, 0.004, 0.008) }
const BATT = { base: new THREE.Vector3(0, -0.05, -0.0016), off: new THREE.Vector3(-0.006, -0.01, -0.006) }
const COIL = { base: new THREE.Vector3(0, 0, -0.0021), off: new THREE.Vector3(0.005, 0.003, -0.01) }
const SUB = { base: new THREE.Vector3(0, -0.068, -0.001), off: new THREE.Vector3(0.006, 0.006, 0.01) }
const ANT = { base: new THREE.Vector3(0, 0, -0.0018), off: new THREE.Vector3(0.003, -0.002, -0.008) }

const _v = new THREE.Vector3()

/**
 * The phone's internal construction: a believable layered stack roughly in
 * the order rear ceramic → coil/graphite → camera modules · main board ·
 * A1 Ultra · battery → sub-board / charging / speaker → structural rails →
 * display assembly. The driven explode offsets part the layers just enough to
 * read as an inspection, never a collapse.
 */
export function Internals({
  control,
  groupRef,
}: {
  control: RefObject<InternalsControl>
  groupRef?: RefObject<THREE.Group | null>
}) {
  const m = useMemo(() => createInternalsMaterials(), [])

  const boardG = useRef<THREE.Group>(null)
  const battG = useRef<THREE.Group>(null)
  const camG = useRef<THREE.Group>(null)
  const coilG = useRef<THREE.Group>(null)
  const subG = useRef<THREE.Group>(null)
  const antG = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const c = control.current ?? ZERO
    const o = c.opacity
    const e = c.explode
    const focus = c.chipFocus
    const d = 1 - Math.exp(-delta * 6)
    const t = state.clock.elapsedTime
    const idle = e * 0.0004

    if (boardG.current) {
      _v.copy(BOARD.base).addScaledVector(BOARD.off, e)
      boardG.current.position.copy(_v)
      boardG.current.position.y += Math.sin(t * 0.9) * idle
    }
    if (battG.current) {
      _v.copy(BATT.base).addScaledVector(BATT.off, e)
      battG.current.position.copy(_v)
      battG.current.position.y += Math.cos(t * 0.8) * idle
    }
    if (camG.current) {
      _v.copy(CAM.base).addScaledVector(CAM.off, e)
      camG.current.position.copy(_v)
    }
    if (coilG.current) {
      _v.copy(COIL.base).addScaledVector(COIL.off, e)
      coilG.current.position.copy(_v)
    }
    if (subG.current) {
      _v.copy(SUB.base).addScaledVector(SUB.off, e)
      subG.current.position.copy(_v)
    }
    if (antG.current) {
      _v.copy(ANT.base).addScaledVector(ANT.off, e)
      antG.current.position.copy(_v)
    }

    // Fade the whole stack together; the board + chip stay strongest while
    // the peripheral hardware (shields, battery, cameras) pulls back on focus.
    const boardFade = o
    const extFade = o * (1 - focus * 0.7)
    m.pcb.opacity = boardFade
    m.pcbFace.opacity = boardFade
    m.pcbTrim.opacity = boardFade
    m.compon.opacity = boardFade
    m.copper.opacity = boardFade
    m.substrate.opacity = boardFade
    m.socDie.opacity = boardFade
    m.socPad.opacity = boardFade
    m.shield.opacity = extFade
    m.gold.opacity = extFade
    m.flex.opacity = extFade * 0.9
    m.batteryBody.opacity = extFade
    m.batteryCell.opacity = extFade
    m.batteryLabel.opacity = extFade
    m.housing.opacity = extFade
    m.sensor.opacity = extFade
    m.speakerMat.opacity = o
    m.antennaPlate.opacity = o * 0.85
    m.midframe.opacity = o * 0.4

    // The die wakes up when it becomes the subject.
    m.socDie.emissiveIntensity += (focus * 1.35 - m.socDie.emissiveIntensity) * d
    m.trace.opacity += (focus * (0.5 + 0.16 * Math.sin(t * 2.2)) - m.trace.opacity) * 0.14

    // Battery energy read.
    const glow = c.energy * (0.8 + 0.2 * Math.sin(t * 2.6))
    m.batteryCell.emissiveIntensity += (glow - m.batteryCell.emissiveIntensity) * d
    m.batteryLabel.emissiveIntensity += (c.energy * 0.9 - m.batteryLabel.emissiveIntensity) * d

    // Camera sensors breathe.
    m.sensor.emissiveIntensity = 0.7 + 0.25 * Math.sin(t * 1.1)

    // Ghost silhouette always follows the internals' visibility.
    GHOST_LINE.opacity = o * (0.2 + 0.06 * Math.sin(t * 1.6))
  })

  return (
    <group ref={groupRef}>
      <group ref={coilG}>
        <WpcCoil m={m} />
      </group>
      <group ref={camG}>
        <CameraModules m={m} />
      </group>
      <group ref={boardG}>
        <MainBoardAndSoC m={m} />
      </group>
      <group ref={battG}>
        <Battery m={m} />
      </group>
      <group ref={subG}>
        <SubBoard m={m} />
      </group>
      <group ref={antG}>
        <AntennaPlates m={m} />
        <FrontSensors m={m} />
      </group>

      {/* Structural rebar in front of the internals */}
      <MidframeRails m={m} />

      {/* Silhouette containment frame */}
      <GhostShellOutline m={{ ghost: GHOST_LINE }} />
    </group>
  )
}