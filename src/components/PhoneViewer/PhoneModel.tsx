import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import { CameraAssembly, type OpticsControl } from './CameraAssembly'
import { usePhoneConfig, type FocusLensId } from './PhoneConfig'
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

/**
 * Front frame split: a solid rear body (machined cavity) plus a perimeter
 * bezel ring with a display opening, so the front glass / display are never
 * buried behind an opaque slab face.
 */
const FRAME_BODY_DEPTH = 0.0042
const RING_BASE_Z = 0.0004
const RING_DEPTH = 0.0035

/** Raised rear camera plate, seated so it reads ~1mm proud of the ceramic,
 *  and kept fully inside the body silhouette (frame edge at x = -0.0384). */
const ISLAND = { size: 0.035, x: -0.0208, y: 0.05, depth: 0.0018 }
const ISLAND_FACE_Z = -0.0028

/** Flash LED, tucked to the right of the island against the ceramic. */
const FLASH = { x: -0.004, y: 0.0665, radius: 0.0026 }

/** Stepped titanium plinth the camera island rises from: roots the plate into
 * the ceramic so it reads as seats, never a floating puck. */
const ISLAND_SEAT = { size: 0.041, depth: 0.0012 }
const ISLAND_SEAT_Z = -0.0025

/** Bottom-edge hardware: chamfered USB-C surround, eject pinhole, grille. */
const PORT_COLLAR = { w: 0.0064, h: 0.0026, r: 0.0013, depth: 0.0005 }
const GRILLE_SLOT = { w: 0.00055, h: 0.0003, depth: 0.0012 }
const GRILLE_XS = [0.0076, 0.0091, 0.0106, 0.0121]

/** Half span helpers for edge details. */
const SX = DIM.w / 2
const SY = DIM.h / 2

/** Procedurally-built, finish-reactive phone model. Pure geometry and materials. */

interface PhoneModelProps {
  /** Optional per-instance material set (used by the film for X-ray opacity). */
  materials?: PhoneMaterialSet
  /**
   * Optional shell sub-groups (frame / back / glass) so a director can part the
   * layers for an exploded view. Defaults to unused refs: zero behavior change.
   */
  groups?: Partial<Record<'frame' | 'back' | 'glass', MutableRefObject<THREE.Group | null>>>
  /**
   * Animated focus ring on the active lens. Defaults true; the film drives the
   * material set directly (x-ray dissolve) and passes false so no per-frame
   * writer fights the director's opacity gate.
   */
  animateFocusRing?: boolean
  /**
   * Optional camera-optics drive (film macro). Forwarded to CameraAssembly;
   * product pages omit it so the optics stay seated.
   */
  opticsControl?: RefObject<OpticsControl | null>
}

/** A self-owned default material set with a static display texture. */
function createDefaultMaterials(): PhoneMaterialSet {
  const set = createPhoneMaterials(FINISH_PARAMS.obsidian)
  set.display.emissiveMap = createScreenTexture()
  set.display.emissiveIntensity = 1.15
  return set
}

export function PhoneModel({ materials, groups, animateFocusRing = true, opticsControl }: PhoneModelProps) {
  // Only mint the default material set + static textures when this instance
  // actually owns its look (the film passes a shared, pre-built set).
  const ownMaterials = useMemo(() => (materials ? null : createDefaultMaterials()), [materials])
  const set = materials ?? ownMaterials!

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
  const islandSeatGeometry = useMemo(
    () => createSquircleGeometry(ISLAND_SEAT.size, ISLAND_SEAT.size, ISLAND_SEAT.depth),
    [],
  )
  const frameBodyGeometry = useMemo(() => createFrameBodyGeometry(), [])
  const frameRingGeometry = useMemo(() => createFrameRingGeometry(), [])
const lensRefs = useRef<Partial<Record<FocusLensId, THREE.Group>>>({})
const focusRef = useRef<{ key: FocusLensId | null; blend: number }>({ key: focusLens, blend: 0 })
/** Order groups are iterated for the active focus ring; the lens groups live
 * inside CameraAssembly and publish themselves through lensRefs. */
const LENSES: { key: FocusLensId }[] = [{ key: 'main' }, { key: 'ultra' }, { key: 'tele' }]

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
      if (ring && finishSet.focusRing && animateFocusRing) {
        const targetOpacity = active ? 0.55 + Math.sin(t * 3) * 0.12 : 0
        finishSet.focusRing.opacity += (targetOpacity - finishSet.focusRing.opacity) * 0.12
      }
    }
  })

  return (
    <group>
      {/* Titanium frame + machined edge hardware */}
      <group ref={groups?.frame}>
        {/* Solid rear+midsection body: a chamfered titanium spine the display
            cavity sits in. Beveled front/rear rims make the side rails catch
            light like machined metal and step crisply into the ceramic. */}
        <mesh geometry={frameBodyGeometry} castShadow>
          <primitive object={set.frame} attach="material" />
        </mesh>
        {/* Perimeter bezel ring with a display opening. Segment-tight so the
            rounded corners match the body silhouette from every angle. */}
        <mesh geometry={frameRingGeometry} castShadow>
          <primitive object={set.frame} attach="material" />
        </mesh>

        {/* Edge hardware */}
        <EdgeDetails set={set} />
      </group>

      {/* Rear ceramic panel + camera island + flash + brand mark */}
      <group ref={groups?.back}>
        <RoundedBox
          args={[DIM.w - BEZEL * 2, DIM.h - BEZEL * 2, BACK_PANEL.depth]}
          radius={0.0013}
          smoothness={6}
          position={[0, 0, -0.00251]}
        >
          <primitive object={set.back} attach="material" />
        </RoundedBox>

        {/* Stepped titanium plinth: the island's machined seat against the ceramic,
            rendered under the island so the two read as one assembly. */}
        <mesh geometry={islandSeatGeometry} position={[ISLAND.x, ISLAND.y, ISLAND_SEAT_Z]} castShadow>
          <primitive object={set.frame} attach="material" />
        </mesh>

        {/* Rear camera system */}
        <CameraAssembly
          materials={set}
          geometry={islandGeometry}
          lensRefs={lensRefs}
          control={opticsControl}
        />
        <FlashModule materials={set} />

        {/* Brand decal (rear) */}
        <mesh position={[0, -0.065, BACK_FACE - 0.00006]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.016, 0.004]} />
          <primitive object={set.logo} attach="material" />
        </mesh>
      </group>

      {/* Front glass stack + display panel + under-glass sensors */}
      <group ref={groups?.glass}>
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

        <FrontGlassDetails set={set} />
      </group>
    </group>
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
  const portCollarGeo = useMemo(
    () => createRoundedRectGeometry(PORT_COLLAR.w, PORT_COLLAR.h, PORT_COLLAR.r, PORT_COLLAR.depth, 0.00015, 0.00013),
    [],
  )
  return (
    <group>
      {/* Side buttons (power + rocker), each resting in a milled pocket on a
          chamfered titanium seat */}
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

      {/* Bottom edge: chamfered metal collar around a recessed USB-C opening,
          a SIM eject pinhole and a 4-slot speaker grille */}
      <mesh geometry={portCollarGeo} position={[0, -SY - 0.0002, 0]}>
        <primitive object={set.simTray} attach="material" />
      </mesh>
      <mesh position={[0, -SY - 0.00012, 0]}>
        <boxGeometry args={[0.0048, 0.0008, 0.0017]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      <mesh position={[0.0051, -SY + 0.0002, 0.0016]}>
        <cylinderGeometry args={[0.0004, 0.0004, 0.00034, 12]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      {GRILLE_XS.map((x) => (
        <mesh key={x} position={[x, -SY + 0.0003, 0]}>
          <boxGeometry args={[GRILLE_SLOT.w, GRILLE_SLOT.h, GRILLE_SLOT.depth]} />
          <primitive object={set.speaker} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

/** Hardware that lives on the front glass: earpiece, mic ports, selfie optics. */
function FrontGlassDetails({ set }: { set: ReturnType<typeof createPhoneMaterials> }) {
  return (
    <group>
      {/* Earpiece slit on the front glass */}
      <mesh position={[0, 0.0744, FRONT_GLASS.z + 0.00078]}>
        <boxGeometry args={[0.0034, 0.0005, 0.00022]} />
        <primitive object={set.speaker} attach="material" />
      </mesh>

      {/* Mic openings, lower front edge */}
      {[0.0042, -0.0042].map((x) => (
        <mesh key={x} position={[x, -0.077, FRONT_GLASS.z + 0.00078]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.00038, 0.00038, 0.0002, 12]} />
          <primitive object={set.speaker} attach="material" />
        </mesh>
      ))}

      {/* Front camera + sensors, punched under the glass. The wells are
          aligned to the glass plane normal so they read as drill holes,
          not pills standing on end. */}
      <mesh position={[0, 0.065, FRONT_GLASS.z + 0.00085]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.00078, 0.00078, 0.00025, 20]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      <mesh position={[0.0042, 0.065, FRONT_GLASS.z + 0.00085]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.00034, 0.00034, 0.00025, 12]} />
        <primitive object={set.port} attach="material" />
      </mesh>
    </group>
  )
}

/** A machined button keycap stepping out of the titanium rail: dark milled
 * bed, a chamfered seating flange fused to the rail, then the rounded cap. */
function ButtonPocket({
  set,
  y,
  height,
}: {
  set: ReturnType<typeof createPhoneMaterials>
  y: number
  height: number
}) {
  const flangeGeo = useMemo(
    () => createRoundedRectGeometry(0.0005, height + 0.002, 0.0004, 0.0017, 0.00012, 0.00012),
    [height],
  )
  return (
    <group position={[SX + 0.0004, y, -0.0012]}>
      {/* Milled pocket behind the button */}
      <mesh position={[0, 0, 0.0006]}>
        <boxGeometry args={[0.0007, height + 0.0016, 0.0028]} />
        <primitive object={set.antenna} attach="material" />
      </mesh>
      {/* Chamfered titanium seating flange fused into the rail face */}
      <mesh geometry={flangeGeo} position={[0.00035, 0, 0.0006]}>
        <primitive object={set.frame} attach="material" />
      </mesh>
      {/* Rounded machined keycap, proud of the seat */}
      <RoundedBox
        args={[0.0005, height, 0.0014]}
        radius={Math.min(0.00022, height / 2)}
        smoothness={4}
        position={[0.0007, 0, 0.0006]}
      >
        <primitive object={set.button} attach="material" />
      </RoundedBox>
    </group>
  )
}

/** Thin dark split line running across a frame edge (antenna separation). */
function Seam({ set, x, y }: { set: ReturnType<typeof createPhoneMaterials>; x: number; y: number }) {
  return (
    <mesh position={[x, y, 0]}>
      <boxGeometry args={[0.00026, 0.003, DIM.t]} />
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

/**
 * Perimeter bezel ring: an extruded rounded-rect outline with a rectangular
 * opening cut for the front glass. Replaces the old solid frame slab so the
 * front of the phone reads as titanium bezel around a display, not a flat
 * metal plate.
 */
function createFrameRingGeometry(): THREE.BufferGeometry {
  const outer = new THREE.Shape()
  roundedRectPath(outer, -DIM.w / 2, -DIM.h / 2, DIM.w, DIM.h, 0.0042)
  // The inner cutout reaches the glass edge (with a hairline of overhang) so
  // no open slot forms between the bezel and the display; the ring bevels
  // into the front face instead.
  const inner = new THREE.Path()
  roundedRectPath(inner, -DIM.w / 2 + BEZEL * 0.95, -DIM.h / 2 + BEZEL * 0.95, DIM.w - BEZEL * 1.9, DIM.h - BEZEL * 1.9, 0.0012)
  outer.holes.push(inner)
  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth: RING_DEPTH,
    bevelEnabled: true,
    bevelSize: 0.00016,
    bevelThickness: 0.00013,
    bevelSegments: 3,
    curveSegments: 20,
    steps: 1,
  })
  geometry.translate(0, 0, RING_BASE_Z)
  return geometry
}

/** Traces a rounded-rectangle outline with the given corner radius. */
function roundedRectPath(
  path: THREE.Shape | THREE.Path,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const c = Math.min(r, w / 2, h / 2)
  path.moveTo(x + c, y)
  path.lineTo(x + w - c, y)
  path.quadraticCurveTo(x + w, y, x + w, y + c)
  path.lineTo(x + w, y + h - c)
  path.quadraticCurveTo(x + w, y + h, x + w - c, y + h)
  path.lineTo(x + c, y + h)
  path.quadraticCurveTo(x, y + h, x, y + h - c)
  path.lineTo(x, y + c)
  path.quadraticCurveTo(x, y, x + c, y)
}

/**
 * Chamfered solid frame body: the extruded rounded-rect spine with beveled
 * front/rear rims. The outer silhouette lands exactly on DIM, the rear rim
 * sits flush with the ceramic back face, and each rail reads as a flat
 * machined plane between two crisp chamfer steps.
 */
function createFrameBodyGeometry(): THREE.BufferGeometry {
  const bevelSize = 0.0007
  const shape = new THREE.Shape()
  roundedRectPath(
    shape,
    -DIM.w / 2 + bevelSize,
    -DIM.h / 2 + bevelSize,
    DIM.w - bevelSize * 2,
    DIM.h - bevelSize * 2,
    0.0035,
  )
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: FRAME_BODY_DEPTH - bevelSize * 2,
    bevelEnabled: true,
    bevelSize,
    bevelThickness: 0.0005,
    bevelSegments: 3,
    curveSegments: 20,
    steps: 1,
  })
  // Rear rim flush on the ceramic back face; the front rim meets the bezel.
  geometry.translate(0, 0, BACK_FACE + 0.0005)
  return geometry
}

/** Centered rounded-rectangle extrusion with optional chamfered end lips. */
function createRoundedRectGeometry(
  w: number,
  h: number,
  radius: number,
  depth: number,
  bevelSize = 0,
  bevelThickness = 0,
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  roundedRectPath(shape, -w / 2, -h / 2, w, h, radius)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevelSize > 0,
    bevelSize,
    bevelThickness,
    bevelSegments: 2,
    curveSegments: 16,
    steps: 1,
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}