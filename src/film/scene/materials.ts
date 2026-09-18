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
 */
export const FILM_MATERIALS: PhoneMaterialSet = createPhoneMaterials(FINISH_PARAMS.obsidian)
FILM_MATERIALS.display.emissiveMap = getLiveScreen().texture
FILM_MATERIALS.display.emissiveIntensity = 0
FILM_MATERIALS.display.color = new THREE.Color('#05080e')
// The inset panel drives the screen read (glow passes through a glassy front
// face, never occluded by an opaque pane). Both layers stay non-depth-writing
// so the x-ray dissolve of the internals can pass through them cleanly.
FILM_MATERIALS.display.transparent = true
FILM_MATERIALS.display.depthWrite = false
FILM_MATERIALS.screen.color = new THREE.Color('#0a0d14')
FILM_MATERIALS.screen.transparent = true
// The front glass keeps real presence during solid acts (gloss + specular
// read); it thins out only while the internals are on stage. The director
// drives both opacity values toward those targets each frame.
FILM_MATERIALS.screen.opacity = 0.42
FILM_MATERIALS.screen.depthWrite = false

/** A soft additive x-ray shell outline (clean perimeter rods, no wireframe). */
export const GHOST_LINE = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#9cc3ff'),
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})