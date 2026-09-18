import { RoundedBox } from '@react-three/drei'
import { useMemo, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { FocusLensId } from './PhoneConfig'
import { FINISH_PARAMS, createPhoneMaterials, type PhoneMaterialSet } from './PhoneMaterials'

/** Rear camera island geometry, mirrored 1:1 from PhoneModel so the optics
 *  seat exactly inside the three external openings on the raised plate. */
const ISLAND = { x: -0.023, y: 0.05 }
const ISLAND_FACE_Z = -0.0028
const LENS_Z = -0.0046

/** Anodized module body machined into the chassis behind the island plate.
 *  Rear face sits 0.7mm inside the plate so it never floats on top. */
const HOUSING = { w: 0.0328, h: 0.0306, z: 0.00005, depth: 0.0029 }
/** Machined flange lip on the housing's forward face. */
const FLANGE = { w: 0.0343, h: 0.0321, z: 0.00135, depth: 0.0002 }
/** Counterbored wells where the barrels seat into the housing rear. */
const WELL_Z = -0.00132
/** Fastener heads on the housing rear, revealed when the plate is removed. */
const SCREW_Z = -0.0013
const SCREWS: [number, number][] = [
  [0.0138, 0.0118],
  [-0.0138, 0.0118],
  [0.0138, -0.0118],
  [-0.0138, -0.0118],
]

interface LensSpec {
  key: FocusLensId
  x: number
  y: number
  radius: number
}

const LENSES: LensSpec[] = [
  { key: 'main', x: -0.0065, y: 0.0065, radius: 0.0076 },
  { key: 'ultra', x: 0.008, y: 0.0068, radius: 0.0061 },
  { key: 'tele', x: 0.0005, y: -0.0072, radius: 0.0061 },
]

export interface CameraAssemblyProps {
  /**
   * Shared instance material set (PhoneModel's `set`). When omitted the
   * assembly owns a default obsidian set so it renders standalone.
   */
  materials?: PhoneMaterialSet
  /** Island plate geometry; when passed, the raised plate is rendered so the
   *  assembly drops in 1:1 for PhoneModel's existing CameraIsland. */
  geometry?: THREE.BufferGeometry
  /** Optional refs so PhoneModel can focus/pulse the active barrel. */
  lensRefs?: MutableRefObject<Partial<Record<FocusLensId, THREE.Group>>>
}

/** A teardown-honest rear camera module: anodized housing seated into the
 *  chassis, three recessed lens barrels, and an internal aperture + sensor. */
export function CameraAssembly({ materials, geometry, lensRefs }: CameraAssemblyProps) {
  const owned = useMemo(() => (materials ? null : createPhoneMaterials(FINISH_PARAMS.obsidian)), [materials])
  const set = materials ?? owned!

  return (
    <group position={[ISLAND.x, ISLAND.y, ISLAND_FACE_Z]}>
      {geometry && (
        <mesh geometry={geometry} castShadow>
          <primitive object={set.island} attach="material" />
        </mesh>
      )}

      <CameraHousing materials={set} />

      {LENSES.map((lens) => (
        <group
          key={lens.key}
          position={[lens.x, lens.y, LENS_Z - ISLAND_FACE_Z]}
          ref={(node) => {
            if (node && lensRefs) lensRefs.current[lens.key] = node
          }}
        >
          <LensBarrel id={lens.key} r={lens.radius} materials={set} />
        </group>
      ))}
    </group>
  )
}

/** The machined module body: housing, flange lip, barrel wells and fasteners. */
function CameraHousing({ materials }: { materials: PhoneMaterialSet }) {
  return (
    <group>
      <RoundedBox
        args={[HOUSING.w, HOUSING.h, HOUSING.depth]}
        radius={0.0022}
        smoothness={5}
        position={[0, 0, HOUSING.z]}
      >
        <primitive object={materials.lensBarrel} attach="material" />
      </RoundedBox>

      <RoundedBox
        args={[FLANGE.w, FLANGE.h, FLANGE.depth]}
        radius={0.0026}
        smoothness={5}
        position={[0, 0, FLANGE.z]}
      >
        <primitive object={materials.lensRing} attach="material" />
      </RoundedBox>

      {LENSES.map((lens) => (
        <mesh key={lens.key} position={[lens.x, lens.y, WELL_Z]}>
          <torusGeometry args={[lens.radius * 1.05, 0.0003, 12, 56]} />
          <primitive object={materials.lensCavity} attach="material" />
        </mesh>
      ))}

      {SCREWS.map(([sx, sy]) => (
        <mesh key={`${sx}-${sy}`} position={[sx, sy, SCREW_Z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.00052, 0.00052, 0.0003, 16]} />
          <primitive object={materials.lensRing} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

/** One optic: recessed well, stepped outer ring, glass, reflective aperture
 *  and a faint deep sensor glow. Shares the lens axis (+z = into the body). */
function LensBarrel({
  id,
  r,
  materials,
}: {
  id: FocusLensId
  r: number
  materials: PhoneMaterialSet
}) {
  // Tele gets a deeper throat so its sensor reads as deeper behind the glass.
  const deep = id === 'tele' ? 0.00012 : 0
  const glintR = id === 'main' ? r * 0.16 : r * 0.11
  return (
    <>
      {/* Machined outer collar (the external ring on the plate face) */}
      <mesh>
        <torusGeometry args={[r, 0.0007, 16, 72]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Stepped bezel */}
      <mesh position={[0, 0, -0.00022]}>
        <torusGeometry args={[r * 0.88, 0.0003, 12, 64]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Lens glass, seated inside the collar */}
      <mesh position={[0, 0, -0.00045]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * 0.8, 72]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Iridescent rim light just inside the glass edge */}
      <mesh position={[0, 0, -0.00042]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[r * 0.82, r * 0.87, 64]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Inner barrel wall seen through the glass edge */}
      <mesh position={[0, 0, 0.0001]}>
        <torusGeometry args={[r * 0.68, 0.00028, 12, 64]} />
        <primitive object={materials.lensBarrel} attach="material" />
      </mesh>
      {/* Reflective aperture ring below the glass */}
      <mesh position={[0, 0, 0.00013]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[r * 0.54, r * 0.68, 64]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Dark throat under the aperture */}
      <mesh position={[0, 0, 0.0002 + deep]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * 0.54, 64]} />
        <primitive object={materials.lensCavity} attach="material" />
      </mesh>
      {/* Faint internal sensor reflection, deepest element */}
      <mesh position={[0, 0, 0.0003 + deep]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[glintR, 48]} />
        <primitive object={materials.sensorGlint} attach="material" />
      </mesh>
      {/* Focus highlight ring (driven by the shared phone rig) */}
      <mesh name="focus-ring" position={[0, 0, -0.00038]}>
        <torusGeometry args={[r * 0.94, 0.00012, 12, 72]} />
        <primitive object={materials.focusRing} attach="material" />
      </mesh>
    </>
  )
}