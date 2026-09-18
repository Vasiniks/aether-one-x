import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import type { FocusLensId } from './PhoneConfig'
import { FINISH_PARAMS, createPhoneMaterials, type PhoneMaterialSet } from './PhoneMaterials'

/** Rear camera island geometry, mirrored 1:1 from PhoneModel so the optics
 *  seat exactly inside the three external openings on the raised plate. */
const ISLAND = { x: -0.0208, y: 0.05 }
const ISLAND_FACE_Z = -0.0028
const LENS_Z = -0.0046

/** Ceramic-clad module body seated flush on the island plate. Its rear face
 *  (world z -0.00415) reads ~0.00015 proud of the plate's outboard face
 *  (-0.0043) - integrated and seated, never buried in the chassis.
 *  World z span: -0.00415 -> -0.00125. */
const HOUSING = { w: 0.0328, h: 0.0306, z: 0.0001, depth: 0.0029 }
/** Machined flange lip on the housing's forward face. */
const FLANGE = { w: 0.0343, h: 0.0321, z: 0.00135, depth: 0.0002 }
/** Machined titanium trim band framing the seam where the module meets the
 *  island plate: a lip ~0.0003 deep, standing proud of the ceramic rear face
 *  and the plate. World z span: -0.00445 -> -0.00415. */
const TRIM = { w: 0.0344, h: 0.0322, r: 0.0028, band: 0.0008, depth: 0.0003 }
const TRIM_Z = -0.0015
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
  /**
   * Per-frame optical-drive control. When provided the assembly spreads the
   * lens elements (ring -> glass -> barrel -> throat -> sensor) outward along
   * the optical axis, perpendicular to the rear surface - the film's camera
   * macro. Undefined on product pages, where the optics stay seated.
   */
  control?: RefObject<OpticsControl | null>
}

/** Mutable camera-optics control surface, driven by the film director. */
export interface OpticsControl {
  /** 0..1 how far the optical stack has parted from the module body. */
  optics: number
  /** False while the internals own the frame (x-ray/rebuild) so the shell
   *  module's 38 meshes aren't a redundant pass over their internals twins. */
  visible?: boolean
}

/** Per-element outward travel (local -z) at full `optics`, ordered so the
 *  collar/ring lead and the deep sensor rides out last and furthest - the
 *  physical read of elements being drawn from the barrel one by one. */
const OPTIC_LIFT: Readonly<Record<string, number>> = {
  collar: 0.0012,
  bezel: 0.0022,
  rim: 0.003,
  glass: 0.0045,
  barrel: 0.006,
  aperture: 0.0072,
  throat: 0.0084,
  sensor: 0.0096,
}

/** Emissive lift as the sensor slides into the open during the explode. */
const OPTIC_SENSOR_GLOW = 1.2
/** Focus-ring flash that traces the moving glass (film material set only). */
const OPTIC_RING_TRACE = 0.5

/** A teardown-honest rear camera module: a ceramic-clad housing seated flush
 *  on the island plate with a machined titanium trim seam, three recessed lens
 *  barrels, and an internal aperture + sensor. */
export function CameraAssembly({ materials, geometry, lensRefs, control }: CameraAssemblyProps) {
  const owned = useMemo(() => (materials ? null : createPhoneMaterials(FINISH_PARAMS.obsidian)), [materials])
  const set = materials ?? owned!

  // Element registry: the optics drive spreads registered elements along their
  // seeding axis. Mirrors the internals control pattern - the director writes
  // a scalar, the geometry reads it per frame, zero React re-renders.
  const registry = useRef<Map<string, THREE.Mesh>>(new Map())
  const glaze = useRef(0)
  const root = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const controlRef = control?.current
    if (!controlRef) return
    if (root.current) root.current.visible = controlRef.visible !== false
    const optics = controlRef.optics
    const d = 1 - Math.exp(-delta * 8)
    glaze.current += (optics - glaze.current) * d
    const g = glaze.current
    for (const [key, mesh] of registry.current) {
      const lift = (mesh.userData.lift as number) ?? 0
      const base = (mesh.userData.baseZ as number) ?? 0
      mesh.position.z = base - g * lift
      if (key.endsWith(':sensor') && set.sensorGlint) {
        set.sensorGlint.emissiveIntensity = 1.4 + g * OPTIC_SENSOR_GLOW
      }
      if (key.endsWith(':glass') || key.endsWith(':rim')) {
        // The focus ring traces the moving glass so the read stays precise.
        set.focusRing.opacity = g * OPTIC_RING_TRACE
      }
    }
  })

  const register = (id: string, name: string) => (node: THREE.Mesh | null) => {
    if (node) {
      node.userData.baseZ = node.position.z
      node.userData.lift = OPTIC_LIFT[name] ?? 0
      registry.current.set(`${id}:${name}`, node)
    }
  }

  return (
    <group ref={root} position={[ISLAND.x, ISLAND.y, ISLAND_FACE_Z]}>
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
          <LensBarrel id={lens.key} r={lens.radius} materials={set} register={register} />
        </group>
      ))}
    </group>
  )
}

/** The machined module body: ceramic-clad housing, titanium trim seam, flange
 *  lip, barrel wells and fasteners. */
function CameraHousing({ materials }: { materials: PhoneMaterialSet }) {
  const trimGeometry = useMemo(
    () => createTrimRingGeometry(TRIM.w, TRIM.h, TRIM.band, TRIM.depth, TRIM.r),
    [],
  )
  return (
    <group>
      {/* Outer shell in the island ceramic family so the plate and the module
          read as one ceramic mass with the machined lens rings on its face. */}
      <RoundedBox
        args={[HOUSING.w, HOUSING.h, HOUSING.depth]}
        radius={0.0022}
        smoothness={5}
        position={[0, 0, HOUSING.z]}
      >
        <primitive object={materials.island} attach="material" />
      </RoundedBox>

      {/* Machined titanium lip at the module/plate seam - intentional joint. */}
      <mesh geometry={trimGeometry} position={[0, 0, TRIM_Z]}>
        <primitive object={materials.frame} attach="material" />
      </mesh>

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
  register,
}: {
  id: FocusLensId
  r: number
  materials: PhoneMaterialSet
  register: (id: string, name: string) => (node: THREE.Mesh | null) => void
}) {
  // Tele gets a deeper throat so its sensor reads as deeper behind the glass.
  const deep = id === 'tele' ? 0.00012 : 0
  const glintR = id === 'main' ? r * 0.16 : r * 0.11
  return (
    <>
      {/* Machined outer collar (the external ring on the plate face) */}
      <mesh ref={register(id, 'collar')}>
        <torusGeometry args={[r, 0.0007, 16, 72]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Stepped bezel */}
      <mesh ref={register(id, 'bezel')} position={[0, 0, -0.00022]}>
        <torusGeometry args={[r * 0.88, 0.0003, 12, 64]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Iridescent rim light just inside the glass edge */}
      <mesh ref={register(id, 'rim')} position={[0, 0, -0.00042]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[r * 0.82, r * 0.87, 64]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Lens glass, seated inside the collar */}
      <mesh ref={register(id, 'glass')} position={[0, 0, -0.00045]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * 0.8, 72]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Inner barrel wall seen through the glass edge */}
      <mesh ref={register(id, 'barrel')} position={[0, 0, 0.0001]}>
        <torusGeometry args={[r * 0.68, 0.00028, 12, 64]} />
        <primitive object={materials.lensBarrel} attach="material" />
      </mesh>
      {/* Reflective aperture ring below the glass */}
      <mesh ref={register(id, 'aperture')} position={[0, 0, 0.00013]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[r * 0.54, r * 0.68, 64]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Dark throat under the aperture */}
      <mesh ref={register(id, 'throat')} position={[0, 0, 0.0002 + deep]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * 0.54, 64]} />
        <primitive object={materials.lensCavity} attach="material" />
      </mesh>
      {/* Faint internal sensor reflection, deepest element */}
      <mesh ref={register(id, 'sensor')} position={[0, 0, 0.0003 + deep]} rotation={[0, Math.PI, 0]}>
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

/** Rounded-rectangle outline ring used for the titanium trim seam: outer
 *  footprint sized to the module, inner hole sized to its rear face, extruded
 *  `depth` deep so it reads as a proud machined lip. */
function createTrimRingGeometry(
  w: number,
  h: number,
  band: number,
  depth: number,
  radius: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  roundedRectPath(shape, w, h, radius)
  const hole = new THREE.Path()
  roundedRectPath(hole, w - band * 2, h - band * 2, Math.max(0.0001, radius - band))
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
    steps: 1,
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

/** Traces a centered rounded-rectangle outline with the given corner radius. */
function roundedRectPath(path: THREE.Shape | THREE.Path, w: number, h: number, r: number) {
  const rx = w / 2
  const ry = h / 2
  const c = Math.min(r, rx, ry)
  path.moveTo(-rx + c, -ry)
  path.lineTo(rx - c, -ry)
  path.quadraticCurveTo(rx, -ry, rx, -ry + c)
  path.lineTo(rx, ry - c)
  path.quadraticCurveTo(rx, ry, rx - c, ry)
  path.lineTo(-rx + c, ry)
  path.quadraticCurveTo(-rx, ry, -rx, ry - c)
  path.lineTo(-rx, -ry + c)
  path.quadraticCurveTo(-rx, -ry, -rx + c, -ry)
}