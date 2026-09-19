import type { ActId } from '../story'
import type { EditorialTier, SpecLine } from './primitives'
import {
  BATTERY,
  CAMERA_LENSES,
  CHIPSET,
  DIMENSIONS,
  DISPLAY,
  FRAME_MATERIAL,
  MEMORY,
  PERFORMANCE,
  STORAGE_OPTIONS,
} from '../../data/product'

const TOPS = PERFORMANCE.npu.hero.value
const CAM_MAIN = CAMERA_LENSES[0]
const CAM_ULTRA = CAMERA_LENSES[1]
const CAM_TELE = CAMERA_LENSES[2]
const CAM_FRONT = CAMERA_LENSES[3]

export interface RevealPlan {
  /** Act-local progress (0..1) at which each block starts to appear. */
  num?: number
  unit?: number
  title?: number
  note?: number
  rows?: number
  tiers?: number
  rule?: number
}

export type ChapterLayout =
  | 'wordmark'
  | 'tag'
  | 'stat'
  | 'display'
  | 'tiers'
  | 'inspect'
  | 'chiplead'
  | 'flank'
  | 'hierarchy'

export interface ChapterCopy {
  /** Short act name (used only for indexing / rails, never a kicker). */
  label: string
  /** Composition family dictating how the headline and numeral sit on screen. */
  layout: ChapterLayout
  title: string
  note?: string
  /** Primary hero numeral of the act. */
  num?: string
  /** Compact label that sits against the numeral. */
  numUnit?: string
  /** Small technical rows (label / value), instrument style. */
  rows?: SpecLine[]
  /** Ascending editorial tier list (storage capacities). */
  tiers?: EditorialTier[]
  /** Editorial chrome shown alongside the caption. */
  extra?: 'xray'
  /** When each block appears, relative to the act (defaults to ramp). */
  reveal?: RevealPlan
}

const TIERS: EditorialTier[] = STORAGE_OPTIONS.map((s) =>
  s.gb >= 1024 ? { num: '1', unit: 'TB' } : { num: String(s.gb), unit: 'GB' },
)

export const CHAPTERS: Record<ActId, ChapterCopy> = {
  arrival: {
    label: 'ARRIVAL',
    layout: 'wordmark',
    title: 'Aether One X.',
    note: 'Grade-5 titanium. Hand-glazed ceramic. One slab.',
    reveal: { title: 0.08, rule: 0.24, note: 0.5 },
  },
  settle: {
    label: 'INTENT',
    layout: 'tag',
    title: 'Built different.',
    note: 'One phone.',
    reveal: { title: 0.08, note: 0.5 },
  },
  approach: {
    label: 'FRAME',
    layout: 'stat',
    title: 'The frame.',
    num: String(DIMENSIONS.thicknessMm),
    numUnit: 'MM',
    rows: [
      { k: 'MATERIAL', v: FRAME_MATERIAL.toUpperCase() },
      { k: 'WEIGHT', v: `${DIMENSIONS.weightG} G` },
    ],
    note: 'Machined titanium. Slim by design.',
    reveal: { title: 0.1, rule: 0.2, num: 0.26, unit: 0.36, rows: 0.5, note: 0.68 },
  },
  xray: {
    label: 'X-RAY',
    layout: 'inspect',
    title: 'Look deeper.',
    note: 'Every One X hides a single, giant brain.',
    extra: 'xray',
    reveal: { title: 0.12, note: 0.5 },
  },
  chip: {
    label: 'SILICON',
    layout: 'chiplead',
    title: 'A1 Ultra.',
    note: `${TOPS} trillion ops at near no wattage.`,
    rows: [
      { k: 'PROCESS', v: `${CHIPSET.processNm} NM` },
      { k: 'CPU', v: `${CHIPSET.cpuCores} CORES` },
      { k: 'GPU', v: `${CHIPSET.gpuCores} CORES` },
      { k: 'NPU', v: `${CHIPSET.npuTops} TOPS` },
    ],
    reveal: { title: 0.1, rows: 0.4, note: 0.6 },
  },
  rebuild: {
    label: 'ASSEMBLY',
    layout: 'tag',
    title: 'Assembled to last.',
    note: 'Every layer placed by hand, then sealed.',
    reveal: { title: 0.12, note: 0.55 },
  },
  camera: {
    label: 'CAMERA',
    layout: 'flank',
    title: 'The camera.',
    num: String(CAM_MAIN.mp),
    numUnit: 'MP MAIN',
    rows: [
      { k: 'SENSOR', v: CAM_MAIN.sensor },
      { k: 'APERTURE', v: CAM_MAIN.aperture },
      { k: 'STABILISATION', v: CAM_MAIN.stabilization },
      { k: 'ULTRA-WIDE', v: CAM_ULTRA.spec },
      { k: 'TELEPHOTO', v: CAM_TELE.spec },
      { k: 'FRONT', v: CAM_FRONT.spec },
    ],
    note: 'Three sensors, one island.',
    reveal: { title: 0.08, rule: 0.2, num: 0.24, unit: 0.34, rows: 0.5, note: 0.72 },
  },
  display: {
    label: 'DISPLAY',
    layout: 'display',
    title: 'The display.',
    num: String(DISPLAY.refreshMax),
    numUnit: 'HZ ADAPTIVE',
    rows: [
      { k: 'PIXELS', v: DISPLAY.resolution },
      { k: 'PEAK', v: `${DISPLAY.peakNits} NITS` },
      { k: 'COLOR', v: `${DISPLAY.colorBits}-BIT HDR` },
    ],
    reveal: { title: 0.08, num: 0.2, unit: 0.3, rows: 0.5 },
  },
  storage: {
    label: 'STORAGE',
    layout: 'tiers',
    title: 'Capacity to match.',
    tiers: TIERS,
    note: 'UFS 4.1. Every tier, full speed.',
    reveal: { title: 0.08, tiers: 0.18, note: 0.7 },
  },
  battery: {
    label: 'POWER',
    layout: 'hierarchy',
    title: 'Power that lasts.',
    num: String(BATTERY.capacity),
    numUnit: 'MAH',
    rows: [
      { k: 'WIRED', v: `${BATTERY.wired} W` },
      { k: 'WIRELESS', v: `${BATTERY.wireless} W` },
      { k: 'REVERSE', v: `${BATTERY.reverse} W` },
    ],
    note: 'Recharged in minutes.',
    reveal: { title: 0.08, rule: 0.18, num: 0.22, unit: 0.32, rows: 0.48, note: 0.66 },
  },
  software: {
    label: 'OS',
    layout: 'tag',
    title: 'AetherOS.',
    note: 'Touch it. It moves with you.',
    reveal: { title: 0.1, note: 0.5 },
  },
  ai: {
    label: 'INTELLIGENCE',
    layout: 'stat',
    title: 'On-device smarts.',
    num: String(TOPS),
    numUnit: 'TOPS',
    rows: [
      { k: 'NEURAL ENGINE', v: 'DEDICATED NPU' },
      { k: 'PROCESS', v: `${CHIPSET.processNm} NM` },
      { k: 'MEMORY', v: `${MEMORY.ramGb} GB LPDDR5X` },
    ],
    note: 'Private. Local. No cloud required.',
    reveal: { title: 0.08, rule: 0.18, num: 0.22, unit: 0.32, rows: 0.48, note: 0.66 },
  },
  final: {
    label: 'FINAL',
    layout: 'wordmark',
    title: 'Aether One X.',
    note: 'Choose a finish. Then a capacity.',
    reveal: { title: 0.05, note: 0.2 },
  },
}