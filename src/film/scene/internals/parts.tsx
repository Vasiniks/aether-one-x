import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { InternalsMaterials } from './materials'

/**
 * Presentation geometry for each internal assembly. Every part is authored in
 * its own local frame; the assembly (Internals.tsx) positions the groups and
 * drives the explode / focus animation.
 */



const AXIS_Z: [number, number, number] = [Math.PI / 2, 0, 0]

/** Main board: PCB with visible layer edges, trace face, shields embossed,
 * discrete components (caps / crystals / cans / RAM stacks), connector
 * sockets and the Aether A1 Ultra package on top. */
export function MainBoardAndSoC({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox args={[0.043, 0.056, 0.0018]} radius={0.0007} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.pcb} attach="material" />
      </RoundedBox>

      {/* Trace face */}
      <mesh userData={{ part: 'main' }} position={[0, 0, 0.001]}>
        <boxGeometry args={[0.043, 0.056, 0.0003]} />
        <primitive object={m.pcbFace} attach="material" />
      </mesh>

      {/* True PCB edge: stacked FR4 / copper layup visible along all four
          sides once the board lifts. */}
      <PcbLayerEdge m={m} />

      {/* Edge copper trim */}
      <mesh position={[0, 0.029, 0.001]}>
        <boxGeometry args={[0.043, 0.0005, 0.0005]} />
        <primitive object={m.pcbTrim} attach="material" />
      </mesh>
      <mesh position={[0, -0.029, 0.001]}>
        <boxGeometry args={[0.043, 0.0005, 0.0005]} />
        <primitive object={m.pcbTrim} attach="material" />
      </mesh>

      {/* Discrete components around the SoC */}
      <Components m={m} />

      {/* Embossed shield cans */}
      <Shield m={m} x={-0.012} y={0.016} w={0.013} d={0.013} h={0.0011} />
      <Shield m={m} x={0.012} y={0.011} w={0.012} d={0.009} h={0.0011} />
      <Shield m={m} x={-0.012} y={-0.014} w={0.011} d={0.008} h={0.001} />

      {/* Gold connector row to the sub-board */}
      {[-0.012, -0.004, 0.004, 0.012].map((x) => (
        <mesh key={x} material={m.gold} position={[x, -0.0305, 0.0006]}>
          <boxGeometry args={[0.0022, 0.0028, 0.001]} />
        </mesh>
      ))}

      {/* Board-to-board sockets wired to the battery / sub-board */}
      <BoardConnector m={m} x={0} y={-0.027} w={0.007} pitch={0.0012} pins={5} />
      <BoardConnector m={m} x={0.013} y={0.018} w={0.0054} pitch={0.0012} pins={4} />

      {/* NFC corner patches */}
      <mesh material={m.copper} position={[-0.0195, 0.023, 0.0013]}>
        <boxGeometry args={[0.0034, 0.006, 0.00025]} />
      </mesh>
      <mesh material={m.copper} position={[0.0195, -0.02, 0.0013]}>
        <boxGeometry args={[0.0034, 0.006, 0.00025]} />
      </mesh>

      <SoCPackage m={m} />
    </group>
  )
}

/** Stacked FR4 / copper bands hugging the board silhouette — the exposed
 * layer count reads as real 14-layer hardware on the lift. */
function PcbLayerEdge({ m }: { m: InternalsMaterials }) {
  const W = 0.043
  const H = 0.056
  const bands: { p: [number, number]; a: [number, number] }[] = [
    { p: [W / 2 + 0.00016, 0], a: [0.00032, H] },
    { p: [-W / 2 - 0.00016, 0], a: [0.00032, H] },
    { p: [0, H / 2 + 0.00016], a: [W, 0.00032] },
    { p: [0, -H / 2 - 0.00016], a: [W, 0.00032] },
  ]
  return (
    <>
      {bands.map((b, i) => (
        <group key={i} position={[b.p[0], b.p[1], 0]}>
          <mesh material={m.pcb} position={[0, 0, -0.00058]}>
            <boxGeometry args={[b.a[0], b.a[1], 0.00058]} />
          </mesh>
          <mesh material={m.copper}>
            <boxGeometry args={[b.a[0], b.a[1], 0.00014]} />
          </mesh>
          <mesh material={m.pcb} position={[0, 0, 0.00058]}>
            <boxGeometry args={[b.a[0], b.a[1], 0.00058]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** Slotted board-to-board connector: plastic housing, raised latch walls and
 * gold contacts. */
function BoardConnector({
  m,
  x,
  y,
  w,
  pitch,
  pins,
}: {
  m: InternalsMaterials
  x: number
  y: number
  w: number
  pitch: number
  pins: number
}) {
  const half = (pins - 1) / 2
  return (
    <group position={[x, y, 0.0004]}>
      <RoundedBox args={[w, 0.003, 0.00085]} radius={0.0002} smoothness={2}>
        <primitive object={m.housing} attach="material" />
      </RoundedBox>
      {/* Recessed slot base */}
      <mesh material={m.pcbTrim} position={[0, 0, 0.00012]}>
        <boxGeometry args={[w - 0.0008, 0.0016, 0.00044]} />
      </mesh>
      {/* Latch walls */}
      <mesh material={m.housing} position={[0, 0.00175, 0.00018]}>
        <boxGeometry args={[w - 0.0006, 0.00045, 0.001]} />
      </mesh>
      <mesh material={m.housing} position={[0, -0.00175, 0.00005]}>
        <boxGeometry args={[w - 0.0006, 0.00045, 0.0007]} />
      </mesh>
      {/* Gold finger contacts in the slot */}
      {Array.from({ length: pins }, (_, i) => i - half).map((k) => (
        <mesh key={k} material={m.gold} position={[k * pitch, 0.0004, 0.00048]}>
          <boxGeometry args={[0.0004, 0.0013, 0.00036]} />
        </mesh>
      ))}
    </group>
  )
}

/** Stamped shield can with a raised rim, embossed boss, cross brace and corner
 * screw bosses. */
function Shield({
  m,
  x,
  y,
  w,
  d,
  h,
}: {
  m: InternalsMaterials
  x: number
  y: number
  w: number
  d: number
  h: number
}) {
  const top = h / 2
  return (
    <group position={[x, y, 0.0004 + h / 2 + 0.0006]}>
      <mesh material={m.shield}>
        <boxGeometry args={[w, d, h]} />
      </mesh>
      {/* Raised rim frame */}
      <mesh material={m.shield} position={[0, 0, top + 0.00012]}>
        <boxGeometry args={[w + 0.0005, d + 0.0005, 0.00024]} />
      </mesh>
      {/* Embossed centre boss */}
      <mesh material={m.shield} position={[0, 0, top + 0.00036]}>
        <boxGeometry args={[w * 0.34, d * 0.34, 0.0001]} />
      </mesh>
      {/* Stamped cross brace */}
      <mesh material={m.shield} position={[0, 0, top + 0.00032]}>
        <boxGeometry args={[w * 0.8, 0.00018, 0.00008]} />
      </mesh>
      <mesh material={m.shield} position={[0, 0, top + 0.00032]}>
        <boxGeometry args={[0.00018, d * 0.8, 0.00008]} />
      </mesh>
      {/* Corner screw bosses */}
      {[
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ].map(([sx, sy]) => (
        <mesh key={`${sx}${sy}`} material={m.pcbTrim} position={[sx * (w / 2 - 0.0009), sy * (d / 2 - 0.0009), top + 0.00028]} rotation={AXIS_Z}>
          <cylinderGeometry args={[0.00032, 0.00032, 0.00014, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/** Aether A1 Ultra: organic substrate with laminate step, a BGA ball grid,
 * exposed die with a bevel ledge, engraved gold reticle / fiducials, and the
 * additive focus ring that brightens on approach. Holds up in the flat-on
 * chip shot. */
export function SoCPackage({ m }: { m: InternalsMaterials }) {
  const BGA = 7
  const half = (BGA - 1) / 2
  const balls: [number, number][] = []
  for (let i = -half; i <= half; i++) {
    for (let j = -half; j <= half; j++) {
      if (!(Math.abs(i) === half && Math.abs(j) === half)) balls.push([i, j])
    }
  }
  return (
    <group position={[0.003, 0.002, 0.001]}>
      <RoundedBox userData={{ part: 'die' }} args={[0.011, 0.011, 0.0011]} radius={0.0006} smoothness={2} position={[0, 0, 0]}>
        <primitive object={m.substrate} attach="material" />
      </RoundedBox>

      {/* Laminate top step — package edge lip */}
      <RoundedBox args={[0.01015, 0.01015, 0.0001]} radius={0.0004} smoothness={2} position={[0, 0, 0.00056]}>
        <primitive object={m.substrate} attach="material" />
      </RoundedBox>

      {/* BGA ball grid under the substrate */}
      {balls.map(([i, j]) => (
        <mesh key={`${i}:${j}`} material={m.socPad} position={[i * 0.00145, j * 0.00145, -0.00068]}>
          <sphereGeometry args={[0.00026, 10, 8]} />
        </mesh>
      ))}

      {/* Exposed die: bevel ledge under a raised mirror face */}
      <mesh material={m.socDie} position={[0, 0, 0.00078]} userData={{ part: 'die' }}>
        <boxGeometry args={[0.0085, 0.0085, 0.00012]} />
      </mesh>
      <mesh material={m.socDie} position={[0, 0, 0.00095]} userData={{ part: 'die' }}>
        <boxGeometry args={[0.0082, 0.0082, 0.00042]} />
      </mesh>

      {/* Engraved reticle cross + corner fiducials (vertex detail) */}
      <mesh material={m.socPad} position={[0, 0, 0.00118]} userData={{ part: 'die' }}>
        <boxGeometry args={[0.0013, 0.00012, 0.00004]} />
      </mesh>
      <mesh material={m.socPad} position={[0, 0, 0.00118]} userData={{ part: 'die' }}>
        <boxGeometry args={[0.00012, 0.0013, 0.00004]} />
      </mesh>
      {[
        [-0.0035, -0.0035],
        [0.0035, -0.0035],
        [-0.0035, 0.0035],
        [0.0035, 0.0035],
      ].map(([x, y]) => (
        <mesh key={`${x}${y}`} material={m.socPad} position={[x, y, 0.00118]} userData={{ part: 'die' }}>
          <boxGeometry args={[0.00022, 0.00022, 0.00004]} />
        </mesh>
      ))}

      {/* Peripheral capsules */}
      {[
        [-0.0048, -0.0048],
        [0.0048, -0.0044],
        [-0.0042, 0.0048],
        [0.005, 0.0042],
      ].map(([x, y], i) => (
        <mesh key={`${x}-${y}`} material={i % 2 ? m.socPad : m.shield} position={[x, y, 0.00045]}>
          <boxGeometry args={[0.0016, 0.0016, 0.0007]} />
        </mesh>
      ))}
      {[-0.0038, 0, 0.0038].map((x) => (
        <mesh key={x} material={m.socPad} position={[x, -0.0064, 0.0003]}>
          <boxGeometry args={[0.0018, 0.0012, 0.0007]} />
        </mesh>
      ))}
      <mesh material={m.trace} position={[0, -0.002, 0.0013]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.0064, 0.0086, 48]} />
      </mesh>
    </group>
  )
}

type Comp =
  | { t: 'chip'; x: number; y: number; w: number; d: number; h: number }
  | { t: 'cap'; x: number; y: number; r: number; h: number }
  | { t: 'can'; x: number; y: number; r: number; h: number }
  | { t: 'crystal'; x: number; y: number; w: number; d: number; h: number }
  | { t: 'ram'; x: number; y: number; w: number; d: number; h: number }

const COMPONENTS: Comp[] = [
  { t: 'chip', x: -0.016, y: 0.02, w: 0.003, d: 0.005, h: 0.0006 },
  { t: 'chip', x: -0.019, y: 0.006, w: 0.0024, d: 0.002, h: 0.0005 },
  { t: 'chip', x: -0.015, y: -0.003, w: 0.002, d: 0.005, h: 0.0009 },
  { t: 'chip', x: -0.019, y: -0.017, w: 0.0026, d: 0.004, h: 0.0006 },
  { t: 'chip', x: -0.012, y: -0.025, w: 0.0036, d: 0.003, h: 0.0008 },
  { t: 'chip', x: 0.013, y: 0.021, w: 0.005, d: 0.003, h: 0.0006 },
  { t: 'chip', x: 0.018, y: 0.004, w: 0.0024, d: 0.0024, h: 0.0009 },
  { t: 'chip', x: 0.016, y: -0.009, w: 0.003, d: 0.005, h: 0.0007 },
  { t: 'chip', x: 0.018, y: -0.021, w: 0.0026, d: 0.004, h: 0.0006 },
  { t: 'chip', x: 0.008, y: -0.026, w: 0.004, d: 0.003, h: 0.0009 },
  { t: 'chip', x: -0.004, y: 0.022, w: 0.004, d: 0.0024, h: 0.0005 },
  { t: 'chip', x: 0.004, y: -0.013, w: 0.002, d: 0.0034, h: 0.0006 },
  { t: 'chip', x: -0.006, y: 0.009, w: 0.0022, d: 0.0022, h: 0.0004 },
  // Cylindrical / tall parts for a denser, more engineered read
  { t: 'cap', x: -0.008, y: 0.02, r: 0.0015, h: 0.0007 },
  { t: 'cap', x: 0.008, y: -0.022, r: 0.0013, h: 0.0006 },
  { t: 'cap', x: -0.008, y: -0.009, r: 0.0011, h: 0.0005 },
  { t: 'can', x: 0.018, y: -0.015, r: 0.0017, h: 0.0011 },
  { t: 'crystal', x: -0.019, y: 0.013, w: 0.0018, d: 0.0011, h: 0.00055 },
  { t: 'ram', x: 0.0105, y: 0.0005, w: 0.0052, d: 0.0032, h: 0.0006 },
  { t: 'ram', x: -0.0095, y: 0.001, w: 0.0042, d: 0.0028, h: 0.0005 },
  { t: 'chip', x: 0.006, y: -0.024, w: 0.003, d: 0.002, h: 0.0005 },
]

function Components({ m }: { m: InternalsMaterials }) {
  return (
    <>
      {COMPONENTS.map((c, i) => {
        const z = 0.0009 + c.h / 2
        switch (c.t) {
          case 'chip':
            return (
              <group key={i} position={[c.x, c.y, z]}>
                <mesh material={m.compon}>
                  <boxGeometry args={[c.w, c.d, c.h]} />
                </mesh>
                {/* Exposed-pad lid on alternating QFNs */}
                {i % 2 === 0 && (
                  <mesh material={m.pcbTrim} position={[0, 0, c.h / 2 + 0.0001]}>
                    <boxGeometry args={[c.w * 0.86, c.d * 0.86, 0.0001]} />
                  </mesh>
                )}
              </group>
            )
          case 'cap':
            return (
              <mesh key={i} material={m.compon} position={[c.x, c.y, z]} rotation={AXIS_Z}>
                <cylinderGeometry args={[c.r, c.r, c.h, 18]} />
              </mesh>
            )
          case 'can':
            return (
              <group key={i} position={[c.x, c.y, z]}>
                <mesh material={m.compon} rotation={AXIS_Z}>
                  <cylinderGeometry args={[c.r, c.r, c.h, 16]} />
                </mesh>
                <mesh material={m.gold} position={[0, 0, c.h / 2]} rotation={AXIS_Z}>
                  <cylinderGeometry args={[c.r * 0.86, c.r * 0.86, 0.00018, 16]} />
                </mesh>
              </group>
            )
          case 'crystal':
            return (
              <group key={i} position={[c.x, c.y, z]}>
                <mesh material={m.compon}>
                  <boxGeometry args={[c.w, c.d, c.h]} />
                </mesh>
                <mesh material={m.gold} position={[-c.w / 2 + 0.00025, 0, 0]}>
                  <boxGeometry args={[0.0005, c.d, c.h]} />
                </mesh>
                <mesh material={m.gold} position={[c.w / 2 - 0.00025, 0, 0]}>
                  <boxGeometry args={[0.0005, c.d, c.h]} />
                </mesh>
              </group>
            )
          case 'ram':
            return (
              <group key={i} position={[c.x, c.y, z]}>
                <mesh material={m.compon}>
                  <boxGeometry args={[c.w, c.d, c.h]} />
                </mesh>
                <mesh material={m.compon} position={[0, 0, c.h / 2 + 0.00014]}>
                  <boxGeometry args={[c.w * 0.92, c.d, 0.00028]} />
                </mesh>
                {/* Bond-wire gold edge pads */}
                {[-c.w / 2 + 0.0004, c.w / 2 - 0.0004].map((x) => (
                  <mesh key={x} material={m.gold} position={[x, 0, c.h / 2 + 0.0003]}>
                    <boxGeometry args={[0.0003, c.d * 0.8, 0.0001]} />
                  </mesh>
                ))}
              </group>
            )
        }
      })}
    </>
  )
}

/** The cell: rounded pouch wrap, visible cell-can core, foil seam ridges,
 * printed label, terminal tab and pull tab. */
export function Battery({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox userData={{ part: 'battery' }} args={[0.032, 0.05, 0.0034]} radius={0.0009} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.batteryBody} attach="material" />
      </RoundedBox>

      {/* Cell can core behind the wrap — steps in from the pouch edges */}
      <RoundedBox args={[0.0306, 0.0484, 0.0028]} radius={0.0008} smoothness={3} position={[0, 0, -0.00015]}>
        <primitive object={m.batteryCell} attach="material" />
      </RoundedBox>

      {/* Foil seam ridges around the label face */}
      {[
        { p: [0.0159, 0] as const, a: [0.0005, 0.05] as const },
        { p: [-0.0159, 0] as const, a: [0.0005, 0.05] as const },
        { p: [0, 0.0248] as const, a: [0.032, 0.0005] as const },
        { p: [0, -0.0248] as const, a: [0.032, 0.0005] as const },
      ].map((s) => (
        <mesh key={`${s.p[0]}:${s.p[1]}`} material={m.batteryCell} position={[s.p[0], s.p[1], 0.00176]}>
          <boxGeometry args={[s.a[0], s.a[1], 0.00012]} />
        </mesh>
      ))}

      {/* Printed label */}
      <mesh material={m.batteryLabel} position={[0, 0, 0.00172]}>
        <planeGeometry args={[0.03, 0.045]} />
      </mesh>

      {/* Terminal tab */}
      <mesh material={m.gold} position={[0.0164, 0.004, 0.0012]}>
        <boxGeometry args={[0.0018, 0.0045, 0.0008]} />
      </mesh>
      <mesh material={m.flex} position={[-0.0165, -0.006, 0.0012]}>
        <boxGeometry args={[0.0016, 0.0036, 0.0006]} />
      </mesh>

      {/* Polyimide pull tab */}
      <mesh material={m.flex} position={[0.0165, 0.014, 0.00085]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.0014, 0.0034, 0.00035]} />
      </mesh>
    </group>
  )
}

/** Three internal camera modules behind the rear island: recessed barrels with
 * OIS rings, recessed bores, three-optical-element stacks, aperture, glass
 * cover, sensors on gold carriers, plus the flex ribbon down to the board. */
export function CameraModules({ m }: { m: InternalsMaterials }) {
  const barrels: { x: number; y: number; r: number }[] = [
    { x: -0.0065, y: 0.0065, r: 0.007 },
    { x: 0.008, y: 0.0068, r: 0.0056 },
    { x: 0.0005, y: -0.0072, r: 0.0056 },
  ]
  return (
    <group>
      <RoundedBox userData={{ part: 'cameras' }} args={[0.034, 0.034, 0.0036]} radius={0.0014} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.housing} attach="material" />
      </RoundedBox>
      {barrels.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          {/* Barrel housing */}
          <mesh material={m.housing}>
            <cylinderGeometry args={[b.r, b.r + 0.0004, 0.0044, 40]} />
          </mesh>
          {/* Voice-coil / OIS actuator ring */}
          <mesh material={m.copper} position={[0, 0, 0.0004]}>
            <torusGeometry args={[b.r + 0.0006, 0.00028, 10, 40]} />
          </mesh>
          {/* Bezel lip at the light opening */}
          <mesh material={m.housing} position={[0, 0, -0.00214]} rotation={AXIS_Z}>
            <torusGeometry args={[b.r - 0.0004, 0.00022, 10, 40]} />
          </mesh>

          {/* Recessed bore bottom (sensor end) */}
          <mesh material={m.pcbTrim} position={[0, 0, 0.00215]} rotation={[Math.PI, 0, 0]}>
            <circleGeometry args={[b.r - 0.0008, 32]} />
          </mesh>

          {/* Sensor die at the +z end, gold carrier pads around it */}
          <mesh material={m.sensor} position={[0, 0, 0.00155]}>
            <circleGeometry args={[b.r - 0.0016, 28]} />
          </mesh>
          {[
            [0.0018, 0.0018],
            [-0.0018, 0.0018],
            [0.0018, -0.0018],
            [-0.0018, -0.0018],
          ].map(([px, py], k) => (
            <mesh key={k} material={m.gold} position={[px, py, 0.00172]}>
              <boxGeometry args={[0.0005, 0.0005, 0.00012]} />
            </mesh>
          ))}

          {/* Optical stack: cover glass, then three elements stepping down
              toward the sensor with a gold aperture between them. */}
          <mesh material={m.lensGlass} position={[0, 0, -0.00212]}>
            <circleGeometry args={[b.r - 0.0006, 32]} />
          </mesh>
          <mesh material={m.lensGlass} position={[0, 0, -0.0019]}>
            <circleGeometry args={[b.r - 0.0018, 28]} />
          </mesh>
          <mesh material={m.gold} position={[0, 0, -0.0015]}>
            <torusGeometry args={[b.r - 0.0024, 0.0002, 10, 32]} />
          </mesh>
          <mesh material={m.lensGlass} position={[0, 0, -0.0012]}>
            <circleGeometry args={[b.r - 0.0026, 28]} />
          </mesh>
          <mesh material={m.lensGlass} position={[0, 0, -0.0005]}>
            <circleGeometry args={[b.r - 0.0034, 28]} />
          </mesh>
        </group>
      ))}
      {/* Flex ribbon to the board */}
      <mesh material={m.flex} position={[0.004, -0.014, 0.002]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.028, 0.0032, 0.00035]} />
      </mesh>
    </group>
  )
}

/** Wireless charging coil on its graphite backing sheet with ferrite core. */
export function WpcCoil({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox args={[0.05, 0.086, 0.00028]} radius={0.0012} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.batteryBody} attach="material" />
      </RoundedBox>
      {/* Ferrite shield pad under the coil */}
      <mesh material={m.housing} position={[0, -0.036, -0.0002]}>
        <cylinderGeometry args={[0.0132, 0.0132, 0.00016, 40]} />
      </mesh>
      <mesh material={m.copper} position={[0, -0.036, 0.0003]}>
        <torusGeometry args={[0.0115, 0.00028, 10, 48]} />
      </mesh>
      <mesh material={m.copper} position={[0, -0.036, 0.0003]}>
        <torusGeometry args={[0.009, 0.00024, 10, 48]} />
      </mesh>
      <mesh material={m.copper} position={[0, -0.036, 0.00038]}>
        <circleGeometry args={[0.0034, 26]} />
      </mesh>
    </group>
  )
}

/** Bottom sub-board with the USB-C / charging block, speaker cavity and extra
 * charge-path parts. */
export function SubBoard({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox args={[0.028, 0.014, 0.0018]} radius={0.0006} smoothness={2} position={[0, 0, 0]}>
        <primitive object={m.pcb} attach="material" />
      </RoundedBox>
      <mesh material={m.pcbFace} position={[0, 0, 0.001]}>
        <boxGeometry args={[0.028, 0.014, 0.0003]} />
      </mesh>
      {[
        [-0.009, 0.0015],
        [0.009, 0.002],
      ].map(([x, y], i) => (
        <mesh key={i} material={m.compon} position={[x, y, 0.0018]}>
          <boxGeometry args={[0.0026, 0.0026, 0.0007]} />
        </mesh>
      ))}
      {/* Charge-path caps + charging can */}
      <mesh material={m.compon} position={[-0.006, -0.0015, 0.00165]} rotation={AXIS_Z}>
        <cylinderGeometry args={[0.0011, 0.0011, 0.0005, 14]} />
      </mesh>
      <mesh material={m.compon} position={[0.004, -0.001, 0.0019]} rotation={AXIS_Z}>
        <cylinderGeometry args={[0.0013, 0.0013, 0.0009, 14]} />
      </mesh>
      <mesh material={m.gold} position={[0.004, -0.001, 0.0003]} rotation={AXIS_Z}>
        <cylinderGeometry args={[0.001, 0.001, 0.00014, 12]} />
      </mesh>
      <mesh material={m.gold} position={[0, 0.0052, 0.0017]}>
        <boxGeometry args={[0.009, 0.0018, 0.0008]} />
      </mesh>

      {/* USB-C charging block */}
      <mesh material={m.housing} position={[0, -0.011, 0]}>
        <boxGeometry args={[0.0045, 0.0045, 0.0024]} />
      </mesh>
      {[-0.00135, -0.00045, 0.00045, 0.00135].map((x) => (
        <mesh key={x} material={m.gold} position={[x, -0.0122, 0.0007]}>
          <boxGeometry args={[0.0009, 0.0022, 0.0008]} />
        </mesh>
      ))}

      {/* Speaker cavity + driver */}
      <mesh material={m.housing} position={[0.009, -0.009, 0]}>
        <cylinderGeometry args={[0.0044, 0.0044, 0.0018, 32]} />
      </mesh>
      <mesh material={m.speakerMat} position={[0.009, -0.009, 0.0011]}>
        <circleGeometry args={[0.0036, 28]} />
      </mesh>
      <mesh material={m.shield} position={[0.009, -0.009, 0.0004]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.0009, 24]} />
      </mesh>
    </group>
  )
}

/** Structural aluminum rails + cross beams, ribs, fastener screw bosses and an
 * inner lip. */
export function MidframeRails({ m }: { m: InternalsMaterials }) {
  const ribs = [-0.042, -0.03, -0.018, -0.004, 0.004, 0.018, 0.032, 0.048]
  const screws = [-0.052, -0.036, -0.02, -0.004, 0.012, 0.028, 0.044, 0.058]
  return (
    <group>
      <mesh material={m.midframe} position={[-0.037, 0, 0]}>
        <boxGeometry args={[0.002, 0.118, 0.001]} />
      </mesh>
      <mesh material={m.midframe} position={[0.037, 0, 0]}>
        <boxGeometry args={[0.002, 0.118, 0.001]} />
      </mesh>
      <mesh material={m.midframe} position={[0, 0.024, 0]}>
        <boxGeometry args={[0.066, 0.0016, 0.001]} />
      </mesh>
      <mesh material={m.midframe} position={[0, -0.052, 0]}>
        <boxGeometry args={[0.066, 0.0024, 0.001]} />
      </mesh>

      {/* Inner rail lips */}
      <mesh material={m.midframe} position={[-0.0364, 0, -0.00025]}>
        <boxGeometry args={[0.0007, 0.118, 0.0005]} />
      </mesh>
      <mesh material={m.midframe} position={[0.0364, 0, -0.00025]}>
        <boxGeometry args={[0.0007, 0.118, 0.0005]} />
      </mesh>

      {/* Structural ribs across the spine */}
      {ribs.map((y) => (
        <mesh key={y} material={m.midframe} position={[0, y, -0.00025]}>
          <boxGeometry args={[0.064, 0.0008, 0.0005]} />
        </mesh>
      ))}

      {/* Fastener screw bosses along both rails */}
      {screws.map((y) =>
        [-0.0378, 0.0378].map((x) => (
          <mesh key={`${x}:${y}`} material={m.pcbTrim} position={[x, y, 0]} rotation={AXIS_Z}>
            <cylinderGeometry args={[0.0005, 0.0005, 0.0005, 14]} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** Meander antenna plates in the four corners. */
export function AntennaPlates({ m }: { m: InternalsMaterials }) {
  const corners: [number, number][] = [
    [0.0315, 0.066],
    [-0.0315, 0.066],
    [0.0315, -0.066],
    [-0.0315, -0.066],
  ]
  return (
    <group>
      {corners.map(([x, y], i) => (
        <RoundedBox key={i} args={[0.014, 0.006, 0.00028]} radius={0.0006} smoothness={2} position={[x, y, 0]}>
          <primitive object={m.antennaPlate} attach="material" />
        </RoundedBox>
      ))}
    </group>
  )
}

/** Front-facing sensor module behind the top glass. */
export function FrontSensors({ m }: { m: InternalsMaterials }) {
  return (
    <group position={[0, 0.066, -0.0009]}>
      <mesh material={m.housing}>
        <boxGeometry args={[0.007, 0.0034, 0.0011]} />
      </mesh>
      {[-0.0014, 0.0016].map((x, i) => (
        <mesh key={i} material={m.sensor} position={[x, 0, 0.00062]}>
          <circleGeometry args={[0.0008, 18]} />
        </mesh>
      ))}
    </group>
  )
}

/** Graphite heat-spreader foil laid between the display and the main board:
 * woven foil with copper seams and perimeter vias. Mount it just forward of
 * the board (see integrator note). */
export function ThermalSpreader({ m }: { m: InternalsMaterials }) {
  const W = 0.04
  const H = 0.054
  return (
    <group>
      <RoundedBox args={[W, H, 0.00022]} radius={0.002} smoothness={2}>
        <primitive object={m.graphite} attach="material" />
      </RoundedBox>
      {/* Copper grounding strips at the foil seams */}
      <mesh material={m.copper} position={[0, H / 2 - 0.0004, 0.0002]}>
        <boxGeometry args={[W - 0.004, 0.0007, 0.00012]} />
      </mesh>
      <mesh material={m.copper} position={[0, -H / 2 + 0.0004, 0.0002]}>
        <boxGeometry args={[W - 0.004, 0.0007, 0.00012]} />
      </mesh>
      {/* Copper edge vias along the top / bottom rows */}
      {[-H / 2 + 0.0032, H / 2 - 0.0032].map((y) =>
        Array.from({ length: 7 }, (_, i) => -W / 2 + 0.004 + i * ((W - 0.008) / 6)).map((x) => (
          <mesh key={`${y}:${x}`} material={m.gold} position={[x, y, 0.00016]}>
            <circleGeometry args={[0.00028, 10]} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** Clean silhouette outline: four thin rods hugging the front and rear faces.
 * Replaces wireframe boxes so the "ghost" reads as an energy containment
 * frame rather than a triangulated cage. */
export function GhostShellOutline({ m }: { m: { ghost: THREE.MeshBasicMaterial } }) {
  const w = 0.0768
  const h = 0.1596
  return (
    <group>
      {[0.00392, -0.0039].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh material={m.ghost} position={[0, h / 2 + 0.0005, 0]}>
            <boxGeometry args={[w + 0.0012, 0.0004, WIRE]} />
          </mesh>
          <mesh material={m.ghost} position={[0, -h / 2 - 0.0005, 0]}>
            <boxGeometry args={[w + 0.0012, 0.0004, WIRE]} />
          </mesh>
          <mesh material={m.ghost} position={[w / 2 + 0.0005, 0, 0]}>
            <boxGeometry args={[0.0004, h + 0.0012, WIRE]} />
          </mesh>
          <mesh material={m.ghost} position={[-w / 2 - 0.0005, 0, 0]}>
            <boxGeometry args={[0.0004, h + 0.0012, WIRE]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const WIRE = 0.00035