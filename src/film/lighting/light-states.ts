/**
 * Per-act lighting design for the film.
 *
 * A single studio rig - key, fill, rim + counter-rim, a dedicated underside
 * bounce, an accent that moves to the subject, one interior glow with its own
 * color/position, and an IBL environment - where every channel lerps toward
 * the current act's target each frame. The phone is always the most
 * illuminated object on a dark stage; the environment flat is studio-bright so
 * the titanium edges read clearly against the void. Rim and underside get
 * explicit per-act values so a dark act can never sink into black-on-black.
 */

export interface StageLightState {
  /** Intensity of the IBL environment (reads on metal). */
  envIntensity: number
  /** Warm frontal key - the hero light. */
  key: number
  /** Cool edge-carrying fill from the opposite side. */
  fill: number
  /** Contour rim behind the phone. */
  rim: number
  /** Counter-rim from the other side; keeps a hairline on the far edge. */
  rimR: number
  /** Dedicated underside / floor bounce so the bottom never vanishes. */
  under: number
  /** Moving accent that parks on the subject of the act. */
  accent: number
  /** Where the accent park sits, in film-world meters. */
  accentPosition: [number, number, number]
  accentColor: string
  /** Interior glow behind the internals (x-ray / energy). */
  interiorGlow: number
  /** Interior glow color (teal at the energy climax, amber over the die). */
  interiorColor: string
  /** Where the interior glow sits in film-world meters. */
  interiorPosition: [number, number, number]
  /** Background gradient: neutral deep-space hue. */
  baseColor: string
  topColor: string
}

export const DEFAULT_STAGE: StageLightState = {
  envIntensity: 0.9,
  key: 1.1,
  fill: 0.45,
  rim: 1.4,
  rimR: 0.5,
  under: 0.22,
  accent: 0.2,
  accentPosition: [0, 0.1, 0.4],
  accentColor: '#7fb0ff',
  interiorGlow: 0,
  interiorColor: '#7fb4ff',
  interiorPosition: [0, 0, 0],
  baseColor: '#05070d',
  topColor: '#0c1220',
}

/**
 * Accent subjects per act (film-world meters, phone near the origin):
 * xray = main board, chip = A1 Ultra die, camera = lens island with the accent
 * parked toward the camera so the glass picks a specular dot, battery = cell.
 */
export const STAGE_LIGHTING: Record<string, StageLightState> = {
  // #1 anti-over-darkening: lift the IBL floor (0.55->0.75) and fill (0.3->0.38)
  // so the arrival silhouette separates from the background instead of sinking.
  arrival: { envIntensity: 0.75, key: 0.7, fill: 0.38, rim: 1.55, rimR: 0.4, under: 0.18, accent: 0.15, accentPosition: [-0.18, 0.08, 0.42], accentColor: '#7fb0ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#030409', topColor: '#0a0e16' },
  settle: { envIntensity: 0.85, key: 1.05, fill: 0.42, rim: 1.5, rimR: 0.48, under: 0.2, accent: 0.2, accentPosition: [0, 0.08, 0.42], accentColor: '#7fb0ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#05070d', topColor: '#0d1524' },
  approach: { envIntensity: 1.15, key: 1.35, fill: 0.5, rim: 1.3, rimR: 0.55, under: 0.24, accent: 0.28, accentPosition: [0, 0.02, 0.34], accentColor: '#8fb8ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#060910', topColor: '#101c30' },
  // #1 x-ray must not go black-on-black: raise the IBL floor (0.7->0.85) and the
  // underside (0.2->0.26) so the board's lower edge reads; accent 1.2->1.0 stops
  // the highlight clipping the internals while the interior glow stays capped 1.5.
  xray: { envIntensity: 0.85, key: 0.55, fill: 0.3, rim: 0.85, rimR: 0.38, under: 0.26, accent: 1.0, accentPosition: [0.008, 0.05, 0.012], accentColor: '#5fa8ff', interiorGlow: 1.5, interiorColor: '#5fb2ff', interiorPosition: [0, 0.02, 0], baseColor: '#010308', topColor: '#050b16' },
  // #2 chip: fill 0.55->0.62 so the die's surrounding board reads rather than
  // collapsing to black under the strong amber accent (itself kept at 1.6).
  chip: { envIntensity: 1.55, key: 1.55, fill: 0.62, rim: 1.1, rimR: 0.62, under: 0.26, accent: 1.6, accentPosition: [0.011, 0.052, 0.02], accentColor: '#ffd27f', interiorGlow: 0.6, interiorColor: '#ffb866', interiorPosition: [0.011, 0.052, 0.008], baseColor: '#070a14', topColor: '#141b30' },
  rebuild: { envIntensity: 1.15, key: 1.3, fill: 0.5, rim: 1.3, rimR: 0.55, under: 0.24, accent: 0.4, accentPosition: [0.02, 0.03, 0.28], accentColor: '#7fb0ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#060810', topColor: '#0f1726' },
  // #2 camera: accent tightens onto the lens rim (0.95->1.15, pulled toward the
  // island edge so the glass catches a specular dot, warmer #cfe0ff).
  camera: { envIntensity: 1.4, key: 1.25, fill: 0.55, rim: 1.7, rimR: 0.65, under: 0.28, accent: 1.15, accentPosition: [0.008, 0.05, 0.035], accentColor: '#cfe0ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#05070d', topColor: '#0b1424' },
  display: { envIntensity: 0.95, key: 1.1, fill: 0.5, rim: 1.05, rimR: 0.42, under: 0.2, accent: 0.35, accentPosition: [0, 0.02, 0.36], accentColor: '#93b5ea', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#070c14', topColor: '#101d2e' },
  storage: { envIntensity: 0.85, key: 0.95, fill: 0.4, rim: 1.15, rimR: 0.45, under: 0.2, accent: 0.25, accentPosition: [-0.12, 0.01, 0.34], accentColor: '#7fb0ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#04070d', topColor: '#0a121e' },
  // #1/#4 battery: IBL floor 0.95->1.05 so the teal cell never sinks into the
  // void, and the grade steps cooler (#061016/#0c1c22) so the #14d8b4 glow
  // separates from the background instead of blending into it.
  battery: { envIntensity: 1.05, key: 0.8, fill: 0.42, rim: 1.25, rimR: 0.5, under: 0.28, accent: 1.35, accentPosition: [0.12, 0.008, 0.03], accentColor: '#62e6c9', interiorGlow: 1.2, interiorColor: '#4fd6bb', interiorPosition: [0.12, 0, 0.002], baseColor: '#061016', topColor: '#0c1c22' },
  software: { envIntensity: 0.9, key: 1.05, fill: 0.45, rim: 1.05, rimR: 0.42, under: 0.18, accent: 0.28, accentPosition: [0, 0, 0.36], accentColor: '#8fb4ec', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#050a14', topColor: '#0b1626' },
  ai: { envIntensity: 1.25, key: 1.15, fill: 0.55, rim: 1.35, rimR: 0.55, under: 0.22, accent: 1.15, accentPosition: [-0.055, 0, 0.3], accentColor: '#b388ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#070614', topColor: '#140f28' },
  final: { envIntensity: 1.45, key: 1.5, fill: 0.6, rim: 1.55, rimR: 0.7, under: 0.26, accent: 0.45, accentPosition: [0.02, 0.1, 0.42], accentColor: '#8fb8ff', interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#05070d', topColor: '#101a2c' },
}