/**
 * Shared motion constants, so every reveal on the site moves the same way.
 *
 * The curve is an expo-out. The 600ms / 12px / 80ms-stagger figures are the
 * quiet end of the scale on purpose: motion here exists to establish reading
 * order, not to perform.
 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export const REVEAL_DURATION = 0.6
export const REVEAL_OFFSET = 12
export const REVEAL_STAGGER = 0.08

/** Motion's whileInView config, shared so reveals trigger consistently. */
export const REVEAL_VIEWPORT = { once: true, amount: 0.3 } as const

/**
 * Horizontal pan springs, one per depth band.
 *
 * Every band targets the SAME offset, so the biomes are perfectly aligned at
 * rest and only diverge mid-transition. Near terrain sweeps past while distant
 * ridges barely shift, which is how parallax works in the world. That is the
 * entire trick, and it costs four animated transforms.
 */
export const PAN_SPRING = {
  terrain1: { stiffness: 90, damping: 22, mass: 1 },
  terrain2: { stiffness: 74, damping: 22, mass: 1 },
  terrain3: { stiffness: 60, damping: 22, mass: 1 },
  terrain4: { stiffness: 48, damping: 22, mass: 1 },
  sky: { stiffness: 40, damping: 24, mass: 1 },
} as const

/**
 * Vertical parallax depth, expressed as the translateY in vh each layer has
 * reached at scroll progress 1.
 *
 * Larger means deeper, because a deeper layer cancels more of the scroll and so
 * appears to move up more slowly. Content cancels nothing, which is why it
 * moves fastest of all and emerges from beneath the near terrain.
 */
export const DRIFT = {
  sky: 52,
  haze: 38,
  orb: 52,
  copy: 14,
  terrain4: 27,
  terrain3: 19,
  water: 15,
  terrain2: 12,
  terrain1: 6,
} as const

/** Below md, halve every differential and drop one terrain layer. */
export const MOBILE_DRIFT_SCALE = 0.5
