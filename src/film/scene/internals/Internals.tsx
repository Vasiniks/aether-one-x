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
  ThermalSpreader,
  WpcCoil,
} from './parts'
import { createInternalsMaterials } from './materials'
import { DIM, highlight } from '../../xray/inspect'

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
  /** 0..1 the A1 Ultra quarry lifts out of the board plane (macro). */
  chipLift: number
  /** 0..1 the battery cell pulls toward the camera at the energy climax. */
  battLift: number
  /** 0..1 the rest of the internals step back while a subject owns the frame. */
  subjectDim: number
}

const ZERO: InternalsControl = {
  opacity: 0,
  explode: 0,
  explodeBatt: 0,
  chipFocus: 0,
  energy: 0,
  chipLift: 0,
  battLift: 0,
  subjectDim: 0,
}

/** userData tags so inspect's partOf resolves every group through PartId. */
const PART_TAG: Record<'main' | 'cameras' | 'battery' | 'wpc' | 'sub' | 'frame' | 'antenna', { part: import('../../xray/inspect').PartId }> = {
  main: { part: 'main' },
  cameras: { part: 'cameras' },
  battery: { part: 'battery' },
  wpc: { part: 'wpc' },
  sub: { part: 'sub' },
  frame: { part: 'frame' },
  antenna: { part: 'antenna' },
}

const _col = new THREE.Color()

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

    // Hover-selection dim: while the inspector owns a subject, the rest of the
    // hardware steps back by DIM and the selected part gets an emissive bump.
    const hl = highlight.blend
    const hlSub = highlight.subject
    const dimK = 1 - DIM * hl * 0.6
    const hlDie = hlSub === 'die' || hlSub === 'main'
    const hlBatt = hlSub === 'battery'
    const hlCam = hlSub === 'cameras'

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

    // Battery hero: battLift pulls the cell + label up so it owns the frame.
    // Coil stays with the x-ray explode.
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

    // BattLift override: the cell rises out of the chassis and tilts slightly
    // toward the camera. Z comes from the authored hero keyframe, not the
    // x-ray explode (which is 0 by the energy climax).
    if (battG.current && c.battLift > 0.01) {
      battG.current.position.z = -0.0016 + 0.0055 * c.battLift
      battG.current.rotation.z = 0.02 * c.battLift
    }

    // ChipLift: the board (and die sitting on it) pushes toward the camera
    // at the end of the flat-on beat so the packaging reads as lifted.
    if (boardG.current && c.chipLift > 0.01) {
      boardG.current.position.z += c.chipLift * 0.0012
      boardG.current.position.y += c.chipLift * 0.0004
    }

    // Fade the whole stack together; the board + chip stay strongest while
    // the peripheral hardware (shields, battery, cameras) pulls back on focus,
    // the energy story dims everything except the cell (subjectDim), and a
    // hover selection dims everything except the inspected part (dimK).
    const boardFade = o * (hlDie ? 1 : dimK)
    const camFade = o * (1 - focus * 0.7) * (1 - c.subjectDim * 0.5) * (hlCam ? 1 : dimK)
    const battFade = o * (1 - focus * 0.65) * (hlBatt ? 1 : dimK)
    const periphFade = o * (1 - focus * 0.7) * (1 - c.subjectDim * 0.6) * dimK
    m.pcb.opacity = boardFade
    m.pcbFace.opacity = boardFade
    m.pcbTrim.opacity = boardFade
    m.compon.opacity = boardFade
    m.copper.opacity = boardFade
    m.substrate.opacity = boardFade
    m.socDie.opacity = boardFade
    m.socPad.opacity = boardFade
    m.shield.opacity = periphFade
    m.gold.opacity = periphFade
    m.flex.opacity = periphFade * 0.9
    m.batteryBody.opacity = battFade
    m.batteryCell.opacity = battFade
    m.batteryLabel.opacity = battFade
    m.housing.opacity = camFade
    m.sensor.opacity = camFade
    m.speakerMat.opacity = o * dimK
    m.antennaPlate.opacity = o * 0.85 * dimK
    m.midframe.opacity = o * 0.4 * dimK

    // The die wakes up when it becomes the subject (choreography focus + a
    // tighter bump when the inspector is on it).
    m.socDie.emissiveIntensity += (
      focus * 1.35 + (hlDie ? hl * 0.9 : 0) -
      m.socDie.emissiveIntensity
    ) * d
    m.trace.opacity += (focus * (0.5 + 0.16 * Math.sin(t * 2.2)) - m.trace.opacity) * 0.14

    // Battery energy read + the teal lift glow as the cell owns the frame.
    const glow = c.energy * (0.8 + 0.2 * Math.sin(t * 2.6)) + c.battLift * 0.55
    m.batteryLabel.emissiveIntensity += (c.energy * 0.9 - m.batteryLabel.emissiveIntensity) * d
    if (c.battLift > 0.02) {
      _col.set(0x14d8b4).multiplyScalar(0.65 + c.battLift * 0.35)
      m.batteryCell.emissive.lerp(_col, d)
      m.batteryCell.emissiveIntensity += (glow + (hlBatt ? hl * 0.3 : 0) - m.batteryCell.emissiveIntensity) * d
    } else {
      _col.set(0x0a3f36)
      m.batteryCell.emissive.lerp(_col, d)
      m.batteryCell.emissiveIntensity += (glow - m.batteryCell.emissiveIntensity) * d
    }

    // Camera sensors breathe (+ a dim-others bump when the camera module is up).
    m.sensor.emissiveIntensity = 0.7 + 0.25 * Math.sin(t * 1.1) + (hlCam ? hl * 0.4 : 0)

    // Hover on the main board gives the shields a faint lift so the board reads
    // as the selected layer, not just the PCB.
    if (hlSub === 'main' && hl > 0.01) {
      m.shield.emissiveIntensity += (hl * 0.15 - m.shield.emissiveIntensity) * d
    } else if (m.shield.emissiveIntensity > 0.01) {
      m.shield.emissiveIntensity += (0 - m.shield.emissiveIntensity) * d
    }

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
        <group ref={coilG} userData={PART_TAG.wpc}>
          <WpcCoil m={m} />
        </group>
        <group ref={camG} userData={PART_TAG.cameras}>
          <CameraModules m={m} />
        </group>
        <group ref={boardG} userData={PART_TAG.main}>
          <MainBoardAndSoC m={m} />
          {/* Graphite heat-spreader foil rides the board's back face. */}
          <ThermalSpreader m={m} />
        </group>
        <group ref={battG} userData={PART_TAG.battery}>
          <Battery m={m} />
        </group>
        <group ref={subG} userData={PART_TAG.sub}>
          <SubBoard m={m} />
        </group>
        <group ref={antG} userData={PART_TAG.antenna}>
          <AntennaPlates m={m} />
          <FrontSensors m={m} />
        </group>

        {/* Structural spine mid-frame; it barely parts so the stack never
            feels like it is coming unglued. */}
        <group ref={midG} userData={PART_TAG.frame}>
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