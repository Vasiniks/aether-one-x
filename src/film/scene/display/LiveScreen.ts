import * as THREE from 'three'

/**
 * A small, procedurally-driven canvas texture that stands in for the phone's
 * display across the whole film. Cheap by design: the canvas is low-res and is
 * only redrawn when its mode or the time-step changes (a few times a second),
 * never every frame.
 */

export const SCREEN_W = 160
export const SCREEN_H = 340

export type ScreenMode =
  | 'off'
  | 'idle'
  | 'display'
  | 'os'

const canvas = document.createElement('canvas')
canvas.width = SCREEN_W
canvas.height = SCREEN_H
const ctx = canvas.getContext('2d')!

function wallpaper(time: number, brightness: number) {
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H)
  g.addColorStop(0, `rgba(9,16,28,${0.92 + brightness * 0.08})`)
  g.addColorStop(0.5, `rgba(16,30,52,${0.86 + brightness * 0.14})`)
  g.addColorStop(1, `rgba(8,14,26,${0.94})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  // Soft aurora blobs drifting slowly.
  const blobA = 40 + Math.sin(time * 0.3) * 12
  const blobB = 120 + Math.cos(time * 0.25) * 14
  let glow = ctx.createRadialGradient(60 + blobA * 0.2, blobA, 4, 60 + blobA * 0.2, blobA, 66)
  glow.addColorStop(0, shade(127, 180, 255, 0.34 * brightness))
  glow.addColorStop(1, 'rgba(127,180,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
  glow = ctx.createRadialGradient(130, blobB, 6, 130, blobB, 58)
  glow.addColorStop(0, shade(160, 200, 255, 0.22 * brightness))
  glow.addColorStop(1, 'rgba(160,200,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
}

function displayFrame(time: number, brightness: number) {
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H)
  g.addColorStop(0, `rgba(5,10,20,1)`)
  g.addColorStop(0.55, `rgba(26,44,74,1)`)
  g.addColorStop(1, `rgba(5,9,18,1)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  // Flowing light bands (the "refresh is alive" read).
  for (let i = 0; i < 4; i++) {
    const y = (((time * (26 + i * 9)) % (SCREEN_H + 40)) - 20)
    const band = ctx.createLinearGradient(0, y - 18, 0, y + 18)
    band.addColorStop(0, 'rgba(127,180,255,0)')
    band.addColorStop(0.5, shade(127, 200, 255, 0.28 * brightness))
    band.addColorStop(1, 'rgba(127,180,255,0)')
    ctx.fillStyle = band
    ctx.fillRect(0, y - 18, SCREEN_W, 36)
  }

  // Hero figure: the refresh count and a smooth progress feel.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = shade(240, 246, 255, 1)
  ctx.font = '700 58px Geist, Helvetica, Arial, sans-serif'
  ctx.fillText('144', SCREEN_W / 2, SCREEN_H / 2 - 18)
  ctx.fillStyle = shade(160, 200, 255, 0.85 * brightness)
  ctx.font = '600 22px Geist, Helvetica, Arial, sans-serif'
  ctx.fillText('HZ', SCREEN_W / 2, SCREEN_H / 2 + 34)
}

function osFrame(time: number, brightness: number) {
  wallpaper(time, brightness)
  // Minimal app grid + soft clock, reading as "the interface".
  const cols = 4
  const rows = 6
  const size = 16
  const gap = 8
  const startX = (SCREEN_W - cols * size - (cols - 1) * gap) / 2
  const startY = 96
  for (let i = 0; i < cols * rows; i++) {
    const x = startX + (i % cols) * (size + gap)
    const y = startY + Math.floor(i / cols) * (size + gap)
    ctx.fillStyle = shade(160, 190, 230, 0.5 * brightness)
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 5)
    ctx.fill()
  }
  ctx.fillStyle = shade(240, 246, 255, 1)
  ctx.font = '600 30px Geist, Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AetherOS', SCREEN_W / 2, 44)
}

function shade(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, a))})`
}

/** Mutation-free handle shared with the scene director. */
export interface LiveScreen {
  texture: THREE.CanvasTexture
  mode: ScreenMode
  brightness: number
  /** Redraws when mode/brightness changed or `force` beats happen. */
  tick(time: number): void
  set(mode: ScreenMode, brightness: number): void
}

const texture = new THREE.CanvasTexture(canvas)
texture.colorSpace = THREE.SRGBColorSpace
texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter

const state: LiveScreen = {
  texture,
  mode: 'off',
  brightness: 0,
  set(mode, brightness) {
    this.mode = mode
    this.brightness = brightness
  },
  tick(time) {
    if (this.mode === 'off') return
    const bright = this.brightness
    if (this.mode === 'idle') {
      wallpaper(time, Math.max(0.25, bright))
    } else if (this.mode === 'display') {
      displayFrame(time, Math.max(0.5, bright))
    } else {
      osFrame(time, Math.max(0.5, bright))
    }
    texture.needsUpdate = true
  },
}

export function getLiveScreen(): LiveScreen {
  return state
}