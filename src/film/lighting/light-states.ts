/**
 * Per-act lighting design for the film.
 *
 * A single studio rig - key, fill, rim, an accent that moves to the subject,
 * one interior glow, and an IBL environment - where every channel lerps
 * toward the current act's target each frame. The phone is always the most
 * illuminated object on a dark stage; the environment flat is studio-bright
 * so the titanium edges read clearly against the void.
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
  /** Moving accent that parks on the subject of the act. */
  accent: number
  /** Where the accent park sits, in film-world meters. */
  accentPosition: [number, number, number]
  accentColor: string
  /** Interior glow behind the internals (x-ray / energy). */
  interiorGlow: number
  /** Background gradient: neutral deep-space hue. */
  baseColor: string
  topColor: string
}

export const DEFAULT_STAGE: StageLightState = {
  envIntensity: 0.9,
  key: 1.1,
  fill: 0.45,
  rim: 1.4,
  accent: 0.2,
  accentPosition: [0, 0.1, 0.4],
  accentColor: '#7fb0ff',
  interiorGlow: 0,
  baseColor: '#05070d',
  topColor: '#0c1220',
}

export const STAGE_LIGHTING: Record<string, StageLightState> = {
  arrival: { envIntensity: 0.55, key: 0.7, fill: 0.3, rim: 1.7, accent: 0.15, accentPosition: [-0.2, 0.12, 0.4], accentColor: '#7fb0ff', interiorGlow: 0, baseColor: '#030409', topColor: '#0a0e16' },
  settle: { envIntensity: 0.85, key: 1.05, fill: 0.42, rim: 1.5, accent: 0.2, accentPosition: [0, 0.1, 0.4], accentColor: '#7fb0ff', interiorGlow: 0, baseColor: '#05070d', topColor: '#0d1524' },
  approach: { envIntensity: 1.15, key: 1.35, fill: 0.5, rim: 1.35, accent: 0.25, accentPosition: [0.04, 0.08, 0.35], accentColor: '#8fb8ff', interiorGlow: 0, baseColor: '#060910', topColor: '#101c30' },
  xray: { envIntensity: 0.5, key: 0.48, fill: 0.22, rim: 0.6, accent: 1.15, accentPosition: [0, 0, 0.18], accentColor: '#5fa8ff', interiorGlow: 2.4, baseColor: '#010308', topColor: '#050b16' },
  chip: { envIntensity: 1.5, key: 1.5, fill: 0.55, rim: 1.15, accent: 1.6, accentPosition: [0.014, 0.055, 0.03], accentColor: '#ffd27f', interiorGlow: 0.9, baseColor: '#070a14', topColor: '#141b30' },
  rebuild: { envIntensity: 1.15, key: 1.3, fill: 0.5, rim: 1.35, accent: 0.35, accentPosition: [0.05, -0.02, 0.3], accentColor: '#7fb0ff', interiorGlow: 0, baseColor: '#060810', topColor: '#0f1726' },
  camera: { envIntensity: 1.35, key: 1.2, fill: 0.55, rim: 1.65, accent: 1.3, accentPosition: [-0.023, 0.05, -0.06], accentColor: '#6ab6ff', interiorGlow: 0, baseColor: '#05070d', topColor: '#0b1424' },
  display: { envIntensity: 0.95, key: 1.05, fill: 0.5, rim: 1.1, accent: 0.3, accentPosition: [0, 0.02, 0.38], accentColor: '#93b5ea', interiorGlow: 0, baseColor: '#070c14', topColor: '#101d2e' },
  storage: { envIntensity: 0.85, key: 0.95, fill: 0.4, rim: 1.2, accent: 0.2, accentPosition: [0.15, -0.02, 0.3], accentColor: '#7fb0ff', interiorGlow: 0, baseColor: '#04070d', topColor: '#0a121e' },
  battery: { envIntensity: 0.7, key: 0.6, fill: 0.3, rim: 0.95, accent: 1.5, accentPosition: [-0.01, -0.045, 0.12], accentColor: '#59d9c4', interiorGlow: 1.0, baseColor: '#040a10', topColor: '#0a1820' },
  software: { envIntensity: 0.9, key: 1.0, fill: 0.45, rim: 1.1, accent: 0.25, accentPosition: [0, 0, 0.38], accentColor: '#8fb4ec', interiorGlow: 0, baseColor: '#050a14', topColor: '#0b1626' },
  ai: { envIntensity: 1.25, key: 1.1, fill: 0.55, rim: 1.4, accent: 1.1, accentPosition: [0.05, 0, 0.3], accentColor: '#b388ff', interiorGlow: 0, baseColor: '#070614', topColor: '#140f28' },
  final: { envIntensity: 1.45, key: 1.45, fill: 0.6, rim: 1.55, accent: 0.4, accentPosition: [0, 0.1, 0.42], accentColor: '#8fb8ff', interiorGlow: 0, baseColor: '#05070d', topColor: '#101a2c' },
}