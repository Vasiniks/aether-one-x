import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
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
    backRoughness: 0.14,
    islandColor: '#0f0f14',
    frameColor: '#7a8089',
    frameRoughness: 0.34,
    frameAnisotropy: 0.55,
  },
  titanium: {
    key: 'titanium',
    backColor: '#a9b0bc',
    backMetalness: 1,
    backRoughness: 0.22,
    islandColor: '#b6bdc9',
    frameColor: '#b5bcc7',
    frameRoughness: 0.3,
    frameAnisotropy: 0.7,
  },
  glacier: {
    key: 'glacier',
    backColor: '#e6ecf5',
    backMetalness: 0,
    backRoughness: 0.1,
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
  const frame = makeMaterial({
    color: new Color(params.frameColor),
    metalness: 1,
    roughness: params.frameRoughness,
    anisotropy: params.frameAnisotropy,
    // Roughness anisotropy sheen rotates with the long axis of the phone.
    anisotropyRotation: Math.PI / 2,
    envMapIntensity: 1.05,
  })

  const back = makeMaterial({
    color: new Color(params.backColor),
    metalness: params.backMetalness,
    roughness: params.backRoughness,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.1,
  })

  const island = makeMaterial({
    color: new Color(params.islandColor),
    metalness: params.backMetalness,
    roughness: Math.min(0.12, params.backRoughness * 0.8),
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.2,
  })

  const screen = makeMaterial({
    color: new Color('#06080d'),
    metalness: 0,
    roughness: 0.045,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.9,
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
    color: new Color('#cfd6df'),
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.3,
  })

  const lensGlass = makeMaterial({
    color: new Color('#0a101d'),
    metalness: 0,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.25,
    iridescenceIOR: 1.3,
    envMapIntensity: 1.6,
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