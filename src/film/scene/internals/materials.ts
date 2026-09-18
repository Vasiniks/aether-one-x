import * as THREE from 'three'

/**
 * X-ray internals material set plus the procedural textures that give the
 * internals a "real hardware" read: a PCB with fine traces, a silicon die
 * with printed circuitry, a printed cell label and antenna meander plates.
 * Every surface is transparent + depth-write-off so the whole stack dissolves
 * together without sorting artifacts.
 */

function transparentMaterial(base: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  base.transparent = true
  base.depthWrite = false
  return base
}

/** 256px motherboard face: dark substrate, copper planes, fine trace lines. */
export function createPcbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0e131b'
  ctx.fillRect(0, 0, 256, 256)

  // Solder mask pinstriping
  ctx.fillStyle = '#141b26'
  for (let y = 0; y < 256; y += 16) ctx.fillRect(0, y, 256, 1)
  for (let x = 0; x < 256; x += 16) ctx.fillRect(x, 0, 1, 256)

  // Copper planes (slightly lighter islands)
  ctx.fillStyle = '#1b2431'
  ctx.fillRect(18, 26, 70, 60)
  ctx.fillRect(150, 120, 74, 70)

  // Fine traces
  ctx.strokeStyle = '#2c3a4d'
  ctx.lineWidth = 2
  const rng = (seed: number) => {
    let v = seed * 7919 % 65536
    return () => {
      v = (v * 9301 + 49297) % 233280
      return v / 233280
    }
  }
  for (let i = 0; i < 8; i++) {
    const r = rng(i + 1)
    ctx.beginPath()
    let x = r() * 240 + 8
    let y = r() * 240 + 8
    ctx.moveTo(x, y)
    for (let s = 0; s < 4; s++) {
      y += (r() - 0.5) * 48
      ctx.lineTo(x, y)
      x += (r() - 0.5) * 48
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Solder contacts
  ctx.fillStyle = '#3b4a5c'
  const r2 = rng(99)
  for (let i = 0; i < 90; i++) {
    ctx.fillRect(r2() * 246 + 5, r2() * 246 + 5, 2, 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 128px silicon die face: glassy substrate with gold/blue circuitry. */
export function createChipTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1a2233'
  ctx.fillRect(0, 0, 128, 128)

  // Soft core glow
  const core = ctx.createRadialGradient(64, 64, 8, 64, 64, 60)
  core.addColorStop(0, '#2a355a')
  core.addColorStop(1, '#182033')
  ctx.fillStyle = core
  ctx.fillRect(0, 0, 128, 128)

  // Fine circuitry routing around the core
  ctx.strokeStyle = '#2f5ca8'
  ctx.lineWidth = 2
  for (const radius of [22, 34, 46]) {
    ctx.beginPath()
    ctx.strokeStyle = radius === 34 ? '#d2a34c' : '#2f5ca8'
    ctx.lineWidth = radius === 34 ? 3 : 1.5
    ctx.arc(64, 64, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = '#3b6fc6'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(64 + Math.cos(a) * 20, 64 + Math.sin(a) * 20)
    ctx.lineTo(64 + Math.cos(a) * 62, 64 + Math.sin(a) * 62)
    ctx.stroke()
  }

  // Die-mark ring
  ctx.strokeStyle = '#6f88b8'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, 48, 48)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 128x64 printed cell label: brand line, capacity, unit. */
export function createBatteryLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0b0f15'
  ctx.fillRect(0, 0, 128, 64)

  ctx.fillStyle = '#3d4c63'
  ctx.font = '600 9px "Geist Mono", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AETHER CELL', 64, 12)

  ctx.fillStyle = '#dfe8f6'
  ctx.font = '700 26px Geist, Arial, sans-serif'
  ctx.fillText('5200', 64, 36)

  ctx.fillStyle = '#7fa2cc'
  ctx.font = '600 11px Geist Mono, Arial, sans-serif'
  ctx.fillText('mAh', 64, 52)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 64x32 antenna meander plate. */
export function createAntennaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#10141c'
  ctx.fillRect(0, 0, 64, 32)

  ctx.strokeStyle = '#a98a3f'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(4, 26)
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(10 + i * 11, i % 2 ? 6 : 26)
  }
  ctx.stroke()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createInternalsMaterials() {
  const pcb = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#11151d'),
      metalness: 0.6,
      roughness: 0.5,
      envMapIntensity: 0.9,
    }),
  )
  const pcbFace = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: createPcbTexture(),
      metalness: 0.35,
      roughness: 0.6,
      envMapIntensity: 0.7,
    }),
  )
  const pcbTrim = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#39445a'),
      metalness: 0.9,
      roughness: 0.3,
      envMapIntensity: 1.1,
    }),
  )
  const shield = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#39404d'),
      metalness: 0.95,
      roughness: 0.25,
      envMapIntensity: 1.3,
    }),
  )
  const compon = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#262c36'),
      metalness: 0.7,
      roughness: 0.4,
      envMapIntensity: 1,
    }),
  )
  const gold = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#c8a455'),
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 1.4,
    }),
  )
  const flex = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8a5a2e'),
      metalness: 0.25,
      roughness: 0.6,
      envMapIntensity: 0.6,
    }),
  )
  const copper = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b98f4a'),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 0.9,
    }),
  )
  const batteryBody = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#171c24'),
      metalness: 0.3,
      roughness: 0.6,
      envMapIntensity: 0.5,
    }),
  )
  const batteryCell = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#262f3c'),
      metalness: 0.85,
      roughness: 0.3,
      envMapIntensity: 1,
      emissive: new THREE.Color('#35d0c8'),
      emissiveIntensity: 0,
    }),
  )
  const batteryLabel = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: createBatteryLabelTexture(),
      metalness: 0.3,
      roughness: 0.5,
      envMapIntensity: 0.4,
      emissive: new THREE.Color('#35c8d8'),
      emissiveIntensity: 0,
    }),
  )
  const substrate = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a3140'),
      metalness: 0.6,
      roughness: 0.45,
      envMapIntensity: 1,
    }),
  )
  const socDie = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#aebcd2'),
      map: createChipTexture(),
      metalness: 0.95,
      roughness: 0.16,
      envMapIntensity: 1.8,
      emissive: new THREE.Color('#4f8cff'),
      emissiveIntensity: 0,
    }),
  )
  const socPad = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#c8a455'),
      metalness: 1,
      roughness: 0.24,
      envMapIntensity: 1.3,
    }),
  )
  const housing = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0b0f16'),
      metalness: 0.7,
      roughness: 0.4,
      envMapIntensity: 0.8,
    }),
  )
  const sensor = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#16223a'),
      metalness: 0.1,
      roughness: 0.12,
      envMapIntensity: 1.1,
      emissive: new THREE.Color('#3a7bff'),
      emissiveIntensity: 0.85,
    }),
  )
  const antennaPlate = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#dfe6f0'),
      map: createAntennaTexture(),
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 0.8,
    }),
  )
  const midframe = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8b939e'),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.2,
    }),
  )
  const speakerMat = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#05070a'),
      metalness: 0,
      roughness: 0.9,
      envMapIntensity: 0.2,
    }),
  )
  /** Additive circuitry ring around the die when the chip takes focus. */
  const trace = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#59a6ff'),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  return {
    pcb,
    pcbFace,
    pcbTrim,
    shield,
    compon,
    gold,
    flex,
    copper,
    batteryBody,
    batteryCell,
    batteryLabel,
    substrate,
    socDie,
    socPad,
    housing,
    sensor,
    antennaPlate,
    midframe,
    speakerMat,
    trace,
  }
}

export type InternalsMaterials = ReturnType<typeof createInternalsMaterials>