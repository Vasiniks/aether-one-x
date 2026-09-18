export type FinishId = 'obsidian' | 'titanium' | 'glacier'

export interface Finish {
  id: FinishId
  name: string
  tagline: string
  /** Editorial one-liner shown under the name in the configurator. */
  description: string
  /** Rear-panel texture rendered as a local SVG image. */
  image: string
  /** CSS gradient used as the swatch chip in the UI. */
  swatch: string
  /** CSS gradient used for the titanium frame surrounding the phone. */
  frame: string
}

export const FINISHES: Finish[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    tagline: 'Near-black. Quietly dominant.',
    description: 'A deep volcanic black with a soft mirrored sheen. The closest thing to invisible, without disappearing.',
    image: '/images/finishes/obsidian.svg',
    swatch: 'linear-gradient(145deg,#43464e 0%,#0b0b0e 55%,#26282f 100%)',
    frame: 'linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0.05) 45%, #5a5e68)',
  },
  {
    id: 'titanium',
    name: 'Titanium',
    tagline: 'Raw brushed metal, warm and precise.',
    description: 'Grade-5 titanium machined to a hand-brushed finish. Each one arrives with its own grain.',
    image: '/images/finishes/titanium.svg',
    swatch: 'linear-gradient(145deg,#ffffff 0%,#9ba0ab 45%,#3f424b 100%)',
    frame: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1) 45%, #9297a1)',
  },
  {
    id: 'glacier',
    name: 'Glacier',
    tagline: 'A pale, cold finish drawn from ice.',
    description: 'Cloud-pale ceramic with an ice-blue undertone. Cool to the touch, brighter than the light around it.',
    image: '/images/finishes/glacier.svg',
    swatch: 'linear-gradient(145deg,#ffffff 0%,#d4deee 55%,#8fa6cc 100%)',
    frame: 'linear-gradient(160deg, rgba(255,255,255,0.75), rgba(255,255,255,0.2) 45%, #b9c6dc)',
  },
]

export const DEFAULT_FINISH: FinishId = 'obsidian'

export interface StorageOption {
  label: string
  gb: number
  price: number
}

export const STORAGE_OPTIONS: StorageOption[] = [
  { label: '256 GB', gb: 256, price: 999 },
  { label: '512 GB', gb: 512, price: 1199 },
  { label: '1 TB', gb: 1024, price: 1399 },
]

export const DEFAULT_STORAGE_GB = 512

export interface CameraLens {
  id: string
  label: string
  zoom: string
  mp: number
  detail: string
  /** Compact spec line shown in the film's camera beat (single middle-dot max). */
  spec: string
}

export const CAMERA_LENSES: CameraLens[] = [
  { id: 'main', label: 'Main', zoom: '1×', mp: 50, detail: '1/1.3" sensor, f/1.6, OIS, dual-pixel AF', spec: '50 MP · 1×' },
  { id: 'ultrawide', label: 'Ultra-wide', zoom: '0.5×', mp: 48, detail: '122° field of view, macro capable', spec: '48 MP · 122°' },
  { id: 'telephoto', label: 'Telephoto', zoom: '5×', mp: 50, detail: '5× optical, 10× hybrid, OIS', spec: '5× OPTICAL · 10× HYBRID' },
  { id: 'front', label: 'Front', zoom: '1×', mp: 32, detail: 'Autofocus · 4K60 video', spec: '32 MP · 4K60' },
]

export interface FocalLength {
  zoom: string
  image: string
  note: string
}

/** Five focal lengths drive the interactive camera showcase. Images are local SVGs. */
export const FOCAL_LENGTHS: FocalLength[] = [
  { zoom: '0.5×', image: '/images/camera/scene-ultra.svg', note: 'Ultra-wide' },
  { zoom: '1×', image: '/images/camera/scene-main.svg', note: 'Main lens' },
  { zoom: '2×', image: '/images/camera/scene-zoom2.svg', note: 'Sensor crop' },
  { zoom: '5×', image: '/images/camera/scene-tele5.svg', note: 'Optical tele' },
  { zoom: '10×', image: '/images/camera/scene-tele10.svg', note: 'Hybrid tele' },
]

export type CameraMode = 'Photo' | 'Portrait' | 'Night' | 'Video'

export interface SoCUnit {
  key: 'cpu' | 'gpu' | 'npu'
  name: string
  headline: string
  hero: { value: number; prefix?: string; suffix: string }
  metrics: { label: string; value: number; max: number; suffix: string }[]
  footnote: string
}

/**
 * Fictional demonstration figures for the Aether A1 Ultra.
 * Present them as visualization data, not measured engineering claims.
 */
export const PERFORMANCE: Record<SoCUnit['key'], SoCUnit> = {
  cpu: {
    key: 'cpu',
    name: 'CPU',
    headline: '8 high-performance cores at 3 nm',
    hero: { value: 12480, suffix: 'pt' },
    metrics: [
      { label: 'Multi-core', value: 12480, max: 13000, suffix: 'pt' },
      { label: 'Single-core', value: 2410, max: 2600, suffix: 'pt' },
      { label: 'Sustained load', value: 71, max: 100, suffix: '% of peak' },
    ],
    footnote: 'Demonstration benchmark values for the fictional Aether A1 Ultra CPU cluster.',
  },
  gpu: {
    key: 'gpu',
    name: 'GPU',
    headline: '14-core GPU with hardware ray tracing',
    hero: { value: 132, suffix: 'fps' },
    metrics: [
      { label: 'Average frame rate', value: 132, max: 240, suffix: 'fps' },
      { label: 'Ray-traced lighting', value: 52, max: 100, suffix: '% of scenes' },
      { label: 'Sustained thermal headroom', value: 88, max: 100, suffix: '%' },
    ],
    footnote: 'Demonstration visualization figures. The A1 Ultra GPU is a fictional component.',
  },
  npu: {
    key: 'npu',
    name: 'NPU',
    headline: 'Dedicated neural engine, always on-device',
    hero: { value: 46, suffix: 'TOPS' },
    metrics: [
      { label: 'On-device inference', value: 1.9, max: 4, suffix: 'ms' },
      { label: 'Offline transcription', value: 780, max: 1000, suffix: 'words/min' },
      { label: 'Photo cleanup', value: 0.4, max: 2, suffix: 's' },
    ],
    footnote: 'Demonstration figures. All processing described here happens on the device itself.',
  },
}

export const DISPLAY = {
  size: '6.7"',
  resolution: '3200 × 1440',
  refreshMin: 1,
  refreshMax: 144,
  peakNits: 2800,
  colorBits: 10,
  pwm: 2160,
}

/** Film-safe physical dimensions of the body. */
export const DIMENSIONS = {
  bodyInches: 6.7,
  widthM: 0.076,
  heightM: 0.159,
  thicknessMm: 7.8,
  bezelsMm: 1.45,
  weightG: 198,
}

export const FRAME_MATERIAL = 'Grade-5 titanium'

/** Fabrication facts for the Aether A1 Ultra die. TOPS is inherited from PERFORMANCE. */
export const CHIPSET = {
  name: 'Aether A1 Ultra',
  dieAreaMm2: 171,
  processNm: 3,
  cpuCores: 8,
  gpuCores: 14,
  cpuClockGhZ: 4.4,
  npuTops: PERFORMANCE.npu.hero.value,
}

export const MEMORY = {
  ramGb: 16,
  type: 'LPDDR5X',
}

export const BATTERY = {
  capacity: 5200,
  wired: 100,
  wireless: 40,
  reverse: 15,
  /** Minutes on the wired charger to refill half the cell (source of truth). */
  charge50Min: 30,
  /** Deterministic hypothetical drain in mAh per hour of use. */
  drainPerHour: {
    video: 670,
    gaming: 1040,
    camera: 790,
    social: 430,
    navigation: 540,
    standby: 13,
  } as const,
  presets: {
    light: { video: 1, gaming: 0, camera: 1, social: 2, navigation: 1, standby: 14 },
    balanced: { video: 3, gaming: 1, camera: 1, social: 4, navigation: 2, standby: 10 },
    heavy: { video: 5, gaming: 4, camera: 2, social: 6, navigation: 3, standby: 8 },
  } as const,
}

export type UsageKey = keyof typeof BATTERY.drainPerHour
export type UsageHours = Record<UsageKey, number>

export const USAGE_ORDER: UsageKey[] = ['video', 'gaming', 'camera', 'social', 'navigation', 'standby']

export const AI_CAPABILITIES = [
  'On-device summarization',
  'Offline transcription',
  'Photo cleanup',
  'Contextual suggestions',
  'Private document processing',
  'Fully offline assistant',
]

export interface SpecRow {
  label: string
  value: string
}

export interface SpecCategory {
  label: string
  rows: SpecRow[]
}

export const SPEC_CATEGORIES: SpecCategory[] = [
  {
    label: 'Display',
    rows: [
      { label: 'Panel', value: '6.7" Aether LTPO OLED' },
      { label: 'Resolution', value: '3200 × 1440' },
      { label: 'Refresh rate', value: '1 - 144 Hz adaptive' },
      { label: 'Peak brightness', value: '2800 nits' },
      { label: 'Color', value: '10-bit, HDR' },
      { label: 'PWM dimming', value: '2160 Hz' },
    ],
  },
  {
    label: 'Processor',
    rows: [
      { label: 'SoC', value: 'Aether A1 Ultra' },
      { label: 'Process', value: '3 nm' },
      { label: 'CPU', value: '8-core' },
      { label: 'GPU', value: '14-core' },
      { label: 'NPU', value: `Dedicated, ${PERFORMANCE.npu.hero.value} TOPS` },
    ],
  },
  {
    label: 'Memory',
    rows: [{ label: 'RAM', value: '16 GB LPDDR5X' }],
  },
  {
    label: 'Storage',
    rows: [
      { label: 'Capacity', value: '256 GB / 512 GB / 1 TB' },
      { label: 'Type', value: 'UFS 4.1' },
    ],
  },
  {
    label: 'Cameras',
    rows: [
      { label: 'Main', value: '50 MP · 1/1.3", f/1.6, OIS, dual-pixel AF' },
      { label: 'Ultra-wide', value: '48 MP · 122°, macro' },
      { label: 'Telephoto', value: '50 MP · 5× optical, 10× hybrid, OIS' },
      { label: 'Front', value: '32 MP · autofocus, 4K60' },
      { label: 'Video', value: '8K30 · cinematic mode' },
      { label: 'Capture', value: 'RAW · computational photography' },
    ],
  },
  {
    label: 'Battery',
    rows: [{ label: 'Capacity', value: '5200 mAh' }],
  },
  {
    label: 'Charging',
    rows: [
      { label: 'Wired', value: '100 W' },
      { label: 'Wireless', value: '40 W' },
      { label: 'Reverse wireless', value: '15 W' },
    ],
  },
  {
    label: 'Connectivity',
    rows: [
      { label: 'Cellular', value: '5G mmWave' },
      { label: 'Wi-Fi', value: 'Wi-Fi 7' },
      { label: 'Bluetooth', value: '5.4' },
      { label: 'Other', value: 'UWB · NFC, dual SIM' },
    ],
  },
  {
    label: 'Dimensions',
    rows: [
      { label: 'Body', value: '6.7-inch format' },
      { label: 'Thickness', value: '7.8 mm' },
      { label: 'Bezels', value: '1.45 mm symmetrical' },
    ],
  },
  {
    label: 'Weight',
    rows: [{ label: 'Weight', value: '198 g' }],
  },
  {
    label: 'Materials',
    rows: [
      { label: 'Frame', value: 'Grade-5 titanium' },
      { label: 'Rear panel', value: 'Ceramic' },
      { label: 'Front', value: 'Aether glass' },
    ],
  },
  {
    label: 'Durability',
    rows: [{ label: 'Rating', value: 'IP68 water and dust resistance' }],
  },
  {
    label: 'Operating System',
    rows: [{ label: 'OS', value: 'AetherOS 2.0' }],
  },
]

export const CONCEPT_NOTICE =
  'Aether One X is a fictional concept product. All specifications, benchmarks, and prices shown are illustrative demonstration values.'