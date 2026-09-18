import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { FocusLensId } from './PhoneConfig'
import { usePhoneConfig } from './PhoneConfig'
import {
  FINISH_COLORS,
  FINISH_PARAMS,
  createPhoneMaterials,
  createScreenTexture,
  type PhoneMaterialSet,
} from './PhoneMaterials'

/** Aether One X proportions (meters). */
export const DIM = {
  w: 0.0768,
  h: 0.1596,
  t: 0.0078,
}

/** Glass panel inset from the frame edge (symmetric bezel, 1.45mm actual). */
const BEZEL = 0.00145
/** Thin dark bezel between the glass edge and the lit display (1.6mm actual). */
const DISPLAY_INSET = 0.0016

/** Rear ceramic / titanium panel across the back of the phone. */
const BACK_FACE = -DIM.t / 2
const BACK_PANEL = { depth: 0.0028, z: -0.0025 }
/** Front glass + the emissive display panel stacked inside it. */
const FRONT_GLASS = { depth: 0.0015, z: 0.003 }
const DISPLAY_PANEL = { depth: 0.0011, z: 0.00215 }

/** Raised rear camera plate. */
const ISLAND = { size: 0.036, x: -0.023, y: 0.05, depth: 0.0018 }
const ISLAND_FACE_Z = BACK_FACE - 0.00005 - ISLAND.depth
const LENS_Z = ISLAND_FACE_Z

/** Flash LED, tucked to the right of the island against the ceramic. */
const FLASH = { x: -0.005, y: 0.0665, radius: 0.0026 }

/** Half span helpers for edge details. */
const SX = DIM.w / 2
const SY = DIM.h / 2

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

/** Procedurally-built, finish-reactive phone model. Pure geometry and materials. */

interface PhoneModelProps {
  /** Optional per-instance material set (used by the film for X-ray opacity). */
  materials?: PhoneMaterialSet
}

/** A self-owned default material set with a static display texture. */
function createDefaultMaterials(): PhoneMaterialSet {
  const set = createPhoneMaterials(FINISH_PARAMS.obsidian)
  set.display.emissiveMap = createScreenTexture()
  set.display.emissiveIntensity = 1.15
  return set
}

export function PhoneModel({ materials }: PhoneModelProps) {
  const ownMaterials = useMemo(() => createDefaultMaterials(), [])
  const set = materials ?? ownMaterials

  const { finish, focusLens } = usePhoneConfig()

  // Animation state
  const smooth = useRef({
    frameColor: FINISH_COLORS.obsidian.frame.clone(),
    backColor: FINISH_COLORS.obsidian.back.clone(),
    islandColor: FINISH_COLORS.obsidian.island.clone(),
    backMetal: FINISH_PARAMS.obsidian.backMetalness,
    backRough: FINISH_PARAMS.obsidian.backRoughness,
    frameRough: FINISH_PARAMS.obsidian.frameRoughness,
    frameAniso: FINISH_PARAMS.obsidian.frameAnisotropy,
  })

  const islandGeometry = useMemo(() => createSquircleGeometry(ISLAND.size, ISLAND.size, ISLAND.depth), [])
  const lensRefs = useRef<Partial<Record<FocusLensId, THREE.Group>>>({})
  const focusRef = useRef<{ key: FocusLensId | null; blend: number }>({ key: focusLens, blend: 0 })

  useFrame((state, delta) => {
    const targetColors = FINISH_COLORS[finish]
    const targetParams = FINISH_PARAMS[finish]
    const k = 1 - Math.exp(-delta * 5.5)
    const s = smooth.current

    s.frameColor.lerp(targetColors.frame, k)
    s.backColor.lerp(targetColors.back, k)
    s.islandColor.lerp(targetColors.island, k)
    s.backMetal += (targetParams.backMetalness - s.backMetal) * k
    s.backRough += (targetParams.backRoughness - s.backRough) * k
    s.frameRough += (targetParams.frameRoughness - s.frameRough) * k
    s.frameAniso += (targetParams.frameAnisotropy - s.frameAniso) * k

    const finishSet = set
    finishSet.frame.color.copy(s.frameColor)
    finishSet.frame.roughness = s.frameRough
    finishSet.frame.anisotropy = s.frameAniso
    finishSet.back.color.copy(s.backColor)
    finishSet.back.metalness = s.backMetal
    finishSet.back.roughness = s.backRough
    finishSet.island.color.copy(s.islandColor)

    // Focus lens highlight
    const focus = focusRef.current
    if (focus.key !== focusLens) {
      focus.key = focusLens
      focus.blend = 0
    }
    focus.blend = Math.min(1, focus.blend + delta * 6)
    const t = state.clock.elapsedTime
    for (const lens of LENSES) {
      const group = lensRefs.current[lens.key]
      if (!group) continue
      const active = focus.key === lens.key
      const pulse = active ? Math.sin(t * 2.4) * 0.004 : 0
      const scale = 1 + ((active ? 1.04 : 1) - 1) * focus.blend + pulse
      group.scale.setScalar(scale)
      const ring = group.children.find((child) => child.name === 'focus-ring') as THREE.Mesh | undefined
      if (ring && finishSet.focusRing) {
        const targetOpacity = active ? 0.55 + Math.sin(t * 3) * 0.12 : 0
        finishSet.focusRing.opacity += (targetOpacity - finishSet.focusRing.opacity) * 0.12
      }
    }
  })

  return (
    <group>
      {/* Titanium frame */}
      <RoundedBox args={[DIM.w, DIM.h, DIM.t]} radius={0.0035} smoothness={10} position={[0, 0, 0]} castShadow>
        <primitive object={set.frame} attach="material" />
      </RoundedBox>

      {/* Rear ceramic / titanium panel */}
      <RoundedBox
        args={[DIM.w - BEZEL * 2, DIM.h - BEZEL * 2, BACK_PANEL.depth]}
        radius={0.0013}
        smoothness={6}
        position={[0, 0, -0.00251]}
      >
        <primitive object={set.back} attach="material" />
      </RoundedBox>

      {/* Front glass surface */}
      <RoundedBox
        args={[DIM.w - BEZEL * 2, DIM.h - BEZEL * 2, FRONT_GLASS.depth]}
        radius={0.0011}
        smoothness={6}
        position={[0, 0, FRONT_GLASS.z]}
      >
        <primitive object={set.screen} attach="material" />
      </RoundedBox>

      {/* Lit display panel, inset behind the glass for a thin dark bezel */}
      <RoundedBox
        args={[
          DIM.w - BEZEL * 2 - DISPLAY_INSET * 2,
          DIM.h - BEZEL * 2 - DISPLAY_INSET * 2,
          DISPLAY_PANEL.depth,
        ]}
        radius={0.0006}
        smoothness={4}
        position={[0, 0, DISPLAY_PANEL.z]}
      >
        <primitive object={set.display} attach="material" />
      </RoundedBox>

      {/* Rear camera system */}
      <CameraIsland materials={set} geometry={islandGeometry} lensRefs={lensRefs} />
      <FlashModule materials={set} />

      {/* Edge hardware */}
      <EdgeDetails set={set} />

      {/* Brand decal (rear) */}
      <mesh position={[0, -0.065, BACK_FACE - 0.00006]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.016, 0.004]} />
        <primitive object={set.logo} attach="material" />
      </mesh>
    </group>
  )
}

/** The raised rear camera plate plus its three physical lens assemblies. */
function CameraIsland({
  materials,
  geometry,
  lensRefs,
}: {
  materials: ReturnType<typeof createPhoneMaterials>
  geometry: THREE.BufferGeometry
  lensRefs: MutableRefObject<Partial<Record<FocusLensId, THREE.Group>>>
}) {
  return (
    <group>
      <mesh geometry={geometry} position={[ISLAND.x, ISLAND.y, ISLAND_FACE_Z]} castShadow>
        <primitive object={materials.island} attach="material" />
      </mesh>

      {LENSES.map((lens) => (
        <group
          key={lens.key}
          position={[ISLAND.x + lens.x, ISLAND.y + lens.y, LENS_Z]}
          ref={(node) => {
            if (node) lensRefs.current[lens.key] = node
          }}
        >
          <LensAssembly r={lens.radius} materials={materials} />
        </group>
      ))}
    </group>
  )
}

/**
 * One physical optic: a machined collar, stepped bezel, glass, inner barrel,
 * aperture and a faint deep sensor reflection. Everything shares the lens axis
 * (+z = into the body) so depth reads without sorting artifacts.
 */
function LensAssembly({ r, materials }: { r: number; materials: ReturnType<typeof createPhoneMaterials> }) {
  return (
    <>
      {/* Machined outer collar */}
      <mesh>
        <torusGeometry args={[r, 0.0007, 12, 56]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Stepped bezel */}
      <mesh position={[0, 0, -0.00022]}>
        <torusGeometry args={[r * 0.88, 0.0003, 8, 44]} />
        <primitive object={materials.lensRing} attach="material" />
      </mesh>
      {/* Lens glass, slightly proud */}
      <mesh position={[0, 0, -0.0003]}>
        <circleGeometry args={[r * 0.8, 44]} />
        <primitive object={materials.lensGlass} attach="material" />
      </mesh>
      {/* Inner barrel wall seen through the glass edge */}
      <mesh position={[0, 0, 0.0001]}>
        <torusGeometry args={[r * 0.68, 0.00028, 8, 40]} />
        <primitive object={materials.lensBarrel} attach="material" />
      </mesh>
      {/* Aperture */}
      <mesh position={[0, 0, 0.0002]}>
        <circleGeometry args={[r * 0.52, 36]} />
        <primitive object={materials.lensCavity} attach="material" />
      </mesh>
      {/* Deep sensor glint */}
      <mesh position={[0, 0, 0.0003]}>
        <circleGeometry args={[r * 0.14, 22]} />
        <primitive object={materials.sensorGlint} attach="material" />
      </mesh>
      {/* Focus highlight ring */}
      <mesh name="focus-ring" position={[0, 0, -0.00038]}>
        <torusGeometry args={[r * 0.94, 0.00012, 8, 52]} />
        <primitive object={materials.focusRing} attach="material" />
      </mesh>
    </>
  )
}

/** Twin-LED flash module beside the camera island. */
function FlashModule({ materials }: { materials: ReturnType<typeof createPhoneMaterials> }) {
  return (
    <group position={[FLASH.x, FLASH.y, ISLAND_FACE_Z - 0.0001]}>
      <mesh rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[FLASH.radius, 28]} />
        <primitive object={materials.flashGlass} attach="material" />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[FLASH.radius, FLASH.radius + 0.00032, 28]} />
        <primitive object={materials.flashRing} attach="material" />
      </mesh>
    </group>
  )
}

/** Small hardware that lives on the frame edges: buttons, antenna seams,
 * SIM tray, USB-C, earpiece grille and mic openings. */
function EdgeDetails({ set }: { set: ReturnType<typeof createPhoneMaterials> }) {
  return (
    <group>
      {/* Side buttons (power + rocker), each resting in a milled pocket */}
      <ButtonPocket set={set} y={0.02} height={0.0125} />
      <ButtonPocket set={set} y={0.047} height={0.006} />
      <ButtonPocket set={set} y={0.058} height={0.0055} />

      {/* Antenna separation seams (frame edge splits) */}
      <Seam set={set} x={SX + 0.0002} y={0.026} />
      <Seam set={set} x={SX + 0.0002} y={-0.024} />
      <Seam set={set} x={-SX - 0.0002} y={0.058} />
      <Seam set={set} x={-SX - 0.0002} y={-0.042} />

      {/* Left-edge SIM tray */}
      <mesh position={[-SX - 0.00018, 0.05, 0]}>
        <boxGeometry args={[0.0003, 0.0062, 0.0014]} />
        <primitive object={set.simTray} attach="material" />
      </mesh>

      {/* USB-C receptacle at the bottom center */}
      <mesh position={[0, -SY - 0.00005, 0]}>
        <boxGeometry args={[0.0048, 0.0008, 0.0017]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      <mesh position={[0, -SY - 0.00045, 0]}>
        <boxGeometry args={[0.0036, 0.0004, 0.0006]} />
        <primitive object={set.simTray} attach="material" />
      </mesh>

      {/* Earpiece slit on the front glass */}
      <mesh position={[0, 0.0744, FRONT_GLASS.z + 0.00078]}>
        <boxGeometry args={[0.0034, 0.0005, 0.00022]} />
        <primitive object={set.speaker} attach="material" />
      </mesh>

      {/* Mic openings, lower front edge */}
      {[0.0042, -0.0042].map((x) => (
        <mesh key={x} position={[x, -0.077, FRONT_GLASS.z + 0.00078]}>
          <cylinderGeometry args={[0.00038, 0.00038, 0.0002, 12]} />
          <primitive object={set.speaker} attach="material" />
        </mesh>
      ))}

      {/* Front camera + sensors, punched under the glass */}
      <mesh position={[0, 0.065, FRONT_GLASS.z + 0.00085]}>
        <cylinderGeometry args={[0.00078, 0.00078, 0.00025, 20]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      <mesh position={[0.0042, 0.065, FRONT_GLASS.z + 0.00085]}>
        <cylinderGeometry args={[0.00034, 0.00034, 0.00025, 12]} />
        <primitive object={set.port} attach="material" />
      </mesh>
    </group>
  )
}

/** A machined button stepping out of the titanium rail. */
function ButtonPocket({
  set,
  y,
  height,
}: {
  set: ReturnType<typeof createPhoneMaterials>
  y: number
  height: number
}) {
  return (
    <group position={[SX + 0.0004, y, -0.0012]}>
      {/* Milled pocket behind the button */}
      <mesh position={[0.00028, 0, 0.0006]}>
        <boxGeometry args={[0.00055, height + 0.0016, 0.0026]} />
        <primitive object={set.antenna} attach="material" />
      </mesh>
      {/* Button */}
      <mesh position={[0.00055, 0, 0.0007]}>
        <boxGeometry args={[0.0006, height, 0.0015]} />
        <primitive object={set.button} attach="material" />
      </mesh>
    </group>
  )
}

/** Thin dark split line running across a frame edge (antenna separation). */
function Seam({ set, x, y }: { set: ReturnType<typeof createPhoneMaterials>; x: number; y: number }) {
  return (
    <mesh position={[x, y, 0]}>
      <boxGeometry args={[0.00028, 0.0028, DIM.t]} />
      <primitive object={set.antenna} attach="material" />
    </mesh>
  )
}

/** Rounded-square extruded plate with soft bevels, used for the camera island. */
function createSquircleGeometry(size: number, sizeY: number, depth: number): THREE.BufferGeometry {
  const r = Math.min(0.005, size / 2, sizeY / 2)
  const x = -size / 2
  const y = -sizeY / 2
  const shape = new THREE.Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + size - r, y)
  shape.quadraticCurveTo(x + size, y, x + size, y + r)
  shape.lineTo(x + size, y + sizeY - r)
  shape.quadraticCurveTo(x + size, y + sizeY, x + size - r, y + sizeY)
  shape.lineTo(x + r, y + sizeY)
  shape.quadraticCurveTo(x, y + sizeY, x, y + sizeY - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.00055,
    bevelThickness: 0.0006,
    bevelSegments: 4,
    curveSegments: 24,
    steps: 1,
  })
  geometry.translate(0, 0, -(depth / 2 + 0.0006))
  return geometry
}