import type { ActId } from '../story'
import type { SpecLine } from './primitives'

export interface ChapterCopy {
  label: string
  title: string
  note?: string
  lines?: SpecLine[]
  metric?: string
  metricSub?: string
  /** Editorial chrome shown alongside the caption. */
  extra?: 'xray'
}

export const CHAPTERS: Record<ActId, ChapterCopy> = {
  arrival: {
    label: 'ARRIVAL',
    title: 'Aether One X.',
    note: 'Titanium. Ceramic. One slab.',
  },
  settle: {
    label: 'INTENT',
    title: 'Built different.',
    note: 'One phone. Nothing to hide.',
  },
  approach: {
    label: 'FRAME',
    title: 'The frame.',
    note: 'Grade-5 titanium. 7.8 mm slim. 198 grams.',
  },
  xray: {
    label: 'X-RAY',
    title: 'Look deeper.',
    note: 'Every One X hides a single, giant brain.',
    extra: 'xray',
  },
  chip: {
    label: 'SILICON',
    title: 'A1 Ultra.',
    note: 'Fastest chip we have ever made. 30 trillion ops at near no wattage.',
    metric: 'A1',
    metricSub: 'THE AETHER A1 ULTRA',
  },
  rebuild: {
    label: 'ASSEMBLY',
    title: 'Assembled to last.',
    note: 'Every layer placed by hand, then sealed.',
  },
  camera: {
    label: 'CAMERA',
    title: 'The camera.',
    note: 'Three sensors, one island. No bump.',
    lines: [
      { k: 'MAIN', v: '50 MP' },
      { k: 'ULTRA', v: '48 MP' },
      { k: 'TELE', v: '50 MP' },
      { k: 'ZOOM', v: '5X OPTICAL' },
    ],
    metric: '50',
    metricSub: 'MP MAIN SENSOR',
  },
  display: {
    label: 'DISPLAY',
    title: 'The display.',
    note: '3200 x 1440. 1 to 144 Hz.',
    metric: '144',
    metricSub: 'HZ, ALL THE TIME',
  },
  storage: {
    label: 'STORAGE',
    title: 'Storage to match.',
    note: 'Everything you keep, right here.',
    lines: [
      { k: 'BASE', v: '256 GB' },
      { k: 'MAX', v: '1 TB' },
      { k: 'TRANSFER', v: 'AETHER WIRE' },
    ],
  },
  battery: {
    label: 'POWER',
    title: 'Power that lasts.',
    note: 'All day. Recharged in minutes.',
    metric: '30',
    metricSub: 'MIN TO 50%',
  },
  software: {
    label: 'OS',
    title: 'AetherOS.',
    note: 'Touch it. It moves with you.',
  },
  ai: {
    label: 'INTELLIGENCE',
    title: 'On-device smarts.',
    note: 'Private. Local. No cloud required.',
    metric: '18',
    metricSub: 'ON-DEVICE TOPS',
  },
  final: {
    label: 'FINAL',
    title: 'Aether One X.',
    note: 'From $999. Choose your finish.',
  },
}