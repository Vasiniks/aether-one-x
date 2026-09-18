import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { InternalsMaterials } from './materials'

/**
 * Presentation geometry for each internal assembly. Every part is authored in
 * its own local frame; the assembly (Internals.tsx) positions the groups and
 * drives the explode / focus animation.
 */

export type PickRegistration = (mesh: THREE.Mesh, label: string, detail: string) => void

/** Main board: PCB, trace face, edge copper, shields, discrete components,
 * gold connector row and the Aether A1 Ultra package on top. */
export function MainBoardAndSoC({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox args={[0.043, 0.056, 0.0018]} radius={0.0007} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.pcb} attach="material" />
      </RoundedBox>
      {/* Trace face */}
      <mesh name="xray:board" position={[0, 0, 0.001]}>
        <boxGeometry args={[0.043, 0.056, 0.0003]} />
        <primitive object={m.pcbFace} attach="material" />
      </mesh>
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

      {/* Shield cans */}
      <mesh material={m.shield} position={[-0.012, 0.016, 0.0017]}>
        <boxGeometry args={[0.013, 0.013, 0.0011]} />
      </mesh>
      <mesh material={m.shield} position={[0.012, 0.011, 0.0017]}>
        <boxGeometry args={[0.012, 0.009, 0.0011]} />
      </mesh>
      <mesh material={m.shield} position={[-0.012, -0.014, 0.0016]}>
        <boxGeometry args={[0.011, 0.008, 0.001]} />
      </mesh>

      {/* Gold connector row to the sub-board */}
      {[-0.012, -0.004, 0.004, 0.012].map((x) => (
        <mesh key={x} material={m.gold} position={[x, -0.0305, 0.0006]}>
          <boxGeometry args={[0.0022, 0.0028, 0.001]} />
        </mesh>
      ))}
      {/* NFC corner patch */}
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

/** Aether A1 Ultra: organic substrate, mirrored die with printed circuitry,
 * gold pads and the additive focus ring that brightens on approach. */
export function SoCPackage({ m }: { m: InternalsMaterials }) {
  return (
    <group position={[0.003, 0.002, 0.001]}>
      <RoundedBox name="xray:soc" args={[0.011, 0.011, 0.0011]} radius={0.0006} smoothness={2} position={[0, 0, 0]}>
        <primitive object={m.substrate} attach="material" />
      </RoundedBox>
      <mesh material={m.socDie} position={[0, 0, 0.00085]}>
        <boxGeometry args={[0.0082, 0.0082, 0.0006]} />
      </mesh>
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

const COMPONENTS: { x: number; y: number; w: number; d: number; h: number }[] = [
  { x: -0.016, y: 0.02, w: 0.003, d: 0.005, h: 0.0006 },
  { x: -0.019, y: 0.006, w: 0.0024, d: 0.002, h: 0.0005 },
  { x: -0.015, y: -0.003, w: 0.002, d: 0.005, h: 0.0009 },
  { x: -0.019, y: -0.017, w: 0.0026, d: 0.004, h: 0.0006 },
  { x: -0.012, y: -0.025, w: 0.0036, d: 0.003, h: 0.0008 },
  { x: 0.013, y: 0.021, w: 0.005, d: 0.003, h: 0.0006 },
  { x: 0.018, y: 0.004, w: 0.0024, d: 0.0024, h: 0.0009 },
  { x: 0.016, y: -0.009, w: 0.003, d: 0.005, h: 0.0007 },
  { x: 0.018, y: -0.021, w: 0.0026, d: 0.004, h: 0.0006 },
  { x: 0.008, y: -0.026, w: 0.004, d: 0.003, h: 0.0009 },
  { x: -0.004, y: 0.022, w: 0.004, d: 0.0024, h: 0.0005 },
  { x: 0.004, y: -0.013, w: 0.002, d: 0.0034, h: 0.0006 },
  { x: -0.006, y: 0.009, w: 0.0022, d: 0.0022, h: 0.0004 },
]

function Components({ m }: { m: InternalsMaterials }) {
  return (
    <>
      {COMPONENTS.map((c, i) => (
        <mesh key={i} material={m.compon} position={[c.x, c.y, 0.0017 + c.h / 2]}>
          <boxGeometry args={[c.w, c.d, c.h]} />
        </mesh>
      ))}
    </>
  )
}

/** The cell: rounded pouch, printed label, terminal tab. */
export function Battery({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox name="xray:battery" args={[0.032, 0.05, 0.0034]} radius={0.001} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.batteryBody} attach="material" />
      </RoundedBox>
      <mesh material={m.batteryLabel} position={[0, 0, 0.00172]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.026, 0.045]} />
      </mesh>
      <mesh material={m.gold} position={[0.0164, 0.004, 0.0012]}>
        <boxGeometry args={[0.0018, 0.0045, 0.0008]} />
      </mesh>
      <mesh material={m.flex} position={[-0.0165, -0.006, 0.0012]}>
        <boxGeometry args={[0.0016, 0.0036, 0.0006]} />
      </mesh>
    </group>
  )
}

/** Three internal camera modules behind the rear island: barrels, top rings
 * and glowing sensors, plus the flex ribbon down to the board. */
export function CameraModules({ m }: { m: InternalsMaterials }) {
  const barrels: { x: number; y: number; r: number }[] = [
    { x: -0.0065, y: 0.0065, r: 0.007 },
    { x: 0.008, y: 0.0068, r: 0.0056 },
    { x: 0.0005, y: -0.0072, r: 0.0056 },
  ]
  return (
    <group>
      <RoundedBox name="xray:camera" args={[0.034, 0.034, 0.0036]} radius={0.0014} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.housing} attach="material" />
      </RoundedBox>
      {barrels.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          <mesh material={m.housing}>
            <cylinderGeometry args={[b.r, b.r + 0.0004, 0.0044, 40]} />
          </mesh>
          {/* Wall reflex (barrel bore) visible on the side */}
          <mesh material={m.pcbTrim} position={[0, 0, -0.00218]} rotation={[Math.PI, 0, 0]}>
            <circleGeometry args={[b.r - 0.0008, 32]} />
          </mesh>
          {/* Sensor die at the bottom of the barrel */}
          <mesh material={m.sensor} position={[0, 0, 0.0023]}>
            <circleGeometry args={[b.r - 0.0015, 28]} />
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

/** Wireless charging coil on its graphite backing sheet. */
export function WpcCoil({ m }: { m: InternalsMaterials }) {
  return (
    <group>
      <RoundedBox args={[0.05, 0.086, 0.00028]} radius={0.0012} smoothness={3} position={[0, 0, 0]}>
        <primitive object={m.batteryBody} attach="material" />
      </RoundedBox>
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

/** Bottom sub-board with the USB-C / charging block and speaker cavity. */
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

/** Structural aluminum rails + cross beam that sit in front of the internals. */
export function MidframeRails({ m }: { m: InternalsMaterials }) {
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