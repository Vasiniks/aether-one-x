/**
 * Responsive framing for the product film.
 *
 * The authored keyframes describe the phone's pose and the camera's world
 * path, but the *frame* still has to survive every monitor. Rather than a
 * constant phone scale, each hero keyframe carries a `fit` target - the share
 * of the viewport height the phone should occupy. This module turns that
 * target into a vertical FOV that also guarantees the phone's horizontal span
 * never leaves the frame, so the same composition holds on a 13" laptop, a
 * 5K desktop and an ultrawide in equal measure.
 *
 * Ultrawides are special: the phone reads small and centered with dead space
 * on both sides when framed like a 16:9 monitor. Here the phone is composed
 * larger (see `formatFit`) and (optionally) offset into the horizontal room
 * (see `frameOffset`) so the open space becomes the caption zone instead of
 * a sea of black.
 */

/** Physical bounds of the Aether One X body (meters). */
export const PHONE_H = 0.1596
export const PHONE_W = 0.0768
export const PHONE_T = 0.0078

/** Vertical silhouette height of the phone at its current pose. */
export function effectiveHeight(scale: number, rx: number): number {
  return scale * (PHONE_H * Math.cos(rx) + PHONE_T * Math.sin(rx))
}

/** Horizontal silhouette width of the phone at its current pose. */
export function effectiveWidth(scale: number, ry: number): number {
  return scale * (Math.abs(PHONE_W * Math.cos(ry)) + PHONE_T * Math.abs(Math.sin(ry)))
}

export interface FitOptions {
  /** Target: the phone should fill this share of the viewport height. */
  fit: number
  /** Camera distance from eye to target (meters). */
  distance: number
  /** Viewport aspect ratio (width / height). */
  aspect: number
  /** Phone pose + scale at this sample. */
  scale: number
  rx: number
  ry: number
  /**
   * Author frame so nothing ever clips horizontally (0..1 margin).
   * When omitted the default is 0.86 on standard screens and tightens
   * smoothly toward 0.78 on ultrawides so the phone can use more of the
   * wide frame. Pass explicitly to override.
   */
  horizontalMargin?: number
  /** Off-center world offset (x, meters) folded into the width guard. */
  px?: number
  minFov?: number
  maxFov?: number
}

/**
 * Tier policy - smooth linear interpolation between aspect breakpoints.
 *
 * The authored `fit` is a share of viewport height, but the composition has
 * to survive every monitor. Monotone in aspect, so no tier boundary jumps.
 *
 *   aspect ≥ 3.50 → 1.16  32:9 super-ultrawide: hero fills the drum
 *   aspect ≥ 2.40 → 1.12  21:9 ultrawide: phone reads larger, fits the wide frame
 *   aspect ≥ 1.78 → 1.00  16:9 desktop: authored
 *   aspect ≥ 1.20 → 0.95  tablets / small desktops
 *   aspect ≥ 0.75 → 0.90  portrait-ish phones
 *   aspect  < 0.75 → 0.82 very tall/narrow: chrome + caption clearance
 */
export function formatFit(aspect: number, fit: number): number {
  // Descending by aspect key. The first key an aspect satisfies is the lower
  // bound of its band; the previous entry is the upper bound.
  const tiers: ReadonlyArray<{ aspect: number; tier: number }> = [
    { aspect: 3.5, tier: 1.16 },
    { aspect: 2.4, tier: 1.12 },
    { aspect: 1.78, tier: 1.0 },
    { aspect: 1.2, tier: 0.95 },
    { aspect: 0.75, tier: 0.9 },
  ]

  for (let i = 0; i < tiers.length; i++) {
    const lower = tiers[i]
    if (aspect >= lower.aspect) {
      // At or above the top tier - flat.
      if (i === 0) return fit * lower.tier
      // Interpolate inside the band [lower.aspect, upper.aspect).
      const upper = tiers[i - 1]
      const t = Math.min(1, Math.max(0, (aspect - lower.aspect) / (upper.aspect - lower.aspect)))
      return fit * (lower.tier + (upper.tier - lower.tier) * t)
    }
  }

  // Below the lowest tier - flat floor.
  return fit * 0.82
}

/**
 * Vertical FOV (degrees) that frames the phone to `fit` of the viewport, while
 * keeping its horizontal span inside the horizontal margin of the frame width.
 * Whichever axis is tighter wins, and `formatFit` warms the fit target per
 * aspect so the same intent holds on every format.
 */
export function fitFov(options: FitOptions): number {
  const {
    fit,
    distance,
    aspect,
    scale,
    rx,
    ry,
    minFov = 10,
    maxFov = 52,
  } = options

  // Horizontal margin default: tightens on ultrawides so the phone occupies
  // more of the wide frame. Continuous at 1.9, so nothing jumps.
  const horizontalMargin =
    options.horizontalMargin ??
    Math.min(0.86, Math.max(0.78, 0.86 - Math.max(0, aspect - 1.9) * 0.05))

  const eh = effectiveHeight(scale, rx)
  const ew = effectiveWidth(scale, ry)
  // Off-center compositions consume horizontal angle too; fold |px| (meters,
  // same world scale as the phone half-width) into the width guard so a
  // shifted frame can never leave the visible area. On ultrawides the large
  // `aspect` in the denominator keeps this guard from fighting the vertical
  // intent, so the offset is effectively free.
  const offsetSpan = options.px ?? 0

  // Vertical FOV that fills `fit` of the height.
  const tanV = eh / (2 * distance * Math.max(formatFit(aspect, fit), 0.05))
  // Vertical FOV at which the width (plus the off-center shift) fits inside
  // the (fairly) wide frame.
  const tanH = (ew * 0.5 + Math.abs(offsetSpan)) / (distance * Math.max(aspect, 0.3) * horizontalMargin)

  const half = Math.max(tanV, tanH)
  const fov = (2 * Math.atan(half) * 180) / Math.PI
  return Math.min(maxFov, Math.max(minFov, fov))
}

/**
 * Screen-space bias multiplier for off-center compositions.
 *
 * On narrow screens it clamps hard so the phone never drifts off-canvas and
 * captions/secondary content never collide with vertical chrome. On ultrawides
 * (aspect > 1.9) the wide frame has horizontal room to spare, so an off-center
 * composition toward the open space is never clamped away - it is gently
 * *emphasized* instead (fitFov's width guard still caps any shift). This goes
 * with `frameOffset`, which picks the default side and scale of that shift.
 */
export function centerBias(aspect: number, axis: 'x' | 'y'): number {
  const limit = axis === 'x' ? 1.5 : 1.1
  const base = Math.min(1, Math.max(0.25, aspect / limit))
  if (axis === 'x' && aspect > 1.9) {
    const t = Math.min(1, (aspect - 1.9) / (3.5 - 1.9))
    return base + (1.25 - base) * t
  }
  return base
}

/**
 * Where the phone sits horizontally - a world-space x-offset hint at the
 * phone's depth, in meters, compatible with `fitFov`'s `px` (positive = right,
 * negative = left).
 *
 * Ultrawides have horizontal room the composition should *use* instead of
 * dead-centering: this returns a deliberate offset so the caption/anchored
 * text lands in the open space. Narrow screens return 0 so the phone stays
 * centered and captions/secondary content never collide.
 *
 * Pass `authoredPx` to reuse an authored offset: it is shifted further into
 * the open space on ultrawides (scaled up within the band budget) and hard
 * clamped on narrow screens.
 *
 * Offsets stay inside the frame-safe budget for every viewport; `centerBias`
 * can further clamp if a composition also needs to survive a resized window.
 *
 * @param aspect     Viewport width / height.
 * @param authoredPx Optional author world-space offset (meters).
 */
export function frameOffset(aspect: number, authoredPx?: number): number {
  // Budget per band, in meters at the phone's depth.
  if (aspect >= 2.6) {
    const budget = 0.1
    return authoredPx === undefined ? 0.085 : Math.max(-budget, Math.min(budget, authoredPx * 1.2))
  }
  if (aspect >= 1.9) {
    const budget = 0.08
    if (authoredPx === undefined) {
      // Ramp the default shift from 0 at 1.9 to 0.07 at ~3.0.
      return 0.07 * Math.min(1, (aspect - 1.9) / (3.0 - 1.9))
    }
    return Math.max(-budget, Math.min(budget, authoredPx * 1.2))
  }
  if (aspect >= 1.2) {
    // Standard desktop / tablet landscape: subtle nudge only.
    const budget = 0.012
    if (authoredPx === undefined) return 0
    return Math.max(-budget, Math.min(budget, authoredPx))
  }
  // Narrow phones: keep it centered - no collision room.
  return 0
}

// perf: cheap - pure arithmetic, no allocations.

/**
 * Frustum floor for the authored macro shots on narrow viewports.
 *
 * Desktop keeps its authored FOV (the tight lens / die / cell macro was tuned
 * against a 3:2 frame), but a portrait phone is ~half as wide: at the same FOV
 * the camera module and battery physically overrun the horizontal frame. When
 * the aspect drops below 0.8 this widens the lens just enough that the subject
 * half-width sits inside a comfortable horizontal margin - the module reads
 * huge and fully in frame instead of clipped, and the composer is explicit
 * about which subject each window protects.
 *
 * Regions are side-by-side in progress, so at most one fires per sample.
 */
const MACRO_REGIONS: ReadonlyArray<{ start: number; end: number; half: number }> = [
  // Chip macro: the A1 Ultra package (0.011) plus a little board context.
  { start: 0.39, end: 0.47, half: 0.009 },
  // Camera macro: the island (0.036) plus the optical spread during the
  // explode, so no element ever leaves the frame.
  { start: 0.62, end: 0.72, half: 0.026 },
  // Battery climax: the cell reads edge-on, protect its half width too.
  { start: 0.895, end: 0.925, half: 0.017 },
]

/** Minimum vertical FOV (degrees) that keeps a macro subject fully framed. */
export function macroFloorFov(p: number, distance: number, aspect: number): number {
  for (const region of MACRO_REGIONS) {
    if (p >= region.start && p <= region.end) {
      const denom = distance * Math.max(aspect, 0.35) * 0.8
      if (denom <= 0) return 0
      return Math.min(85, (2 * Math.atan(region.half / denom) * 180) / Math.PI)
    }
  }
  return 0
}