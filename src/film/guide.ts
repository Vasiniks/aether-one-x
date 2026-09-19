/**
 * Magnetic guidance for the film timeline.
 *
 * Pure scroll-space math: the shared progress value (0..1) is nudged toward
 * the nearest authored story node while scroll is slow, and the nudge releases
 * the moment scroll speeds up. It is an additive layer over raw scroll — the
 * value is never locked, never clamps, and a fast scroll always escapes.
 */

/** Authored story beats: the 13 act midpoints, sorted ascending. */
export const GUIDE_NODES: number[] = [
  // Chip rest sits at 0.42, not the act midpoint 0.40: the composed A1 Ultra
  // macro beat lives at key 0.425, and a slow scroll must settle onto the
  // contained frame, not mid-dive where the die still clips the top edge.
  0.05, 0.1275, 0.2025, 0.29, 0.42, 0.495, 0.608, 0.78, 0.865, 0.912, 0.94, 0.9625, 0.9875,
]

/** Progress-per-ms rate above which attraction is fully released. */
const V_HI = 0.006
/** Share of the instantaneous rate folded into the velocity EMA each call. */
const V_EMA = 0.2
/** Half-width of the halo around a node that engages guidance. */
const ENTER_HALO = 0.028
/** Once engaged, drift beyond this distance releases the attraction. */
const OFF_HALO = 0.02
/** Max snap pull fraction towards the node; kept < 1 so the output never locks. */
const K_MAX = 0.9
/** Outside this band the opening frames and the finale stay entirely free. */
const GUIDE_MIN = 0.02
const GUIDE_MAX = 0.97

export interface GuideSession {
  velocity: number
  lastP: number
  lastNow: number
  engaged: boolean
  engagedNode: number | null
}

export function createGuideSession(): GuideSession {
  return { velocity: 0, lastP: NaN, lastNow: NaN, engaged: false, engagedNode: null }
}

export function smoothGuide(p: number, session: GuideSession, now: number): number {
  if (Number.isNaN(session.lastP)) {
    session.lastP = p
    session.lastNow = now
    return p
  }

  const dt = now - session.lastNow
  const dp = p - session.lastP
  session.lastP = p
  session.lastNow = now

  if (dt > 0) {
    session.velocity = V_EMA * (dp / dt) + (1 - V_EMA) * session.velocity
  }

  const velocityFactor = 1 - Math.min(1, Math.abs(session.velocity) / V_HI)
  if (velocityFactor <= 0 || p < GUIDE_MIN || p > GUIDE_MAX) return p

  let node = session.engagedNode
  if (node !== null) {
    if (Math.abs(p - node) > OFF_HALO) {
      session.engaged = false
      session.engagedNode = null
      node = null
    }
  } else {
    const nearest = nearestNode(p)
    if (Math.abs(p - nearest) <= ENTER_HALO) {
      session.engaged = true
      session.engagedNode = nearest
      node = nearest
    }
  }

  if (node === null) return p

  const d = Math.abs(p - node)
  const k = K_MAX * (1 - d / ENTER_HALO) * velocityFactor
  const guided = p + (node - p) * k

  return Math.min(1, Math.max(0, guided))
}

/** Nearest story node by linear distance (13 entries — trivial scan). */
function nearestNode(p: number): number {
  let best = GUIDE_NODES[0]
  let bestD = Math.abs(p - best)
  for (let i = 1; i < GUIDE_NODES.length; i++) {
    const d = Math.abs(p - GUIDE_NODES[i])
    if (d < bestD) {
      best = GUIDE_NODES[i]
      bestD = d
    }
  }
  return best
}