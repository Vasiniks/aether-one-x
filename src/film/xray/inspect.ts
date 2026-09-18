import * as THREE from 'three'

/**
 * Hover/tap-to-inspect for the x-ray pass. A tiny shared pointer store updated
 * by a window-level pointermove listener feeds the director's raycaster; picks
 * are dispatched (only on change) as a CustomEvent the overlay host subscribes
 * to, so tooltips never force per-frame React renders. A lightweight highlight
 * protocol lets the rest of the hardware dim while one part is selected.
 */

export interface XrayTooltip {
  label: string
  detail: string
  /** Placement across the viewport (0..1). */
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Part identity + curated copy map
// ---------------------------------------------------------------------------

export type PartId =
  | 'die'
  | 'battery'
  | 'main'
  | 'cameras'
  | 'wpc'
  | 'sub'
  | 'frame'
  | 'antenna'
  | 'screen'

export interface PartCopy {
  label: string
  detail: string
}

/** Copy per inspectable part. Consume this constant; do not hand-edit label /
 * detail strings inside this module or XrayTooltip.tsx.
 * Compliance: no em-dash, max one middle-dot per line. */
export const PART_COPY: Record<PartId, PartCopy> = {
  die: { label: 'A1 ULTRA', detail: '3 NM \u00B7 8-CORE CPU, 14-CORE GPU, 46 TOPS NPU' },
  battery: { label: 'BATTERY', detail: '5200 MAH \u00B7 100 W WIRED, 40 W WIRELESS, 15 W REVERSE' },
  main: { label: 'MAIN BOARD', detail: '14-LAYER PCB \u00B7 16 GB LPDDR5X, UFS 4.1' },
  cameras: { label: 'CAMERAS', detail: '50 MP MAIN \u00B7 48 MP ULTRA, 50 MP TELE' },
  wpc: { label: 'WIRELESS POWER', detail: '40 W COIL \u00B7 QI2 READY' },
  sub: { label: 'SUB BOARD', detail: 'USB-C \u00B7 100 W CHARGE IC, SPEAKER' },
  frame: { label: 'FRAME', detail: 'GRADE-5 TITANIUM \u00B7 7.8 MM, 198 G' },
  antenna: { label: 'ANTENNA', detail: '5G MMWAVE \u00B7 WI-FI 7, BLUETOOTH 5.4' },
  screen: { label: 'DISPLAY', detail: '3200 \u00D7 1440 \u00B7 1-144 HZ, 2800 NITS' },
}

/** Meshes tagged `name="xray:..."` (legacy path) still map onto PartId. */
const LEGACY_NAMES: Record<string, PartId> = {
  'xray:soc': 'die',
  'xray:battery': 'battery',
  'xray:board': 'main',
  'xray:camera': 'cameras',
}

// ---------------------------------------------------------------------------
// Highlight protocol (driven by the director each frame)
// ---------------------------------------------------------------------------

export interface HighlightSpec {
  /** Part that currently owns the selection, or null for none. */
  subject: PartId | null
  /** 0..1 smoothed selection weight (self-invoked: no external damping). */
  blend: number
}

/**
 * Read this every frame; never write `.blend` by hand. To select, assign
 * `highlight.subject = 'die'` and call tick().
 */
export const highlight: HighlightSpec = {
  subject: null,
  blend: 0,
}

/** Integrator contract: dim = DIM * blend, glow = (1 - DIM) * blend. */
export const DIM = 0.32

/** Smooth blend used by tick(): `1 - exp(-delta * SMOOTH)`. */
export const SMOOTH = 14

function blendSubject(target: PartId | null, delta: number) {
  const d = Math.min(delta, 0.1)
  const k = 1 - Math.exp(-SMOOTH * d)
  highlight.subject = target
  highlight.blend += ((target === null ? 0 : 1) - highlight.blend) * k
}

/** Call every integrator frame with the real frame delta. */
export function tick(delta: number) {
  blendSubject(highlight.subject, delta)
  if (highlight.blend <= 0.0005 && highlight.subject !== null) {
    highlight.subject = null
    highlight.blend = 0
  }
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
let lastKey = ''
let lastPart: PartId | null = null
const lastAnchor = new THREE.Vector3()

export function setXrayActive(value: boolean) {
  if (active === value) return
  active = value
  if (!value) {
    publish(null)
    blendSubject(null, 0.25)
  }
}

function publish(tip: XrayTooltip | null) {
  window.dispatchEvent(new CustomEvent<XrayTooltip | null>(XRAY_EVENT, { detail: tip }))
}

export const XRAY_TOOLTIP_EVENT = XRAY_EVENT

const _tip = new THREE.Vector3()
const _v = new THREE.Vector3()

function partOf(obj: THREE.Object3D): PartId | null {
  let node: THREE.Object3D | null = obj
  while (node) {
    const tagged = (node.userData as { part?: unknown }).part
    if (typeof tagged === 'string' && (PART_COPY as Record<string, PartCopy>)[tagged]) {
      return tagged as PartId
    }
    const legacy = typeof node.name === 'string' ? LEGACY_NAMES[node.name] : undefined
    if (legacy) return legacy
    node = node.parent
  }
  return null
}

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

/** Projects a picked world point to a clamped screen anchor and publishes the
 * tip only when the anchor actually moved. */
function publishAnchor(meta: PartCopy, camera: THREE.Camera, world: THREE.Vector3) {
  if (!active) return
  _tip.copy(world).project(camera)
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
  const key = `${meta.label}|${meta.detail}|${x.toFixed(3)}|${y.toFixed(3)}`
  if (key !== lastKey) {
    lastKey = key
    publish({ label: meta.label, detail: meta.detail, x, y })
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
  // Always sync the highlight subject with the pick so the x-ray stage never
  // leaves a lingering selection after the pointer leaves.
  if (!active || !root) {
    blendSubject(null, 0.25)
    if (lastKey) {
      lastKey = ''
      publish(null)
    }
    return
  }
  const hits = ray.intersectObject(root, true)
  let picked: PartId | null = null
  for (const hit of hits) {
    const p = partOf(hit.object)
    if (p) {
      picked = p
      lastAnchor.copy(hit.point)
      break
    }
  }

  // A miss clears both the tooltip and the highlight; updatePick hands the
  // blend its own easing pulse so the selector feels continuous.
  if (!picked) {
    blendSubject(null, 0.25)
    if (lastKey) {
      lastKey = ''
      publish(null)
    }
    return
  }

  lastPart = picked
  blendSubject(picked, 0.25)
  publishAnchor(PART_COPY[picked], camera, lastAnchor)
}

/**
 * Cheap per-frame resync: re-projects the last picked world point so the
 * tooltip sticks to the part as the film scrolls. Raycast-free; safe to call
 * every integrator frame. No-op while nothing is picked or the pass is off.
 */
export function resyncPick(camera: THREE.Camera) {
  if (!active || !lastPart) return
  blendSubject(lastPart, 0.05)
  publishAnchor(PART_COPY[lastPart], camera, lastAnchor)
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