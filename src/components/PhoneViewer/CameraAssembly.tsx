import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import type { FocusLensId } from './PhoneConfig'
import { FINISH_PARAMS, createPhoneMaterials, type PhoneMaterialSet } from './PhoneMaterials'

/** Rear camera island center, mirrored 1:1 from PhoneModel so the three
 *  housings seat inside the raised ceramic plate that PhoneModel also renders. */
const ISLAND = { x: -0.0208, y: 0.05 }
const ISLAND_FACE_Z = -0.0028
/** World z of each lens bore mouth. LENS_Z plus the collar offset lands the
 *  mouth ring 0.0001 proud of the pad face (world z -0.00404) while the glass
 *  sits 0.0003 inboard, so the glass reads as bored into the ceramic and the
 *  ring reads as seated, never floating. */
const LENS_Z = -0.0045

/** Shared bore proportions, applied per lens radius so the three lenses read
 *  as one machined family instead of three unrelated parts. The housing body
 *  multiplier 1.34 keeps the widest bore (x -0.0065 with r 0.0076: max reach
 *  0.0065 + 0.01018 = 0.01668) inside the island plate edge (half size 0.0171,
 *  plate edge at world x -0.0379, frame inner edge at -0.0384). */
const BORE = {
  /** ceramic bushing outer radius, as a multiple of the lens radius */
  body: 1.34,
  /** radius the bushing is bored out to along the lens axis */
  inner: 1.06,
  /** machined titanium mouth ring, centered on this radius */
  collar: 0.93,
  /** signature counterstep ring outside the mouth ring */
  step: 1.0,
  /** recessed lens disc radius */
  glass: 0.78,
  /** titanium seat lip the glass rests on */
  seat: 0.76,
  /** dark inner barrel wall radius */
  wall: 0.7,
  /** reflective aperture outer radius */
  aperture: 0.62,
  /** aperture and throat inner radius */
  throat: 0.48,
}

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
   * lens elements (ring -> glass -> barrel -> throat -> sensor) receding into
   * the bore along the optical axis, perpendicular to the rear surface - the
   * film's camera macro. Undefined on product pages, where the optics stay
   * seated.
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

/** Per-element travel deeper into the bore (local +z, into the phone) at full
 *  `optics`, ordered so the collar stays at the mouth and the sensor recedes
 *  furthest - the physical read of the stack parting down the barrel, away
 *  from the film camera and into the body. */
const OPTIC_LIFT: Readonly<Record<string, number>> = {
  collar: 0.0012,
  step: 0.0012,
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

/** A teardown-honest rear camera cluster: three ceramic-bored housings seated
 *  flush in the island plate, each ringed by a machined titanium mouth with a
 *  counterstep, a recessed glass seat and a deep aperture + sensor stack. */
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
      mesh.position.z = base + g * lift
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

/** One ceramic housing bushing: a short washer bored out along the lens axis,
 *  dropped into the plate so its outboard face lands flush on the pad face
 *  (world z -0.00404) and reads as the seat the metal mouth ring is set into.
 *  Depth stays shallow so the washer never reaches the cell or front glass. */
function HousingBushing({ r, materials }: { r: number; materials: PhoneMaterialSet }) {
  const geometry = useMemo(
    () => createBushingGeometry(r * BORE.body, r * BORE.inner, 0.0015),
    [r],
  )
  return (
    <mesh geometry={geometry} position={[0, 0, 0.00053]}>
      <primitive object={materials.island} attach="material" />
    </mesh>
  )
}

/** One optic: ceramic bushing, machined titanium mouth ring with counterstep,
 *  recessed lens seat, glass, aperture and a faint deep sensor glow. Shares
 *  the lens axis (+z = into the body). */
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
  // Tele gets a deeper throat so its sensor reads as set deepest in the bore.
  const deep = id === 'tele' ? 0.0002 : 0
  const glintR = id === 'main' ? r * 0.16 : r * 0.11
  // Stack order in local z (larger is deeper into the bore): collar at the
  // mouth, then counterstep, seat lip, rim, recessed glass, barrel wall,
  // aperture, throat, sensor deepest. Neighbors hold 0.00008 to 0.0002 gaps
  // so no coplanar pair can z-fight at macro distance.
  return (
    <>
      <HousingBushing r={r} materials={materials} />
      {/* Machined titanium mouth ring, 0.0001 proud of the ceramic seat */}
      <mesh ref={register(id, 'collar')} position={[0, 0, 0.00036]}>
        <torusGeometry args={[r * BORE.collar, 0.00038, 16, 80]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Signature counterstep machined into the ring outer edge */}
      <mesh ref={register(id, 'step')} position={[0, 0, 0.00044]}>
        <torusGeometry args={[r * BORE.step, 0.0001, 12, 80]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Titanium seat lip the glass rests on */}
      <mesh ref={register(id, 'bezel')} position={[0, 0, 0.00056]}>
        <torusGeometry args={[r * BORE.seat, 0.00012, 12, 64]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Iridescent rim light just inside the glass edge */}
      <mesh ref={register(id, 'rim')} position={[0, 0, 0.00068]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[r * BORE.glass, r * BORE.collar + 0.00012, 64]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Lens glass, recessed below the mouth ring */}
      <mesh ref={register(id, 'glass')} position={[0, 0, 0.00078]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * BORE.glass, 72]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Dark inner barrel wall seen through the glass edge */}
      <mesh ref={register(id, 'barrel')} position={[0, 0, 0.00095]}>
        <torusGeometry args={[r * BORE.wall, 0.00022, 12, 64]} />
        <primitive object={materials.lensBarrel} attach="material" />
      </mesh>
      {/* Reflective aperture ring below the glass */}
      <mesh ref={register(id, 'aperture')} position={[0, 0, 0.00115]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[r * BORE.throat, r * BORE.aperture, 64]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Dark throat under the aperture */}
      <mesh ref={register(id, 'throat')} position={[0, 0, 0.00135]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * BORE.throat, 64]} />
        <primitive object={materials.lensCavity} attach="material" />
      </mesh>
      {/* Faint internal sensor reflection, deepest element in the bore,
          tele seated lower than the wide lenses */}
      <mesh ref={register(id, 'sensor')} position={[0, 0, 0.0016 + deep]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[glintR, 48]} />
        <primitive object={materials.sensorGlint} attach="material" />
      </mesh>
      {/* Focus highlight ring (driven by the shared phone rig) */}
      <mesh name="focus-ring" position={[0, 0, 0.00038]}>
        <torusGeometry args={[r * 0.83, 0.00008, 12, 80]} />
        <primitive object={materials.focusRing} attach="material" />
      </mesh>
    </>
  )
}

/** Extruded circular washer (annulus) used for each ceramic housing bushing:
 *  the bore wall the optics recede down, keeping the barrel cavity believable
 *  without a solid slab behind the plate. */
function createBushingGeometry(rOuter: number, rInner: number, depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, rInner, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.00007,
    bevelThickness: 0.00007,
    bevelSegments: 2,
    curveSegments: 40,
    steps: 1,
  })
  return geometry
}