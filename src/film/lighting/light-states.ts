/**
 * Per-act lighting design for the film.
 *
 * A single studio rig - key, fill, rim + counter-rim, a dedicated underside
 * bounce, an accent that moves to the subject, one interior glow with its own
 * color/position, a controlled rear rim and an optical pin for the camera
 * macro, plus an IBL environment - where every channel lerps toward the
 * current act's target each frame. The phone is always the most illuminated
 * object on a dark stage; the environment flat is studio-bright so the
 * titanium edges read clearly against the void. Rim and underside get explicit
 * per-act values so a dark act can never sink into black-on-black. Accent and
 * interior pins are aimed at the act's subject but parked at studio standoff
 * (decimetres, not millimetres): with physical inverse square falloff a
 * centimetre park would deliver thousands of times the key and clip the macro
 * acts to white, so each pin keeps its authored side and aim while its
 * distance is chosen so the delivered accent lands near two to six times the
 * key. Key / fill / rim carry their own per-act tint so the mood can turn
 * cool over the board or warm over the cell without touching the rest of the
 * rig up front.
 */

export interface StageLightState {
  /** Intensity of the IBL environment (reads on metal). */
  envIntensity: number
  /** Warm frontal key - the hero light. */
  key: number
  /** Key tint; warms the hero acts, cools the technical passes. */
  keyColor: string
  /** Cool edge-carrying fill from the opposite side. */
  fill: number
  /** Fill tint; the broad soft bounce that holds the camera-side shadows. */
  fillColor: string
  /** Contour rim behind the phone. */
  rim: number
  /** Rim tint; the mood counter to the key. */
  rimColor: string
  /** Counter-rim from the other side; keeps a hairline on the far edge. */
  rimR: number
  /** Dedicated underside / floor bounce so the bottom never vanishes. */
  under: number
  /** Moving accent that parks on the subject of the act. */
  accent: number
  /** Where the accent park sits, in film-world meters. */
  accentPosition: [number, number, number]
  accentColor: string
  /** Controlled rear rim that only reads while the rear faces the camera. */
  rearRim: number
  /** Optical pin that lands on the outer lens ring during the camera macro. */
  optic: number
  /** Where the optical pin sits, in film-world meters. */
  opticPosition: [number, number, number]
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
  envIntensity: 0.95,
  key: 1.15,
  keyColor: '#eef3ff',
  fill: 0.5,
  fillColor: '#9db4dd',
  rim: 1.35,
  rimColor: '#dfe8ff',
  rimR: 0.5,
  under: 0.22,
  accent: 0.2,
  accentPosition: [0, 0.1, 0.4],
  accentColor: '#7fb0ff',
  rearRim: 0,
  optic: 0,
  opticPosition: [0.03, 0.05, 0.006],
  interiorGlow: 0,
  interiorColor: '#7fb4ff',
  interiorPosition: [0, 0, 0],
  baseColor: '#05070d',
  topColor: '#0c1220',
}

/**
 * Accent subjects per act (film-world meters). Each pin is aimed at the act's
 * subject from the authored side (board from front-top, die from right-top,
 * lens island from the right, cell from the front, ai wash from the left) but
 * held at studio standoff so physical falloff delivers an accent, not a
 * clip: accent pins land near two to four times the key, interior glows near
 * four to six times from behind the stack, the optic sparkle near seven times
 * on the lens ring.
 */
export const STAGE_LIGHTING: Record<string, StageLightState> = {
  // Hero: clean three-quarter studio, slanted phone, material separation crisp.
  // IBL floor raised and the key made confident so titanium vs ceramic read;
  // the rim pulls back a touch so the near edge never clips.
  arrival: { envIntensity: 0.95, key: 1.1, keyColor: '#f2f7ff', fill: 0.48, fillColor: '#a9bfe4', rim: 1.45, rimColor: '#e2ecff', rimR: 0.45, under: 0.2, accent: 0.15, accentPosition: [-0.18, 0.08, 0.42], accentColor: '#7fb0ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#04070f', topColor: '#0d1322' },
  settle: { envIntensity: 0.92, key: 1.08, keyColor: '#f2f7ff', fill: 0.46, fillColor: '#a9bfe4', rim: 1.42, rimColor: '#e2ecff', rimR: 0.48, under: 0.21, accent: 0.2, accentPosition: [0, 0.08, 0.42], accentColor: '#7fb0ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#05070d', topColor: '#0d1524' },
  // Approach: closer to the front glass; the IBL holds its peak so the glass
  // catches a clean highlight, then hands off to the cool x-ray.
  approach: { envIntensity: 1.1, key: 1.28, keyColor: '#f2f7ff', fill: 0.52, fillColor: '#a9bfe4', rim: 1.28, rimColor: '#e2ecff', rimR: 0.55, under: 0.24, accent: 0.28, accentPosition: [0, 0.02, 0.34], accentColor: '#8fb8ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#060910', topColor: '#101c30' },
  // X-ray: quiet and slightly cool. Interior glow stays capped on the board;
  // both pins aim at the lifted board from the front-top (accent) and from
  // behind the stack (interior) at studio standoff, so the lower edge keeps
  // reading instead of clipping.
  xray: { envIntensity: 0.85, key: 0.55, keyColor: '#e6eefc', fill: 0.3, fillColor: '#9db4dd', rim: 0.9, rimColor: '#d6e6ff', rimR: 0.4, under: 0.26, accent: 1.0, accentPosition: [0.1, 0.5, 0.45], accentColor: '#5fa8ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 1.5, interiorColor: '#5fb2ff', interiorPosition: [0.02, 0.2, -0.5], baseColor: '#010407', topColor: '#050c18' },
  // Chip: a tighter amber accent on the A1 Ultra from the right-top, with the
  // interior glow behind and below the die; both at studio standoff so the
  // highlight keeps a shoulder that reads across the die edge, and the key
  // warms so the amber blends.
  chip: { envIntensity: 1.0, key: 1.25, keyColor: '#f5ecd8', fill: 0.55, fillColor: '#b6b3c4', rim: 1.15, rimColor: '#ffdfa6', rimR: 0.55, under: 0.24, accent: 1.3, accentPosition: [0.25, 0.35, 0.5], accentColor: '#ffd580', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0.6, interiorColor: '#ffb866', interiorPosition: [0.05, 0.0, -0.28], baseColor: '#070a14', topColor: '#141b30' },
  // Rebuild: the stack repacks and the hero rig returns; values step back from
  // the chip darkness without a jump.
  rebuild: { envIntensity: 1.05, key: 1.2, keyColor: '#f2f7ff', fill: 0.5, fillColor: '#a9bfe4', rim: 1.28, rimColor: '#e2ecff', rimR: 0.52, under: 0.22, accent: 0.35, accentPosition: [0.02, 0.03, 0.28], accentColor: '#7fb0ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#060810', topColor: '#0f1726' },
  // Camera: the phone turns its rear to the lens. A controlled rear rim traces
  // the housing edge as the camera approaches; the accent kisses the island
  // from the right at studio standoff and the optical pin sits off the ring
  // at sparkle distance so the falloff edge lands on the housing rim. Cool
  // tint keeps the optic read clinical.
  camera: { envIntensity: 1.15, key: 1.2, keyColor: '#e8f1ff', fill: 0.52, fillColor: '#9fb8e0', rim: 1.5, rimColor: '#d9e9ff', rimR: 0.7, under: 0.26, accent: 1.15, accentPosition: [0.15, 0.3, 0.45], accentColor: '#cfe0ff', rearRim: 0.8, optic: 0.5, opticPosition: [0.155, 0.282, -0.096], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#05070d', topColor: '#0d1728' },
  // Display: front and center; the screen carries itself, so the rig returns
  // to hero values and lets the panel own the light.
  display: { envIntensity: 0.95, key: 1.1, keyColor: '#f2f7ff', fill: 0.5, fillColor: '#a9bfe4', rim: 1.05, rimColor: '#e2ecff', rimR: 0.42, under: 0.2, accent: 0.3, accentPosition: [0, 0.02, 0.36], accentColor: '#93b5ea', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#070c14', topColor: '#101d2e' },
  storage: { envIntensity: 0.9, key: 1.0, keyColor: '#f2f7ff', fill: 0.42, fillColor: '#a9bfe4', rim: 1.1, rimColor: '#e2ecff', rimR: 0.45, under: 0.2, accent: 0.25, accentPosition: [-0.12, 0.01, 0.34], accentColor: '#7fb0ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#04070d', topColor: '#0a121e' },
  // Battery: calmer, slightly warm key with a cool rim running opposite so the
  // metallic cell edge tastes the contrast. Accent washes the cell face from
  // the front at studio standoff and the interior glow sits behind the cell
  // through its lift.
  battery: { envIntensity: 0.95, key: 0.9, keyColor: '#f6edd9', fill: 0.4, fillColor: '#aab4c8', rim: 1.3, rimColor: '#cfeaff', rimR: 0.5, under: 0.28, accent: 1.3, accentPosition: [0.05, -0.15, 0.55], accentColor: '#62e6c9', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 1.2, interiorColor: '#4fd6bb', interiorPosition: [0, -0.06, -0.44], baseColor: '#08130f', topColor: '#0e2019' },
  software: { envIntensity: 0.9, key: 1.05, keyColor: '#f2f7ff', fill: 0.45, fillColor: '#a9bfe4', rim: 1.05, rimColor: '#e2ecff', rimR: 0.42, under: 0.18, accent: 0.28, accentPosition: [0, 0, 0.36], accentColor: '#8fb4ec', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#050a14', topColor: '#0b1626' },
  ai: { envIntensity: 1.15, key: 1.15, keyColor: '#f2f7ff', fill: 0.52, fillColor: '#a9bfe4', rim: 1.3, rimColor: '#e2ecff', rimR: 0.52, under: 0.2, accent: 1.15, accentPosition: [-0.12, 0.05, 0.66], accentColor: '#b388ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#070614', topColor: '#140f28' },
  // Final: the strongest studio pass and the hero setup again; cleanest
  // silhouette at the top of the IBL band.
  final: { envIntensity: 1.2, key: 1.45, keyColor: '#f2f7ff', fill: 0.58, fillColor: '#a9bfe4', rim: 1.5, rimColor: '#e2ecff', rimR: 0.68, under: 0.24, accent: 0.4, accentPosition: [0.02, 0.1, 0.42], accentColor: '#9cc0ff', rearRim: 0, optic: 0, opticPosition: [0.03, 0.05, 0.006], interiorGlow: 0, interiorColor: '#7fb4ff', interiorPosition: [0, 0, 0], baseColor: '#05070d', topColor: '#101a2c' },
}