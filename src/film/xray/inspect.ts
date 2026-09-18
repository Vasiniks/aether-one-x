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
  'xray:soc': { label: 'A1 ULTRA', detail: '3 NM / 8 CPU / 14 GPU' },
  'xray:battery': { label: 'BATTERY', detail: '5200 mAh · LONG-LIFE CELL' },
  'xray:board': { label: 'MAIN BOARD', detail: '14-LAYER PCB · 16 GB LPDDR5X' },
  'xray:camera': { label: 'CAMERA', detail: '50 MP / 1/1.3IN / OIS' },
}

const XRAY_EVENT = 'aether:xtip'

const TAP_SLOP = 10
const TAP_WINDOW = 500

/** NDC pointer read by the director; updated outside React via a DOM listener. */
export const hoverPointer: {
  ndc: THREE.Vector2
  dirty: boolean
  fine: boolean
  lastTap: number
  downX: number
  downY: number
  downTime: number
} = {
  ndc: new THREE.Vector2(0, 0),
  dirty: true,
  fine: true,
  lastTap: 0,
  downX: 0,
  downY: 0,
  downTime: 0,
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
      node.getWorldPosition(_world)
      return { name: node.name, ...meta, position: _world }
    }
    node = node.parent
  }
  return null
}

const _tip = new THREE.Vector3()
const _v = new THREE.Vector3()
const _world = new THREE.Vector3()

/** Left/right/top/bottom safe-area insets (0 on desktop). */
function safeInsets(): { left: number; right: number; top: number; bottom: number } {
  const el = typeof document !== 'undefined' ? document.documentElement : null
  const cs = el ? getComputedStyle(el) : null
  const n = (v: string) => parseFloat(v) || 0
  return {
    left: cs ? n(cs.getPropertyValue('env(safe-area-inset-left)')) : 0,
    right: cs ? n(cs.getPropertyValue('env(safe-area-inset-right)')) : 0,
    top: cs ? n(cs.getPropertyValue('env(safe-area-inset-top)')) : 0,
    bottom: cs ? n(cs.getPropertyValue('env(safe-area-inset-bottom)')) : 0,
  }
}

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
  // Keep the anchor out of the safe-area insets (notch / home indicator) so
  // the fixed tooltip can never slide under the device chrome in landscape.
  const vw = window.innerWidth || 1
  const vh = window.innerHeight || 1
  const ins = safeInsets()
  const xMin = (0.07 * vw + ins.left) / vw
  const xMax = (0.93 * vw - ins.right) / vw
  const yMin = (0.08 * vh + ins.top) / vh
  const yMax = (0.92 * vh - ins.bottom) / vh
  const x = Math.min(Math.max(xMax, xMin), Math.max(xMin, Math.min(xMax, _v.x)))
  const y = Math.min(Math.max(yMax, yMin), Math.max(yMin, Math.min(yMax, _v.y)))
  const key = `${picked.label}|${picked.detail}|${x.toFixed(3)}|${y.toFixed(3)}`
  if (key !== lastKey) {
    lastKey = key
    publish({ label: picked.label, detail: picked.detail, x, y })
  }
}

if (typeof window !== 'undefined') {
  const sync = (e: PointerEvent) => {
    hoverPointer.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    hoverPointer.dirty = true
  }
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') sync(e)
  })
  // Coarse pointers (phones / tablets) have no hover: a pick is armed only when
  // the gesture looks like a tap (short press, inside a slop box), so a finger
  // picking the skin while scrolling never fires a spurious tooltip.
  window.addEventListener('pointerdown', (e) => {
    hoverPointer.downX = e.clientX
    hoverPointer.downY = e.clientY
    hoverPointer.downTime = performance.now()
  })
  window.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return
    const dx = e.clientX - hoverPointer.downX
    const dy = e.clientY - hoverPointer.downY
    const dt = performance.now() - hoverPointer.downTime
    if (Math.hypot(dx, dy) < TAP_SLOP && dt < TAP_WINDOW) {
      sync(e)
      hoverPointer.lastTap = performance.now()
    }
  })
  window.addEventListener('pointercancel', () => {
    hoverPointer.lastTap = 0
  })
  try {
    // Touchscreen laptops report both `pointer: fine` and maxTouchPoints > 0;
    // without the second gate a finger-drag would look like a sustained hover.
    hoverPointer.fine =
      window.matchMedia('(pointer: fine)').matches && navigator.maxTouchPoints === 0
  } catch {
    hoverPointer.fine = true
  }
}