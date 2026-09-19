import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  NoColorSpace,
  type MeshPhysicalMaterialParameters,
} from 'three'
import type { FinishId } from '../../data/product'

/** Visual parameters per finish. Colors are lerped live by the model rig. */
export interface FinishParams {
  key: FinishId
  backColor: string
  backMetalness: number
  backRoughness: number
  islandColor: string
  frameColor: string
  frameRoughness: number
  frameAnisotropy: number
}

/** Pre-minted, non-allocating colors used for per-frame finish lerping. */
export const FINISH_COLORS: Record<FinishId, { frame: Color; back: Color; island: Color }> = {
  obsidian: {
    frame: new Color('#7a8089'),
    back: new Color('#0d0d11'),
    island: new Color('#0f0f14'),
  },
  titanium: {
    frame: new Color('#b5bcc7'),
    back: new Color('#a9b0bc'),
    island: new Color('#b6bdc9'),
  },
  glacier: {
    frame: new Color('#acb8cd'),
    back: new Color('#e6ecf5'),
    island: new Color('#edf2f9'),
  },
}

export const FINISH_PARAMS: Record<FinishId, FinishParams> = {
  obsidian: {
    key: 'obsidian',
    backColor: '#0d0d11',
    backMetalness: 0,
    backRoughness: 0.34,
    islandColor: '#0f0f14',
    frameColor: '#7a8089',
    frameRoughness: 0.3,
    frameAnisotropy: 0.55,
  },
  titanium: {
    key: 'titanium',
    backColor: '#a9b0bc',
    backMetalness: 1,
    backRoughness: 0.34,
    islandColor: '#b6bdc9',
    frameColor: '#b5bcc7',
    frameRoughness: 0.3,
    frameAnisotropy: 0.7,
  },
  glacier: {
    key: 'glacier',
    backColor: '#e6ecf5',
    backMetalness: 0,
    backRoughness: 0.32,
    islandColor: '#edf2f9',
    frameColor: '#acb8cd',
    frameRoughness: 0.3,
    frameAnisotropy: 0.45,
  },
}

export interface PhoneMaterialSet {
  frame: MeshPhysicalMaterial
  back: MeshPhysicalMaterial
  island: MeshPhysicalMaterial
  /** Front glass surface (reflective, near-black when the display is off). */
  screen: MeshPhysicalMaterial
  /** Inner emissive display panel (slightly inset behind the glass). */
  display: MeshPhysicalMaterial
  lensRing: MeshPhysicalMaterial
  lensGlass: MeshPhysicalMaterial
  /** Machined inner barrel wall visible through the lens glass. */
  lensBarrel: MeshPhysicalMaterial
  lensCavity: MeshPhysicalMaterial
  /** Faint deep sensor reflection inside each optical assembly. */
  sensorGlint: MeshPhysicalMaterial
  button: MeshPhysicalMaterial
  focusRing: MeshPhysicalMaterial
  logo: MeshPhysicalMaterial
  /** USB-C receptacle interior. */
  port: MeshPhysicalMaterial
  /** Earpiece / mic openings. */
  speaker: MeshPhysicalMaterial
  /** Dark antenna separation seams on the frame. */
  antenna: MeshPhysicalMaterial
  /** SIM tray strip. */
  simTray: MeshPhysicalMaterial
  /** Flash module collar. */
  flashRing: MeshPhysicalMaterial
  /** Flash LED face. */
  flashGlass: MeshPhysicalMaterial
}

function makeMaterial(overrides: MeshPhysicalMaterialParameters): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({
    envMapIntensity: 1,
    ...overrides,
  })
  return material
}

/** Creates a full, independent material set for one phone instance. */
export function createPhoneMaterials(params: FinishParams): PhoneMaterialSet {
  const ceramic = createCeramicMottleTexture()
  const brush = createBrushTexture()
  const lensGloss = createLensGlossMap()

  const frame = makeMaterial({
    color: new Color(params.frameColor),
    metalness: 1,
    roughness: params.frameRoughness,
    roughnessMap: brush,
    anisotropy: params.frameAnisotropy,
    // Roughness anisotropy sheen rotates with the long axis of the phone.
    anisotropyRotation: Math.PI / 2,
    // Matched to the shared studio: metal reads crisp but never clips. The
    // film re-drives this channel per act, the product page keeps the seed.
    envMapIntensity: 1.2,
  })

  const back = makeMaterial({
    color: new Color(params.backColor),
    metalness: params.backMetalness,
    roughness: params.backRoughness,
    roughnessMap: ceramic.data,
    map: ceramic.color,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    // Ceramic reflection is broad and soft: higher roughness dampens the env
    // specular, clearcoat carries a faint sheen on top of the mottle.
    envMapIntensity: 1.35,
  })

  const island = makeMaterial({
    color: new Color(params.islandColor),
    metalness: params.backMetalness,
    roughness: Math.min(0.28, params.backRoughness * 0.8),
    roughnessMap: ceramic.data,
    map: ceramic.color,
    clearcoat: 0.75,
    clearcoatRoughness: 0.15,
    // Same ceramic family, slightly more polished than the back slab so the
    // module reads machined but stays visually one material.
    envMapIntensity: 1.5,
  })

  const screen = makeMaterial({
    color: new Color('#06080d'),
    metalness: 0,
    roughness: 0.045,
    clearcoat: 1,
    clearcoatRoughness: 0.045,
    // A restrained env band reads as the surface highlight: it tracks the
    // glass slab geometry (no decal), held just under 1 so the display
    // panel keeps the attention in lit shots.
    envMapIntensity: 0.95,
  })

  const display = makeMaterial({
    color: new Color('#02040a'),
    metalness: 0,
    roughness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    emissive: new Color('#ffffff'),
    emissiveIntensity: 1,
    envMapIntensity: 0.5,
  })

  const lensRing = makeMaterial({
    // Faint anodized tint on the machined collar, subtle enough that the
    // module still reads as titanium rather than coated hardware.
    color: new Color('#c9d2de'),
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.3,
  })

  const lensGlass = makeMaterial({
    color: new Color('#0a101d'),
    metalness: 0,
    roughness: 0.025,
    roughnessMap: lensGloss,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.2,
    iridescenceIOR: 1.3,
    // One shared sheet across all three lenses: env gain is tuned here for a
    // crisp catch-sparkle without clipping, at the cost of any per-lens split.
    envMapIntensity: 1.9,
  })

  const lensBarrel = makeMaterial({
    color: new Color('#171b22'),
    metalness: 0.95,
    roughness: 0.32,
    envMapIntensity: 0.5,
  })

  const lensCavity = makeMaterial({
    color: new Color('#04060b'),
    metalness: 0,
    roughness: 0.92,
    envMapIntensity: 0.15,
  })

  const sensorGlint = makeMaterial({
    color: new Color('#2f63c8'),
    metalness: 0,
    roughness: 0.2,
    emissive: new Color('#2f63c8'),
    emissiveIntensity: 1.4,
    envMapIntensity: 0.2,
  })

  const button = makeMaterial({
    color: new Color('#99a0aa'),
    metalness: 1,
    roughness: 0.38,
    envMapIntensity: 0.9,
  })

  const focusRing = makeMaterial({
    color: new Color('#7fb4ff'),
    emissive: new Color('#7fb4ff'),
    emissiveIntensity: 2,
    metalness: 0,
    roughness: 1,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })

  const logo = makeMaterial({
    color: new Color('#ffffff'),
    map: createLogoTexture(),
    metalness: 0,
    roughness: 1,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  })

  const port = makeMaterial({
    color: new Color('#0a0d12'),
    metalness: 0.9,
    roughness: 0.4,
    envMapIntensity: 0.5,
  })

  const speaker = makeMaterial({
    color: new Color('#05070a'),
    metalness: 0,
    roughness: 0.95,
  })

  const antenna = makeMaterial({
    color: new Color('#0b0c10'),
    metalness: 0.5,
    roughness: 0.55,
  })

  const simTray = makeMaterial({
    color: new Color('#9aa3b0'),
    metalness: 1,
    roughness: 0.35,
    envMapIntensity: 1.1,
  })

  const flashRing = makeMaterial({
    color: new Color('#2a2f38'),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1,
  })

  const flashGlass = makeMaterial({
    color: new Color('#eef6ff'),
    metalness: 0,
    roughness: 0.08,
    emissive: new Color('#dfeaff'),
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.9,
  })

  return {
    frame,
    back,
    island,
    screen,
    display,
    lensRing,
    lensGlass,
    lensBarrel,
    lensCavity,
    sensorGlint,
    button,
    focusRing,
    logo,
    port,
    speaker,
    antenna,
    simTray,
    flashRing,
    flashGlass,
  }
}

/** Builds the always-identical brand mark decal texture ("AETHER"). */
export function createLogoTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = 'rgba(240,245,252,0.95)'
    ctx.font = '600 76px "Helvetica Neue", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('A E T H E R', 256, 68)
  }
  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function colorFromCanvas(canvas: HTMLCanvasElement, anisotropy = 4): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = 'srgb'
  texture.anisotropy = anisotropy
  return texture
}

function dataFromCanvas(canvas: HTMLCanvasElement, anisotropy = 1): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = NoColorSpace
  texture.anisotropy = anisotropy
  return texture
}

export function createCeramicMottleTexture(): { color: CanvasTexture; data: CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 128, 128)
    let v = 2024 * 7919 % 65536
    const rng = () => {
      v = (v * 9301 + 49297) % 233280
      return v / 233280
    }
    for (let i = 0; i < 46; i++) {
      const x = rng() * 128
      const y = rng() * 128
      const r = 4 + rng() * 14
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(241,241,243,${0.35 + rng() * 0.35})`)
      g.addColorStop(1, 'rgba(241,241,243,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const color = colorFromCanvas(canvas, 1)
  const data = dataFromCanvas(canvas, 1)
  return { color, data }
}

export function createBrushTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    let v = 77 * 7919 % 65536
    const rng = () => {
      v = (v * 9301 + 49297) % 233280
      return v / 233280
    }
    // Linear machining reads through the green channel (roughnessMap ignores
    // alpha): fine parallel grooves plus a couple of deeper tool passes, with
    // a smooth jog along the axis so lines stay coherent, never per-pixel.
    // The two-stop spread (~0.77 / ~0.98) keeps the roughness contrast subtle
    // (~12% of the base frame roughness) while still visible in macro.
    const grooves: number[] = []
    let phase = 0
    for (let x = 0; x < 64; x++) {
      phase = phase * 0.86 + (rng() - 0.5) * 0.5
      let g = x % 2 === 0 ? 0.77 : 0.98
      g += (rng() - 0.5) * 0.05 + phase * 0.018
      grooves.push(Math.min(0.99, Math.max(0.68, g)))
    }
    for (const cx of [20, 21, 44, 45]) {
      grooves[cx] = 0.62
    }
    for (let x = 0; x < 64; x++) {
      const g = Math.round(grooves[x] * 255)
      ctx.fillStyle = `rgb(${g},${g},${g})`
      ctx.fillRect(x, 0, 1, 64)
    }
  }
  return dataFromCanvas(canvas, 1)
}

export function createLensGlossMap(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Tight center-to-edge gradient in the green channel drives roughness:
    // a crisper center catches the sparkle, the rim relaxes to a soft inner
    // gradient so the sheet reads as one polished lens, not a flat decal.
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
    g.addColorStop(0, '#a8a8b0')
    g.addColorStop(0.4, '#cfcfd6')
    g.addColorStop(1, '#f2f2f4')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  }
  return dataFromCanvas(canvas, 1)
}

/** A procedural aurora wallpaper for the display. */
export function createScreenTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#0a1322')
    gradient.addColorStop(0.45, '#0d1c33')
    gradient.addColorStop(0.75, '#132741')
    gradient.addColorStop(1, '#0a1220')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 512)

    const glow = ctx.createRadialGradient(150, 150, 20, 150, 150, 220)
    glow.addColorStop(0, 'rgba(127,180,255,0.5)')
    glow.addColorStop(1, 'rgba(127,180,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 256, 512)

    ctx.fillStyle = 'rgba(240,246,255,0.9)'
    ctx.beginPath()
    ctx.arc(178, 96, 26, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(200,218,245,0.35)'
    ctx.beginPath()
    ctx.arc(60, 420, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(200, 460, 28, 0, Math.PI * 2)
    ctx.fill()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = 'srgb'
  texture.needsUpdate = true
  return texture
}