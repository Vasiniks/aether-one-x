import type { ActId } from '../story'
import type { SpecLine } from './primitives'
import { BATTERY, PERFORMANCE } from '../../data/product'

const TOPS = String(PERFORMANCE.npu.hero.value)

export interface RevealPlan {
  /** Act-local progress (0..1) at which each block starts to appear. */
  num?: number
  unit?: number
  title?: number
  note?: number
  tech?: number
}

export interface ChapterCopy {
  /** Short act name (used only for indexing / rails, never a kicker). */
  label: string
  title: string
  note?: string
  /** Primary hero numeral of the act. */
  num?: string
  /** Uppercase label that sits beside the numeral. */
  unit?: string
  /** Small technical rows (label <> value). */
  tech?: SpecLine[]
  /** Editorial chrome shown alongside the caption. */
  extra?: 'xray'
  /** When each block appears, relative to the act (defaults to ramp). */
  reveal?: RevealPlan
}

export const CHAPTERS: Record<ActId, ChapterCopy> = {
  arrival: {
    label: 'ARRIVAL',
    title: 'Aether One X.',
    note: 'Grade-5 titanium. Hand-glazed ceramic. One slab.',
    reveal: { title: 0.1, note: 0.4 },
  },
  settle: {
    label: 'INTENT',
    title: 'Built different.',
    note: 'One phone.',
    reveal: { title: 0.08, note: 0.45 },
  },
  approach: {
    label: 'FRAME',
    title: 'The frame.',
    note: 'Machined titanium. 7.8 mm slim.',
    tech: [
      { k: 'MATERIAL', v: 'GRADE-5 TI' },
      { k: 'PROFILE', v: '7.8 MM' },
      { k: 'WEIGHT', v: '198 G' },
    ],
    reveal: { title: 0.15, tech: 0.5, note: 0.72 },
  },
  xray: {
    label: 'X-RAY',
    title: 'Look deeper.',
    note: 'Every One X hides a single, giant brain.',
    extra: 'xray',
    reveal: { title: 0.12, note: 0.5 },
  },
  chip: {
    label: 'SILICON',
    title: 'A1 Ultra.',
    note: `${TOPS} trillion ops at near no wattage.`,
    num: 'A1',
    unit: 'AETHER A1 ULTRA',
    tech: [
      { k: 'PROCESS', v: '3 NM' },
      { k: 'CPU', v: '8 CORE' },
      { k: 'GPU', v: '14 CORE' },
      { k: 'NPU', v: `${TOPS} TOPS` },
    ],
    reveal: { num: 0.5, unit: 0.62, tech: 0.78, note: 0.78 },
  },
  rebuild: {
    label: 'ASSEMBLY',
    title: 'Assembled to last.',
    note: 'Every layer placed by hand, then sealed.',
    reveal: { title: 0.12, note: 0.55 },
  },
  camera: {
    label: 'CAMERA',
    title: 'The camera.',
    note: 'Three sensors, one island.',
    num: '50',
    unit: 'MP MAIN',
    tech: [
      { k: 'SENSOR', v: '1/1.3"' },
      { k: 'APERTURE', v: 'F/1.6' },
      { k: 'STABILISATION', v: 'OIS' },
      { k: 'ULTRA', v: '48 MP' },
      { k: 'TELE', v: '5X OPTICAL' },
    ],
    reveal: { title: 0.1, num: 0.3, unit: 0.45, tech: 0.6, note: 0.72 },
  },
  display: {
    label: 'DISPLAY',
    title: 'The display.',
    note: '6.7 inch. 3200 x 1440. 1 to 144 Hz.',
    num: '144',
    unit: 'HZ ADAPTIVE',
    tech: [
      { k: 'PEAK', v: '2800 NITS' },
      { k: 'COLOUR', v: '10-BIT HDR' },
      { k: 'PWM', v: '2160 HZ' },
    ],
    reveal: { title: 0.1, num: 0.3, unit: 0.42, tech: 0.55, note: 0.62 },
  },
  storage: {
    label: 'STORAGE',
    title: 'Capacity to match.',
    note: '256 to 1 TB. UFS 4.1.',
    tech: [
      { k: 'BASE', v: '256 GB' },
      { k: 'SWEET SPOT', v: '512 GB' },
      { k: 'MAX', v: '1 TB' },
    ],
    reveal: { title: 0.1, tech: 0.25, note: 0.7 },
  },
  battery: {
    label: 'POWER',
    title: 'Power that lasts.',
    note: '5200 mAh. All day. Recharged in minutes.',
    num: String(BATTERY.charge50Min),
    unit: 'MIN TO 50%',
    tech: [
      { k: 'WIRED', v: '100 W' },
      { k: 'WIRELESS', v: '40 W' },
      { k: 'REVERSE', v: '15 W' },
    ],
    reveal: { title: 0.1, num: 0.2, unit: 0.34, tech: 0.48, note: 0.62 },
  },
  software: {
    label: 'OS',
    title: 'AetherOS.',
    note: 'Touch it. It moves with you.',
    reveal: { title: 0.1, note: 0.5 },
  },
  ai: {
    label: 'INTELLIGENCE',
    title: 'On-device smarts.',
    note: 'Private. Local. No cloud required.',
    num: TOPS,
    unit: 'TOPS NPU',
    reveal: { title: 0.1, num: 0.28, unit: 0.4, note: 0.55 },
  },
  final: {
    label: 'FINAL',
    title: 'Aether One X.',
    note: 'Choose a finish. Then a capacity.',
    reveal: { title: 0.05, note: 0.2 },
  },
}