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
  /** Exploded-parts separation (0..1), x-ray pass only. */
  explode: number
  /** Battery-only separation added at the energy climax (0..1). */
  explodeBatt: number
  /** 0..1 emphasis on the A1 Ultra die. */
  chipFocus: number
  /** 0..1 energy-story pulse. */
  energy: number
}

const ZERO: InternalsControl = { opacity: 0, explode: 0, explodeBatt: 0, chipFocus: 0, energy: 0 }

/**
 * Home positions are physically stacked: coil near the rear glass, battery +
 * cameras mid-stack, board + A1 Ultra toward the front glass. Every layer parts
 * mostly along Z with staggered timing so the separation reads as an exploded
 * assembly drawing, not a physics tumble. The board lifts last and keeps rising
 * while the camera dives for the chip.
 */
const BOARD = { x: 0.008, y: 0.05, z: 0.0002, px: 0.002, zOff: 0.024, stagger: 1.8 }
const CAM = { x: -0.023, y: 0.05, z: -0.0016, px: -0.0015, zOff: 0.017, stagger: 0.8 }
const BATT = { x: 0, y: -0.05, z: -0.0016, px: -0.001, zOff: -0.016, stagger: 1.2 }
const COIL = { x: 0, y: 0, z: -0.0021, px: 0.001, zOff: -0.012, stagger: 1.0 }
const SUB = { x: 0, y: -0.068, z: -0.001, px: 0.0015, zOff: 0.011, stagger: 1.1 }
const ANT = { x: 0, y: 0, z: -0.0018, px: 0.001, zOff: 0.005, stagger: 0.9 }
const MID = { x: 0, y: 0, z: 0, px: 0, zOff: 0.003, stagger: 1.05 }

const _v = new THREE.Vector3()

/** Shapes a shared separation scalar into a per-layer progress (0..1). */
function staged(e: number, stagger: number): number {
  return Math.pow(Math.min(1, Math.max(0, e)), stagger)
}

/**
 * The phone's internal construction: a believable layered stack roughly in
 * the order rear ceramic → coil/graphite → camera modules · main board ·
 * A1 Ultra · battery → sub-board / charging / speaker → structural rails →
 * display assembly. The driven explode offsets part the layers along the
 * device's own depth axis, staggered per layer for an engineered read.
 */
export function Internals({
  control,
  groupRef,
}: {
  control: RefObject<InternalsControl>
  groupRef?: RefObject<THREE.Group | null>
}) {
  const m = useMemo(() => createInternalsMaterials(), [])

  const root = useRef<THREE.Group>(null)
  const boardG = useRef<THREE.Group>(null)
  const battG = useRef<THREE.Group>(null)
  const camG = useRef<THREE.Group>(null)
  const coilG = useRef<THREE.Group>(null)
  const subG = useRef<THREE.Group>(null)
  const antG = useRef<THREE.Group>(null)
  const midG = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const c = control.current ?? ZERO
    const o = c.opacity
    const e = c.explode
    const batt = c.explodeBatt
    const focus = c.chipFocus
    const d = 1 - Math.exp(-delta * 6)
    const t = state.clock.elapsedTime

    // Cull the whole assembly from the transparent pass when fully hidden.
    if (root.current) root.current.visible = o > 0.002

    // While fully hidden skip the whole per-frame write block (uniform + sin
    // traffic) - the stack only animates while it is on stage.
    if (o <= 0.002) {
      GHOST_LINE.visible = false
      return
    }

    const idle = e * 0.0004
    // The energy climax breathes the cell with the charge story, not the x-ray
    // explode (which is 0 by then) - otherwise the lift reads frozen.
    const battIdle = batt * 0.0004

    const place = (
      ref: RefObject<THREE.Group | null>,
      def: typeof BOARD,
      focusPush = 0,
      idleAmp = 0,
    ) => {
      if (!ref.current) return
      const g = staged(e, def.stagger)
      _v.set(def.x + def.px * g, def.y, def.z + (def.zOff) * g + focusPush * focus)
      ref.current.position.copy(_v)
      if (idleAmp > 0 && focus < 0.5) {
        ref.current.position.y += Math.sin(t * 0.9 + idleAmp) * idle
      }
    }

    // Coil and battery are driven by the combined separation (`placeBatt`),
    // so the energy climax can lift the cell alone; the rest of the stack
    // follows the x-ray explode only.
    place(subG, SUB, 0, 3)
    place(camG, CAM, focus * 0.003, 0)
    place(boardG, BOARD, focus * 0.005, 4)
    place(antG, ANT, 0, 5)
    place(midG, MID, 0, 6)

    // The energy climax separates only the cell (battery + coil) so the 0.9
    // beat reads as the cell lifting, never as a full re-explosion.
    const eBatt = Math.min(1, batt + e)
    const placeBatt = (
      ref: RefObject<THREE.Group | null>,
      def: typeof BATT,
      idleAmp: number,
    ) => {
      if (!ref.current) return
      const g = staged(eBatt, def.stagger)
      _v.set(def.x + def.px * g, def.y, def.z + def.zOff * g)
      ref.current.position.copy(_v)
      if (idleAmp > 0 && focus < 0.5) {
        ref.current.position.y += Math.sin(t * 0.9 + idleAmp) * battIdle
      }
    }
    placeBatt(coilG, COIL, 1)
    placeBatt(battG, BATT, 2)

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

    // Ghost silhouette tracks visibility and breathes with separation + focus,
    // so it feels like an energy boundary rather than a static cage. It is
    // culled entirely once the shell is fully opaque again.
    const ghostOpacity = o * (0.2 + 0.06 * Math.sin(t * 1.6) + e * 0.14 + focus * 0.2)
    GHOST_LINE.opacity = ghostOpacity
    GHOST_LINE.visible = ghostOpacity > 0.004
  })

  return (
    <group ref={groupRef}>
      <group ref={root}>
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

        {/* Structural spine mid-frame; it barely parts so the stack never
            feels like it is coming unglued. */}
        <group ref={midG}>
          <MidframeRails m={m} />
        </group>

        {/* Connector ribbons bridging the parted board / battery gap: the
            sliver of "still wired together" that sells the exploded view. */}
        <FlexBundle m={m} />
      </group>

      {/* Silhouette containment frame */}
      <GhostShellOutline m={{ ghost: GHOST_LINE }} />
    </group>
  )
}

/** Static flex ribbons that visually bridge the parted layers. */
function FlexBundle({ m }: { m: ReturnType<typeof createInternalsMaterials> }) {
  const ribbons = [
    { x: -0.011, len: 0.03, w: 0.0022 },
    { x: 0, len: 0.034, w: 0.002 },
    { x: 0.011, len: 0.028, w: 0.0018 },
  ]
  return (
    <group>
      {ribbons.map((r) => (
        <mesh key={r.x} material={m.flex} position={[r.x, 0.012, 0.0011]}>
          <boxGeometry args={[r.w, r.len, 0.00028]} />
        </mesh>
      ))}
      {ribbons.map((r) => (
        <mesh key={r.x} material={m.gold} position={[r.x, -0.014, 0.00014]}>
          <boxGeometry args={[r.w * 0.5, 0.004, 0.0004]} />
        </mesh>
      ))}
    </group>
  )
}