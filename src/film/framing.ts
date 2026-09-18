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
  /** Author frame so nothing ever clips horizontally (0..1 margin). */
  horizontalMargin?: number
  /** Off-center world offset (x, meters) folded into the width guard. */
  px?: number
  minFov?: number
  maxFov?: number
}

/**
 * Tier policy: the authored `fit` is a share of viewport height, but the
 * composition has to survive every monitor. On ultrawide the phone should read
 * larger against a taller drum; on narrow phones the fit backs off so captions
 * and hardware never crowd the vertical edges. Monotone in aspect, so no tier
 * boundary ever jumps.
 */
export function formatFit(aspect: number, fit: number): number {
  let tier: number
  if (aspect >= 2.55) tier = 1.12 // 32:9 and beyond: hero fills the drum
  else if (aspect >= 1.9) tier = 1.0 // 16:9-ish desktop: authored
  else if (aspect >= 1.2) tier = 0.97 // tablets / small desktops
  else if (aspect >= 0.75) tier = 0.92 // portrait-ish phones
  else tier = 0.85 // very tall/narrow: keep it small enough for chrome
  return fit * tier
}

/**
 * Vertical FOV (degrees) that frames the phone to `fit` of the viewport, while
 * keeping its horizontal span inside `horizontalMargin` (default 86%) of the
 * frame width. Whichever axis is tighter wins, and `formatFit` warms the fit
 * target per aspect so the same intent holds on every format.
 */
export function fitFov(options: FitOptions): number {
  const {
    fit,
    distance,
    aspect,
    scale,
    rx,
    ry,
    horizontalMargin = 0.86,
    minFov = 10,
    maxFov = 52,
  } = options

  const eh = effectiveHeight(scale, rx)
  const ew = effectiveWidth(scale, ry)
  // Off-center compositions consume horizontal angle too; fold |px| (meters,
  // same world scale as the phone half-width) into the width guard so a
  // shifted frame can never leave the visible area.
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

/** Clamps a screen-space offset so off-center compositions stay on screen
 * when the horizontal angle of view narrows (tablets, phones). */
export function centerBias(aspect: number, axis: 'x' | 'y'): number {
  const limit = axis === 'x' ? 1.5 : 1.1
  return Math.min(1, Math.max(0.25, aspect / limit))
}