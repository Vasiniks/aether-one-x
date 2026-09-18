import * as THREE from 'three'

/**
 * Hover-to-inspect for the x-ray pass. A tiny shared pointer store updated by
 * a window-level pointermove listener feeds the director's raycaster; results
 * are dispatched (only on change) as a CustomEvent the overlay host subscribes
 * to, so tooltips never force per-frame React renders.
 */

export interface XrayTooltip {
  label: string
  detail: string
  /** Placement across the viewport (0..1). */
  x: number
  y: number
}

interface Picked {
  name: string
  label: string
  detail: string
  position: THREE.Vector3
}

const PICK_TARGETS: Record<string, { label: string; detail: string }> = {
  'xray:soc': { label: 'A1 ULTRA', detail: '3 NM · 8 CPU · 14 GPU' },
  'xray:battery': { label: 'BATTERY', detail: '5200 mAh · LONG-LIFE CELL' },
  'xray:board': { label: 'MAIN BOARD', detail: '14-LAYER PCB · 16 GB LPDDR5X' },
  'xray:camera': { label: 'CAMERA', detail: '50 MP · 1/1.3IN · OIS' },
}

const XRAY_EVENT = 'aether:xtip'

/** NDC pointer read by the director; updated outside React via a DOM listener. */
export const hoverPointer: { ndc: THREE.Vector2; dirty: boolean; fine: boolean } = {
  ndc: new THREE.Vector2(0, 0),
  dirty: true,
  fine: true,
}

let active = false
let tooltip: XrayTooltip | null = null
let lastKey = ''

export function setXrayActive(value: boolean) {
  if (active === value) return
  active = value
  if (!value) publish(null)
}

function publish(tip: XrayTooltip | null) {
  tooltip = tip
  window.dispatchEvent(new CustomEvent<XrayTooltip | null>(XRAY_EVENT, { detail: tip }))
}

export function getXrayTooltip(): XrayTooltip | null {
  return tooltip
}

export const XRAY_TOOLTIP_EVENT = XRAY_EVENT

function pickTarget(obj: THREE.Object3D): Picked | null {
  let node: THREE.Object3D | null = obj
  while (node) {
    if (typeof node.name === 'string' && PICK_TARGETS[node.name]) {
      const meta = PICK_TARGETS[node.name]
      const world = new THREE.Vector3()
      node.getWorldPosition(world)
      return { name: node.name, ...meta, position: world }
    }
    node = node.parent
  }
  return null
}

const _tip = new THREE.Vector3()
const _v = new THREE.Vector3()

/**
 * Raycasts the internals root and publishes the closest pick. Pass `null` as
 * `root` to clear the hover. Runs only from the director, only when the pointer
 * moved, and only publishes when the target actually changed.
 */
export function updatePick(
  ray: THREE.Raycaster,
  camera: THREE.Camera,
  root: THREE.Object3D | null,
) {
  if (!active || !root) {
    if (lastKey) {
      lastKey = ''
      publish(null)
    }
    return
  }
  const hits = ray.intersectObject(root, true)
  let picked: Picked | null = null
  for (const hit of hits) {
    const t = pickTarget(hit.object)
    if (t) {
      picked = t
      break
    }
  }

  if (!picked) {
    if (lastKey) {
      lastKey = ''
      publish(null)
    }
    return
  }

  _tip.copy(picked.position).project(camera)
  _v.set(0.5 + _tip.x * 0.5, 0.5 - _tip.y * 0.5, 0)
  const x = Math.min(0.93, Math.max(0.07, _v.x))
  const y = Math.min(0.92, Math.max(0.08, _v.y))
  const key = `${picked.label}|${picked.detail}|${x.toFixed(3)}|${y.toFixed(3)}`
  if (key !== lastKey) {
    lastKey = key
    publish({ label: picked.label, detail: picked.detail, x, y })
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    hoverPointer.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    hoverPointer.dirty = true
  })
  try {
    hoverPointer.fine = window.matchMedia('(pointer: fine)').matches
  } catch {
    hoverPointer.fine = true
  }
}