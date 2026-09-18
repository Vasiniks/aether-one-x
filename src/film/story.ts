/**
 * The homepage product-film timeline.
 *
 * One continuous camera shot across 13 acts. Each keyframe describes the phone
 * group pose (rotation / scale / screen-space offset) plus the 3D camera
 * (position / target / fov). Between keyframes the pose and fov are eased with
 * a smoothstep while the camera position and target travel along a
 * Catmull-Rom curve, giving the operator-like, weighted feel.
 */

export type ActId =
  | 'arrival'
  | 'settle'
  | 'approach'
  | 'xray'
  | 'chip'
  | 'rebuild'
  | 'camera'
  | 'display'
  | 'storage'
  | 'battery'
  | 'software'
  | 'ai'
  | 'final'

export interface ActDef {
  id: ActId
  start: number
  end: number
  /** Overlay placement strategy for this act. */
  align: 'center' | 'left' | 'right' | 'bottom'
}

export const ACTS: ActDef[] = [
  { id: 'arrival', start: 0, end: 0.1, align: 'center' },
  { id: 'settle', start: 0.1, end: 0.155, align: 'center' },
  { id: 'approach', start: 0.155, end: 0.25, align: 'right' },
  { id: 'xray', start: 0.25, end: 0.33, align: 'left' },
  { id: 'chip', start: 0.33, end: 0.47, align: 'center' },
  { id: 'rebuild', start: 0.47, end: 0.52, align: 'bottom' },
  { id: 'camera', start: 0.52, end: 0.72, align: 'right' },
  { id: 'display', start: 0.72, end: 0.84, align: 'center' },
  { id: 'storage', start: 0.84, end: 0.89, align: 'right' },
  { id: 'battery', start: 0.89, end: 0.93, align: 'left' },
  { id: 'software', start: 0.93, end: 0.955, align: 'center' },
  { id: 'ai', start: 0.955, end: 0.968, align: 'right' },
  { id: 'final', start: 0.968, end: 1, align: 'center' },
]

export interface FilmKey {
  at: number
  /** Phone group rotation (radians) and scale. */
  rx: number
  ry: number
  rz: number
  scale: number
  /** Phone offset within the film world (drives off-center compositions). */
  px: number
  py: number
  /** Camera position */
  cx: number
  cy: number
  cz: number
  /** Camera target */
  tx: number
  ty: number
  tz: number
  /** Author fallback vertical field of view (degrees), used when `fit` is unset. */
  fov: number
  /**
   * Responsive framing target: the phone should occupy this share of the
   * viewport height. When set, the actual camera FOV is recomputed per
   * keyframe to deliver that fit on every monitor (see framing.ts).
   */
  fit?: number
  /** Upper FOV clamp for this keyframe (defaults to 52deg). */
  fovMax?: number
}

const KS = (
  at: number,
  rx: number,
  ry: number,
  rz: number,
  scale: number,
  px: number,
  py: number,
  cx: number,
  cy: number,
  cz: number,
  tx: number,
  ty: number,
  tz: number,
  fov: number,
  fit?: number,
  fovMax?: number,
): FilmKey => ({ at, rx, ry, rz, scale, px, py, cx, cy, cz, tx, ty, tz, fov, fit, fovMax })

/**
 * Master keyframe list. Read as one continuous camera move around the phone.
 * Keyframes with a `fit` target are framed responsively against the viewport
 * (see framing.ts); detail shots keep their authored `fov`.
 */
export const KEYS: FilmKey[] = [
  // -- ARRIVAL: phone out of the dark, edge-on and small, rising to hero pose --
  KS(0, -0.5, 1.6, 0, 0.55, 0, 0, 0, 0, 1.16, 0, 0, 0, 13, 0.4),
  KS(0.04, -0.45, 0.85, 0, 0.7, 0, 0, 0, 0, 1.06, 0, 0, 0, 14, 0.48),
  KS(0.08, -0.36, 0.5, 0, 0.88, 0, 0, 0, 0, 0.97, 0, 0, 0, 15, 0.55),
  KS(0.1, -0.28, 0.35, 0, 1, 0, 0, 0, 0, 0.92, 0, 0, 0, 16, 0.6),

  // -- SETTLE: title breathes, then we lean in --
  KS(0.155, -0.2, 0.2, 0, 1.07, 0, 0.01, 0, 0.01, 0.85, 0, 0, 0, 17, 0.62),

  // -- APPROACH: closer to the front glass, then the titanium edge --
  KS(0.2, -0.06, 0.04, 0, 1.18, 0, 0.02, 0, 0.02, 0.68, 0, 0, 0, 20, 0.66),
  KS(0.24, -0.05, 0.55, 0.02, 1.23, -0.14, 0.02, 0.24, 0.02, 0.74, 0, 0, 0, 22, 0.7),
  KS(0.25, -0.08, 0.72, 0.02, 1.26, -0.12, 0.05, 0.2, 0.04, 0.66, 0, 0, 0, 22, 0.68),

  // -- X-RAY: overhead dive, shell ghosts, internals surface --
  KS(0.28, -0.5, 0.38, 0, 1.36, 0, 0.1, 0, 0.1, 0.56, 0.012, 0.02, 0, 24, 0.55),
  KS(0.33, -0.62, 0.24, 0, 1.44, 0, 0.13, 0, 0.13, 0.5, 0.02, 0.06, 0, 28, 0.5),

  // -- CHIP: the A1 Ultra becomes the subject; the camera dives into the
  // cavity as the shell still ghosts, until the die owns the frame --
  KS(0.4, -0.5, 0.3, 0, 1.78, 0, 0.06, 0.016, 0.055, 0.085, 0.012, 0.055, 0.012, 30, 0.9, 48),
  KS(0.46, -0.42, 0.45, 0, 1.95, 0, 0.055, 0.011, 0.055, 0.038, 0.012, 0.055, 0.01, 40, 0.95, 56),

  // -- REBUILD: pull out of the cavity, stack repacks, shell closes --
  KS(0.5, -0.34, 0.7, 0, 1.62, 0, 0.045, 0.008, 0.045, 0.42, 0.012, 0.03, 0, 31, 0.66),
  KS(0.52, -0.28, 1.02, 0, 1.28, 0, 0.025, 0, 0.025, 0.64, 0, 0, 0, 24, 0.6),

  // -- CAMERA: approach the island, macro on the lenses --
  KS(0.56, -0.3, 1.55, 0.02, 1.16, 0, 0.02, 0, 0.02, 0.78, 0, 0, 0, 20, 0.6),
  KS(0.6, -0.35, 1.85, 0.03, 1.29, 0, 0.03, 0.03, 0.03, 0.64, -0.012, 0.05, 0, 22, 0.78),
  KS(0.63, -0.4, 2.12, 0.04, 1.56, 0, 0.03, 0.01, 0.03, 0.42, -0.023, 0.05, 0, 28),
  KS(0.66, -0.42, 2.32, 0.05, 1.92, 0, 0.035, -0.005, 0.035, 0.3, -0.023, 0.05, 0, 34),
  KS(0.69, -0.38, 2.12, 0.045, 1.62, 0, 0.028, 0.01, 0.028, 0.4, -0.023, 0.05, 0, 30),
  KS(0.72, -0.3, 1.85, 0.03, 1.3, 0, 0.025, 0.02, 0.025, 0.56, -0.01, 0.03, 0, 25, 0.58),

  // -- DISPLAY: turn to front, screen takes over --
  KS(0.76, -0.15, 0.9, 0, 1.2, 0, 0.02, 0, 0.02, 0.62, 0, 0, 0, 21, 0.6),
  KS(0.79, -0.03, 0.1, 0, 1.3, 0, 0.01, 0, 0.01, 0.56, 0, 0, 0, 24, 0.64),
  KS(0.82, 0, 0, 0, 1.47, 0, 0, 0, 0, 0.49, 0, 0, 0, 28, 0.66),

  // -- STORAGE: phone settles left, editorial numbers right --
  KS(0.86, -0.03, 0.2, 0, 1.16, -0.16, 0.01, 0.3, 0.01, 0.6, 0, 0, 0, 22, 0.56),

  // -- BATTERY: partial interior, energy story --
  KS(0.9, -0.5, 0.35, 0.02, 1.32, 0.12, 0.06, -0.26, 0.06, 0.55, 0, 0, 0, 24, 0.58),

  // -- SOFTWARE: front and centered, screen is the interface --
  KS(0.93, -0.02, 0, 0, 1.28, 0, 0, 0, 0, 0.55, 0, 0, 0, 26, 0.62),

  // -- INTELLIGENCE: phone holds right --
  KS(0.955, -0.12, 0.28, 0, 1.14, -0.1, 0.01, 0.26, 0.01, 0.66, -0.03, 0, 0, 21, 0.56),

  // -- FINAL: return to the center, best lighting, three-quarter hero --
  KS(0.98, -0.28, 0.42, 0, 1.34, 0, 0.02, 0, 0.02, 0.6, 0, 0, 0, 22, 0.6),
  KS(1, -0.26, 0.4, 0, 1.36, 0, 0.02, 0, 0.02, 0.58, 0, 0, 0, 22, 0.62),
]

export function actAt(p: number): ActDef {
  for (const act of ACTS) {
    if (p < act.end) return act
  }
  return ACTS[ACTS.length - 1]
}

/** Panic-free smoothing sigmoid used on every keyframed easing. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Normalized position of `p` within the act that contains it (0..1). */
export function localInAct(p: number, act: ActDef): number {
  const span = act.end - act.start
  if (span <= 0) return 1
  return Math.min(1, Math.max(0, (p - act.start) / span))
}