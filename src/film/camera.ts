import * as THREE from 'three'
import { KEYS, smoothstep, type FilmKey } from './story'

export interface FilmSample {
  /** Camera world position */
  pos: THREE.Vector3
  /** Camera look-at target */
  target: THREE.Vector3
  /** Author vertical field of view (degrees), used as the fallback. */
  fov: number
  /** Responsive fit target (null = keep authored fov, see framing.ts). */
  fit: number | null
  /** Upper FOV clamp when `fit` drives the lens. */
  fovMax: number
  /** Phone group pose */
  rx: number
  ry: number
  rz: number
  scale: number
  px: number
  py: number
}

/**
 * Locates the authored keyframe segment at progress `p` and returns both
 * endpoints plus the eased local parameter and their index span. Halting on
 * `b.at` means `p` inside a segment maps to `t` in [0,1]; endpoints simply
 * echo their own key with `t = 0`.
 */
function findSegment(p: number): { a: FilmKey; b: FilmKey; t: number; ia: number; ib: number } {
  if (p <= KEYS[0].at) return { a: KEYS[0], b: KEYS[0], t: 0, ia: 0, ib: 0 }
  for (let i = 1; i < KEYS.length; i++) {
    const b = KEYS[i]
    if (p <= b.at) {
      const a = KEYS[i - 1]
      return { a, b, t: smoothstep((p - a.at) / (b.at - a.at)), ia: i - 1, ib: i }
    }
  }
  const last = KEYS[KEYS.length - 1]
  return { a: last, b: last, t: 0, ia: KEYS.length - 1, ib: KEYS.length - 1 }
}

/**
 * Three's CatmullRomSampler uses uniform knots, so sampling at raw `p` would
 * land on the i-th key at u = i/(N-1) instead of at its authored `at`, sliding
 * the whole camera travel against the pose/FOV timelines (most visible as the
 * camera slamming into the internals before chip-dive and the blank stretch
 * between regions). Re-clocking the curve parameter onto the author's segment
 * clock forces each key to land exactly at its authored progress so position,
 * pose and FOV all share one timeline.
 */
function reclockedCurveParam(p: number): number {
  const { t, ia, ib } = findSegment(p)
  return (ia + (ib - ia) * t) / (KEYS.length - 1)
}

const POS_PTS = KEYS.map((k) => new THREE.Vector3(k.cx, k.cy, k.cz))
const TGT_PTS = KEYS.map((k) => new THREE.Vector3(k.tx, k.ty, k.tz))
/** Camera travel curves; built once at module load (pure math, no DOM). The
 * position curve is loosened to 0.32 and the target to 0.42 so the eye leads
 * and the aim settles slightly later - fewer overshoots at act boundaries. */
const POS_CURVE = new THREE.CatmullRomCurve3(POS_PTS, false, 'catmullrom', 0.32)
const TGT_CURVE = new THREE.CatmullRomCurve3(TGT_PTS, false, 'catmullrom', 0.42)

const OUT: FilmSample = {
  pos: new THREE.Vector3(),
  target: new THREE.Vector3(),
  fov: 0,
  fit: null,
  fovMax: 52,
  rx: 0,
  ry: 0,
  rz: 0,
  scale: 0,
  px: 0,
  py: 0,
}

/**
 * Samples the master film timeline at progress `p`. Reuses a single scratch
 * object (zero allocation per frame). Camera follows a Catmull-Rom path
 * (operator-dolly feel); the phone pose and fov are eased between keyframes.
 */
export function sampleFilm(p: number): FilmSample {
  const { a, b, t } = findSegment(p)

  // Curve knots are uniform; re-clock to the author's segment clock so the
  // physical travel and the eased pose/FOV can never drift apart.
  POS_CURVE.getPoint(reclockedCurveParam(p), OUT.pos)
  TGT_CURVE.getPoint(reclockedCurveParam(p), OUT.target)

  OUT.rx = a.rx + (b.rx - a.rx) * t
  OUT.ry = a.ry + (b.ry - a.ry) * t
  OUT.rz = a.rz + (b.rz - a.rz) * t
  OUT.scale = a.scale + (b.scale - a.scale) * t
  OUT.px = a.px + (b.px - a.px) * t
  OUT.py = a.py + (b.py - a.py) * t
  OUT.fov = a.fov + (b.fov - a.fov) * t

  // Responsive framing overrides the authored fov only where BOTH endpoints
  // of a segment carry a fit target - a single authority per segment, so the
  // lens never flips between fit-pinned and authored mid-travel.
  const fit = a.fit != null && b.fit != null ? a.fit + (b.fit - a.fit) * t : null
  OUT.fit = fit
  // Upper FOV clamp stays one constant per region (stair-free): 48 through the
  // chip dive so the macro never rides a widening clamp, 52 everywhere else.
  OUT.fovMax = p >= 0.4 && p <= 0.52 ? 48 : 52

  return OUT
}

/** Deterministic per-progress scalars that drive the X-ray / internals states. */
export interface FilmStates {
  /** 0..1 how far the outer shell has dissolved. */
  shellGhost: number
  /** 0..1 how much the shell layers (glass / back) split apart. */
  shellSplit: number
  /** 0..1 how visible the internal hardware is. */
  internalOpacity: number
  /** 0..1 how far the internals are pulled apart (x-ray pass only). */
  explodeXray: number
  /** 0..1 how far only the battery parts apart (energy climax). */
  explodeBatt: number
  /** 0..1 if the A1 Ultra is the focused subject. */
  chipFocus: number
  /** 0..1 the A1 Ultra quarry is lifted out of the board plane (macro). */
  chipLift: number
  /** 0..1 the battery cell pulls toward the camera at the energy climax. */
  battLift: number
  /** 0..1 the rest of the internals step back while one subject owns the frame. */
  subjectDim: number
  /** 0..1 the camera has dived on the physical lens barrels (camera macro). */
  cameraFocus: number
  /** 0..1 partial interior glow during the energy story. */
  energy: number
  /** 0..1 display brightness of the live screen. */
  screenOn: number
}

/**
 * A plateau window: eases up from `in1` to `in2`, holds 1 until `out1`, then
 * eases back down to 0 by `out2`. Note the descent is `1 - smoothstep`, which
 * is what restores the shell / fades internals / re-screws the explosion.
 */
function ramplike(p: number, in1: number, in2: number, out1: number, out2: number): number {
  const up = smoothstep(Math.min(1, Math.max(0, (p - in1) / Math.max(1e-5, in2 - in1))))
  const down = smoothstep(Math.min(1, Math.max(0, (p - out1) / Math.max(1e-5, out2 - out1))))
  return Math.min(up, 1 - down)
}

/** Scratch film-state object (zero allocation per frame). */
const STATES: FilmStates = {
  shellGhost: 0,
  shellSplit: 0,
  internalOpacity: 0,
  explodeXray: 0,
  explodeBatt: 0,
  chipFocus: 0,
  chipLift: 0,
  battLift: 0,
  subjectDim: 0,
  cameraFocus: 0,
  energy: 0,
  screenOn: 0,
}

export function computeFilmStates(p: number): FilmStates {
  const cameraFocus = ramplike(p, 0.635, 0.665, 0.705, 0.73)
  const chipLift = ramplike(p, 0.34, 0.37, 0.455, 0.485)
  const battLift = ramplike(p, 0.893, 0.902, 0.918, 0.926)

  // All x-ray windows close by 0.52 (end of rebuild) so the shell re-solidifies
  // over a home stack, not half-floating parts.
  const explodeXray = ramplike(p, 0.27, 0.32, 0.485, 0.515)
  // Wide enough to hold the cell-lift beat so the energy climax reads.
  const explodeBatt = ramplike(p, 0.885, 0.893, 0.905, 0.918)

  STATES.shellGhost = Math.min(
    1,
    ramplike(p, 0.25, 0.31, 0.44, 0.52) + ramplike(p, 0.875, 0.9, 0.905, 0.925),
  )
  // Glass + back part from the frame while the internals are on stage.
  STATES.shellSplit = ramplike(p, 0.29, 0.34, 0.47, 0.515)
  STATES.internalOpacity = Math.min(
    1,
    ramplike(p, 0.26, 0.31, 0.5, 0.518) + ramplike(p, 0.88, 0.9, 0.905, 0.93),
  )
  STATES.explodeXray = explodeXray
  STATES.explodeBatt = explodeBatt
  // Focus peaks with the dive into the cavity and fades only as the stack
  // repacks, so the macro reads as one deliberate held beat.
  STATES.chipFocus = ramplike(p, 0.36, 0.445, 0.49, 0.525)
  STATES.chipLift = chipLift
  STATES.battLift = battLift
  // The rest of the stack steps back while a subject owns the frame: chip die
  // and battery hero each dim their surroundings slightly.
  STATES.subjectDim = Math.min(
    1,
    ramplike(p, 0.39, 0.42, 0.46, 0.485) + ramplike(p, 0.893, 0.905, 0.92, 0.928),
  )
  STATES.cameraFocus = cameraFocus
  STATES.energy = ramplike(p, 0.885, 0.9, 0.91, 0.93)
  STATES.screenOn = ramplike(p, 0.03, 0.08, 1, 1)

  return STATES
}