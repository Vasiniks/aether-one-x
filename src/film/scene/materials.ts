import * as THREE from 'three'
import {
  FINISH_PARAMS,
  createPhoneMaterials,
  type PhoneMaterialSet,
} from '../../components/PhoneViewer/PhoneMaterials'
import { getLiveScreen } from './display/LiveScreen'

/**
 * The film's dedicated phone material set. Unlike the shared default, this set
 * is owned once and animated heavily (per-act env intensity, x-ray dissolve)
 * without ever affecting the product-page viewers. The live display texture
 * drives the inset display panel, not the front glass.
 *
 * Render tiers (used in the transparent pass so the x-ray stack blends in one
 * deterministic far-to-near order without per-frame shader recompiles):
 *   1 = rear shell (back panel, island, optics, flash, brand, focus ring)
 *   2 = internals            (see internals/materials.ts)
 *   3 = frame shell (frame, buttons, rails, antennas, ports)
 *   4 = front glass + display
 *   5 = additive (ghost line, ring traces)
 *
 * During the chip dive the tier-3 hardware also dials its opacity out via
 * chipFocus (FilmDirector), so the ring frame can never paint over the nearer
 * internals - the stack stays in tier order, no per-frame tier swap needed.
 */
export function createFilmMaterials(): PhoneMaterialSet {
  const set = createPhoneMaterials(FINISH_PARAMS.obsidian)
  set.display.emissiveMap = getLiveScreen().texture
  set.display.emissiveIntensity = 0
  set.display.color = new THREE.Color('#05080e')
  // The inset panel drives the screen read (glow passes through a glassy front
  // face, never occluded by an opaque pane). Both layers stay non-depth-writing
  // so the x-ray dissolve of the internals can pass through them cleanly.
  set.display.transparent = true
  set.display.depthWrite = false
  set.screen.color = new THREE.Color('#0a0d14')
  set.screen.transparent = true
  set.screen.opacity = 0.42
  set.screen.depthWrite = false

  // The whole shell stays transparent for the whole film. Only depthWrite and
  // opacity change per phase, so the material never recompiles mid-scroll.
  const SHELL_TIERS: Partial<Record<keyof PhoneMaterialSet, number>> = {
    back: 1,
    island: 1,
    lensRing: 1,
    lensGlass: 1,
    lensBarrel: 1,
    lensCavity: 1,
    sensorGlint: 1,
    flashRing: 1,
    flashGlass: 1,
    logo: 1,
    focusRing: 1,
    frame: 3,
    button: 3,
    simTray: 3,
    port: 3,
    speaker: 3,
    antenna: 3,
    screen: 4,
    display: 4,
  }
  for (const [name, tier] of Object.entries(SHELL_TIERS)) {
    const mat = set[name as keyof PhoneMaterialSet]
    mat.transparent = true
    ;(mat as unknown as { renderOrder: number }).renderOrder = tier
  }
  return set
}

export const FILM_MATERIALS: PhoneMaterialSet = createFilmMaterials()

/** A soft additive x-ray shell outline (clean perimeter rods, no wireframe). */
export const GHOST_LINE = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#9cc3ff'),
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})
;(GHOST_LINE as unknown as { renderOrder: number }).renderOrder = 5