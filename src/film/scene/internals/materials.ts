import * as THREE from 'three'

/**
 * X-ray internals material set plus the procedural textures that give the
 * internals a "real hardware" read: a PCB with fine traces, a silicon die
 * with engraved markings, a printed cell label, antenna meander plates and a
 * graphite heat-spreader weave. Every surface is transparent + depth-write-off
 * so the whole stack dissolves together without sorting artifacts.
 */
function transparentMaterial(base: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  base.transparent = true
  base.depthWrite = false
  ;(base as unknown as { renderOrder: number }).renderOrder = 2
  return base
}

/** Ties a surface's opacity to a driven parent each render so follow-on layers
 * (graphite, lens glass) receive the exact per-frame fade without the
 * integrator wiring an extra material key. */
function fadeFollow(child: THREE.MeshStandardMaterial, parent: THREE.MeshStandardMaterial, gain = 1) {
  child.onBeforeRender = () => {
    child.opacity = parent.opacity * gain
  }
}

/** 512px motherboard face: dark substrate, copper planes, fine trace lines. */
export function createPcbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0e131b'
  ctx.fillRect(0, 0, 512, 512)

  // Solder mask pinstriping
  ctx.fillStyle = '#141b26'
  for (let y = 0; y < 512; y += 24) ctx.fillRect(0, y, 512, 1)
  for (let x = 0; x < 512; x += 24) ctx.fillRect(x, 0, 1, 512)

  // Copper planes (slightly lighter islands)
  ctx.fillStyle = '#1b2431'
  ctx.fillRect(40, 50, 150, 120)
  ctx.fillRect(300, 245, 150, 150)
  ctx.fillRect(120, 330, 90, 100)

  // Fine traces
  ctx.strokeStyle = '#2c3a4d'
  ctx.lineWidth = 3
  const rng = (seed: number) => {
    let v = seed * 7919 % 65536
    return () => {
      v = (v * 9301 + 49297) % 233280
      return v / 233280
    }
  }
  for (let i = 0; i < 14; i++) {
    const r = rng(i + 1)
    ctx.beginPath()
    let x = r() * 480 + 16
    let y = r() * 480 + 16
    ctx.moveTo(x, y)
    for (let s = 0; s < 5; s++) {
      y += (r() - 0.5) * 100
      ctx.lineTo(x, y)
      x += (r() - 0.5) * 100
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Solder contacts
  ctx.fillStyle = '#3b4a5c'
  const r2 = rng(99)
  for (let i = 0; i < 220; i++) {
    ctx.fillRect(r2() * 496 + 8, r2() * 496 + 8, 3, 3)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 1024px A1 Ultra die face: mirrored silicon, routed buses, scribe lanes,
 * gold reticle and engraved (two-pass) marking text. Holds up in the flat-on
 * chip shot. */
export function createChipTexture(): THREE.CanvasTexture {
  const S = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#121a2c'
  ctx.fillRect(0, 0, S, S)

  // Glassy radial core
  const core = ctx.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S * 0.62)
  core.addColorStop(0, '#29365e')
  core.addColorStop(0.55, '#1a2440')
  core.addColorStop(1, '#0f1422')
  ctx.fillStyle = core
  ctx.fillRect(0, 0, S, S)

  // Substrate grain (mirror finish read)
  ctx.strokeStyle = '#24304a'
  ctx.lineWidth = 1
  for (let y = 0; y < S; y += 6) {
    ctx.beginPath()
    ctx.moveTo(0, y + 2)
    ctx.lineTo(S, y + 2)
    ctx.stroke()
  }

  // Core block boundary
  ctx.strokeStyle = '#3b6fc6'
  ctx.lineWidth = 5
  ctx.strokeRect(S * 0.2, S * 0.2, S * 0.6, S * 0.6)

  // Radial buses to the periphery
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    ctx.strokeStyle = i % 3 ? '#2f5ca8' : '#d2a34c'
    ctx.lineWidth = i % 3 ? 2 : 3.5
    ctx.beginPath()
    ctx.moveTo(S / 2 + Math.cos(a) * S * 0.3, S / 2 + Math.sin(a) * S * 0.3)
    ctx.lineTo(S / 2 + Math.cos(a) * S * 0.46, S / 2 + Math.sin(a) * S * 0.46)
    ctx.stroke()
  }

  // Die saw street / scribe lanes
  ctx.strokeStyle = '#3a4a66'
  ctx.lineWidth = 3
  ctx.strokeRect(S * 0.045, S * 0.045, S * 0.91, S * 0.91)
  ctx.strokeStyle = '#4a5a76'
  ctx.lineWidth = 1.5
  ctx.strokeRect(S * 0.06, S * 0.06, S * 0.88, S * 0.88)

  // Corner L fiducials
  ctx.strokeStyle = '#d2a34c'
  ctx.lineWidth = 6
  const F = S * 0.085
  const Fw = S * 0.04
  ctx.strokeRect(F, F, Fw, Fw)
  ctx.strokeRect(S - F - Fw, F, Fw, Fw)
  ctx.strokeRect(F, S - F - Fw, Fw, Fw)
  ctx.strokeRect(S - F - Fw, S - F - Fw, Fw, Fw)

  // Gold reticle: center cross + ring
  ctx.strokeStyle = '#e8c878'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(S / 2 - 90, S / 2)
  ctx.lineTo(S / 2 + 90, S / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(S / 2, S / 2 - 90)
  ctx.lineTo(S / 2, S / 2 + 90)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 40, 0, Math.PI * 2)
  ctx.stroke()

  // Fine circuit tangles inside the core
  ctx.strokeStyle = '#3b6fc6'
  ctx.lineWidth = 2
  const rng = (seed: number) => {
    let v = seed * 7919 % 65536
    return () => {
      v = (v * 9301 + 49297) % 233280
      return v / 233280
    }
  }
  for (let k = 0; k < 30; k++) {
    const r = rng(k + 5)
    const x0 = S * 0.22 + r() * S * 0.56
    const y0 = S * 0.22 + r() * S * 0.56
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (let s = 0; s < 3; s++) {
      ctx.lineTo(x0 + (r() - 0.5) * 120, s ? y0 + (r() - 0.5) * 60 : y0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x0 + (r() - 0.5) * 120, y0)
    }
  }

  // Engraved markings: dark drop shadow pass + light glyph pass reads as
  // laser-etched into the silicon.
  const stamp = (
    text: string,
    x: number,
    y: number,
    size: number,
    face: string,
    mono = false,
    spacing = 0,
    align: CanvasTextAlign = 'center',
  ) => {
    ctx.font = `${mono ? '500' : '700'} ${size}px ${
      mono ? 'Geist Mono Variable, Geist Mono, Menlo, monospace' : 'Geist Variable, Geist, Helvetica, Arial, sans-serif'
    }`
    ctx.textAlign = align
    ctx.textBaseline = 'alphabetic'
    const put = (dx: number, dy: number, col: string) => {
      ctx.fillStyle = col
      if (spacing > 0) {
        const w = text.length * (size * 0.62 + spacing)
        let cx = align === 'left' ? x : x - w / 2
        for (const ch of text) {
          ctx.fillText(ch, cx, y)
          cx += size * 0.62 + spacing
        }
      } else {
        ctx.fillText(text, x + dx, y + dy)
      }
    }
    put(2.5, 2.5, '#070b12')
    put(0, 0, face)
  }

  stamp('A E T H E R', S / 2, S * 0.105, 30, '#93a6c8', false, 6)
  stamp('A1 ULTRA', S / 2, S * 0.6, 84, '#e6edf8')
  stamp('3nm \u00B7 8-CORE CPU \u00B7 14-CORE GPU \u00B7 46 TOPS', S / 2, S * 0.7, 26, '#8fa3c4', true)
  stamp('SN \u00B7 8806-0117 \u00B7 REV C2', S / 2, S * 0.78, 24, '#6f88b8', true)
  stamp('A1U-26', S * 0.94, S * 0.105, 24, '#6f88b8', true, 0, 'right')
  stamp('C2', S * 0.06, S * 0.93, 24, '#6f88b8', true, 0, 'left')
  stamp('\u00A9 AETHER SEMICONDUCTOR', S * 0.94, S * 0.93, 20, '#5a6a88', true, 0, 'right')

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 256x384 printed cell label (portrait, matches the 0.03 x 0.045 plane): brand
 * line, capacity, electrical specs, barcode and regulatory marks — typed
 * glyphs only. */
export function createBatteryLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 384
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0a0d12'
  ctx.fillRect(0, 0, 256, 384)

  // Wrapped-foil edge bands
  ctx.fillStyle = '#11161f'
  ctx.fillRect(0, 0, 256, 18)
  ctx.fillRect(0, 366, 256, 18)
  ctx.fillRect(0, 0, 18, 384)
  ctx.fillRect(238, 0, 18, 384)

  const stamp = (
    text: string,
    x: number,
    y: number,
    size: number,
    face: string,
    mono = false,
    spacing = 0,
    align: CanvasTextAlign = 'center',
  ) => {
    ctx.font = `${mono ? '500' : '700'} ${size}px ${
      mono ? 'Geist Mono Variable, Geist Mono, Menlo, monospace' : 'Geist Variable, Geist, Helvetica, Arial, sans-serif'
    }`
    ctx.textAlign = align
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = face
    if (spacing > 0) {
      const w = text.length * (size * 0.62 + spacing)
      let cx = align === 'left' ? x : x - w / 2
      for (const ch of text) {
        ctx.fillText(ch, cx, y)
        cx += size * 0.62 + spacing
      }
    } else {
      ctx.fillText(text, x, y)
    }
  }

  stamp('A E T H E R', 128, 42, 22, '#93a6c8', false, 4)
  stamp('AetherOne X Internal Cell', 128, 62, 11, '#7fa2cc')
  ctx.strokeStyle = '#2c3850'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, 72)
  ctx.lineTo(216, 72)
  ctx.stroke()

  stamp('5200', 128, 152, 78, '#dfe8f6')
  stamp('mAh', 128, 180, 26, '#7fa2cc')
  stamp('LITHIUM-ION \u00B7 RECHARGEABLE', 128, 206, 11, '#5a6a88', true)

  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(28, 220)
  ctx.lineTo(228, 220)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#8b9bb5'
  ctx.font = '500 11px Geist Mono Variable, Geist Mono, Menlo, monospace'
  ctx.textAlign = 'center'
  const specs: [string, string][] = [
    ['NOMINAL', '3.90 V'],
    ['CHARGE', '4.48 V'],
    ['ENERGY', '20.3 Wh'],
  ]
  specs.forEach(([k, v], i) => {
    ctx.textAlign = 'left'
    ctx.fillText(k, 58, 240 + i * 16)
    ctx.textAlign = 'right'
    ctx.fillText(v, 198, 240 + i * 16)
  })

  // Barcode
  const seed = 7
  let v = seed * 7919 % 65536
  const r2 = () => {
    v = (v * 9301 + 49297) % 233280
    return v / 233280
  }
  ctx.fillStyle = '#b9c4d8'
  let bx = 30
  while (bx < 226) {
    const w = 2 + r2() * 4
    ctx.fillRect(bx, 296, w, 42)
    bx += w + 2 + r2() * 2
  }
  stamp('A1B-5200-UL', 128, 352, 11, '#5a6a88', true)

  // Regulatory triangle (stroke glyphs, no emoji)
  ctx.strokeStyle = '#5a6a88'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(28, 376)
  ctx.lineTo(40, 376)
  ctx.lineTo(34, 365)
  ctx.closePath()
  ctx.stroke()
  ctx.fillStyle = '#5a6a88'
  ctx.fillRect(33, 370, 2.5, 2)
  ctx.fillRect(33, 373.5, 2.5, 1.5)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1
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
  tex.anisotropy = 1
  return tex
}

/** 128px graphite heat-spreader weave: crossed fibre strokes on dark foil,
 * with the perimeter copper via rows baked in (they tile with the foil, so
 * the micro-via read survives without fourteen separate circle meshes). */
export function createGraphiteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#14161c'
  ctx.fillRect(0, 0, 128, 128)

  ctx.strokeStyle = '#1d222b'
  ctx.lineWidth = 1
  for (let i = -2; i < 16; i++) {
    ctx.beginPath()
    ctx.moveTo(i * 9, 0)
    ctx.lineTo(0, 128 - i * 9)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(128 - i * 9, 0)
    ctx.lineTo(128, 128 - i * 9)
    ctx.stroke()
  }
  ctx.strokeStyle = '#232935'
  ctx.lineWidth = 1
  for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.moveTo(4 + i * 11, 0)
    ctx.lineTo(4 + i * 11 + 128, 0)
    ctx.stroke()
  }
  // Copper fleck here and there (cell voltage tab read)
  ctx.fillStyle = '#b98f4a'
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.5
    ctx.fillRect(10 + i * 42, 40 + i * 18, 14, 2)
  }
  ctx.globalAlpha = 1

  // Perimeter via rows, baked as gold rings with dark centres
  ctx.fillStyle = '#7d6f36'
  for (const row of [8, 120]) {
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.arc(8 + i * 18.5, row, 1.3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.fillStyle = '#342d19'
  for (const row of [8, 120]) {
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.arc(8 + i * 18.5, row, 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1
  return tex
}

/** 64px map + roughness pair; anisotropy is useless on these small, mostly
 * face-on maps so it stays at 1 (the 512 board face and 1024 die keep 8). */
function colorFromCanvas(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1
  return tex
}

function dataFromCanvas(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 1
  return tex
}

/** 64px stamped-can face: brushed grooves, a crimp rim, an embossed boss, a
 * cross brace and corner screws, all baked into one map so each shield can is
 * a single lightweight box instead of nine layered meshes. */
export function createShieldTexture(): { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f2f3f5'
  ctx.fillRect(0, 0, 64, 64)

  // Brushed hold-down grooves
  ctx.strokeStyle = '#e6e8ec'
  ctx.lineWidth = 1
  for (let y = 3; y < 62; y += 3) {
    ctx.beginPath()
    ctx.moveTo(2, y)
    ctx.lineTo(62, y + (y % 9 ? 0 : 1))
    ctx.stroke()
  }

  // Crimp rim frame
  ctx.strokeStyle = '#d6d9df'
  ctx.lineWidth = 3
  ctx.strokeRect(4.5, 4.5, 55, 55)
  ctx.strokeStyle = '#eef0f3'
  ctx.lineWidth = 1
  ctx.strokeRect(8.5, 8.5, 47, 47)

  // Embossed centre boss
  ctx.fillStyle = '#edf0f4'
  ctx.fillRect(22, 22, 20, 20)
  ctx.strokeStyle = '#c9cdd5'
  ctx.lineWidth = 1.5
  ctx.strokeRect(23, 23, 18, 18)

  // Stamped cross brace
  ctx.strokeStyle = '#d2d5dc'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(11, 32)
  ctx.lineTo(53, 32)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(32, 11)
  ctx.lineTo(32, 53)
  ctx.stroke()

  // Corner screw bosses
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = 32 + sx * 24
      const cy = 32 + sy * 24
      ctx.fillStyle = '#c3c7ce'
      ctx.beginPath()
      ctx.arc(cx, cy, 2.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f7f8fa'
      ctx.beginPath()
      ctx.arc(cx - 1, cy - 1, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const map = colorFromCanvas(canvas)
  const roughness = dataFromCanvas(canvas)
  return { map, roughness }
}

/** 128px solder-ball sheet for the A1 Ultra underside: a 7x7 grid (corners
 * cropped) of shaded dots that reads as micro balls under the lifted
 * substrate. Replaces the former forty-five sphere meshes; the die face keeps
 * its real geometry. One 0.0093 plane wears the map at 1.45mm pitch. */
export function createBgaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0d1219'
  ctx.fillRect(0, 0, 128, 128)

  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if ((i === 0 || i === 6) && (j === 0 || j === 6)) continue
      const cx = 4 + i * 20
      const cy = 4 + j * 20
      const ball = ctx.createRadialGradient(cx - 1.2, cy - 1.4, 0.4, cx, cy, 3.6)
      ball.addColorStop(0, '#fbdf9e')
      ball.addColorStop(0.45, '#c8a455')
      ball.addColorStop(1, '#6f5529')
      ctx.fillStyle = ball
      ctx.beginPath()
      ctx.arc(cx, cy, 3.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1
  return tex
}

export function createBatterySeamTexture(): { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 64, 256)
  ctx.strokeStyle = '#f0f0f3'
  ctx.lineWidth = 1.5
  for (const x of [21, 42]) {
    ctx.beginPath()
    ctx.moveTo(x, 4)
    ctx.lineTo(x + 0.5, 252)
    ctx.stroke()
  }
  const map = colorFromCanvas(canvas)
  const roughness = dataFromCanvas(canvas)
  return { map, roughness }
}

export function createSensorRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = '#f2f2f5'
  ctx.lineWidth = 1
  for (const r of [9, 21, 27]) {
    ctx.beginPath()
    ctx.arc(32, 32, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(32, 32, 15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(14, 44)
  ctx.lineTo(14, 51)
  ctx.lineTo(23, 51)
  ctx.stroke()
  return colorFromCanvas(canvas)
}

export function createLensGlossTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const base = ctx.createRadialGradient(32, 32, 3, 32, 32, 30)
  base.addColorStop(0, '#c0c0c0')
  base.addColorStop(0.45, '#dcdcdc')
  base.addColorStop(1, '#f5f5f5')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 64, 64)
  return dataFromCanvas(canvas)
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
  const shieldTex = createShieldTexture()
  const shield = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#39404d'),
      map: shieldTex.map,
      roughnessMap: shieldTex.roughness,
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
      roughness: 0.12,
      envMapIntensity: 1.5,
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
      roughness: 0.25,
      envMapIntensity: 1,
    }),
  )
  const batterySeam = createBatterySeamTexture()
  const batteryBody = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#171c24'),
      map: batterySeam.map,
      roughnessMap: batterySeam.roughness,
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
      roughness: 0.1,
      envMapIntensity: 2,
      emissive: new THREE.Color('#4f8cff'),
      emissiveIntensity: 0,
    }),
  )
  const socPad = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#c8a455'),
      metalness: 1,
      roughness: 0.12,
      envMapIntensity: 1.4,
    }),
  )
  // BGA ball sheet glued to the board dissolve so the lifted substrate keeps
  // its micro-ball read without the former forty-five sphere draw calls.
  const bga = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: createBgaTexture(),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    }),
  )
  fadeFollow(bga, pcb)
  const housing = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0b0f16'),
      metalness: 0.7,
      roughness: 0.4,
      envMapIntensity: 0.8,
    }),
  )
  const sensorRing = createSensorRingTexture()
  const sensor = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#16223a'),
      map: sensorRing,
      emissiveMap: sensorRing,
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
      metalness: 0.95,
      roughness: 0.42,
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
  const trace = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#59a6ff'),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  ;(trace as unknown as { renderOrder: number }).renderOrder = 5

  // Graphite heat-spreader foil (ThermalSpreader). Follows the board fade so
  // the sheet stays glued to the pcb's dissolve rather than popping.
  const graphite = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f1115'),
      map: createGraphiteTexture(),
      metalness: 0.6,
      roughness: 0.4,
      envMapIntensity: 0.9,
    }),
  )
  fadeFollow(graphite, pcb)

  // Camera lens / cover glass. Base 0.32 translucency scaled by the stack fade.
  const lensGlass = transparentMaterial(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0c1620'),
      roughnessMap: createLensGlossTexture(),
      metalness: 0.2,
      roughness: 0.08,
      envMapIntensity: 2.2,
    }),
  )
  fadeFollow(lensGlass, pcb, 0.32)

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
    bga,
    housing,
    sensor,
    antennaPlate,
    midframe,
    speakerMat,
    trace,
    graphite,
    lensGlass,
  }
}

export type InternalsMaterials = ReturnType<typeof createInternalsMaterials>