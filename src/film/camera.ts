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
/** Camera travel curves; built once at module load (pure math, no DOM). */
const POS_CURVE = new THREE.CatmullRomCurve3(POS_PTS, false, 'catmullrom', 0.5)
const TGT_CURVE = new THREE.CatmullRomCurve3(TGT_PTS, false, 'catmullrom', 0.5)

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

  // Responsive framing overrides the authored fov where keyframes set a fit.
  const fitA = a.fit ?? b.fit
  const fitB = b.fit ?? a.fit
  OUT.fit = fitA == null && fitB == null ? null : (fitA ?? 0) + ((fitB ?? 0) - (fitA ?? 0)) * t
  OUT.fovMax = (a.fovMax ?? b.fovMax ?? 52) + ((b.fovMax ?? a.fovMax ?? 52) - (a.fovMax ?? b.fovMax ?? 52)) * t

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

export function computeFilmStates(p: number): FilmStates {
  // All x-ray windows close by 0.52 (end of rebuild) so the shell re-solidifies
  // over a home stack, not half-floating parts.
  const explodeXray = ramplike(p, 0.27, 0.32, 0.485, 0.515)
  // Wide enough to hold the cell-lift beat so the energy climax reads.
  const explodeBatt = ramplike(p, 0.885, 0.893, 0.905, 0.918)
  return {
    shellGhost: Math.min(
      1,
      ramplike(p, 0.25, 0.31, 0.44, 0.52) + ramplike(p, 0.875, 0.9, 0.905, 0.925),
    ),
    // Glass + back part from the frame while the internals are on stage.
    shellSplit: ramplike(p, 0.29, 0.34, 0.47, 0.515),
    internalOpacity: Math.min(
      1,
      ramplike(p, 0.26, 0.31, 0.5, 0.518) + ramplike(p, 0.88, 0.9, 0.905, 0.93),
    ),
    explodeXray,
    explodeBatt,
    // Focus peaks with the dive into the cavity and fades only as the stack
    // repacks, so the macro reads as one deliberate held beat.
    chipFocus: ramplike(p, 0.36, 0.445, 0.49, 0.525),
    energy: ramplike(p, 0.885, 0.9, 0.91, 0.93),
    screenOn: ramplike(p, 0.03, 0.08, 1, 1),
  }
}