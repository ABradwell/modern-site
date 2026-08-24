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
 * Horizontal pan between stations. ONE spring, shared by every depth band.
 *
 * Per-depth stiffness was tried and rejected. It is textbook parallax, and on a
 * full-viewport slide it was actively unpleasant: bands arriving at different
 * times read as the world coming apart rather than as depth, and it induced
 * motion sickness. Depth belongs on the vertical axis, where the reader controls
 * the rate. Horizontally the landscape moves as one image.
 *
 * Damping ratio here is 26 / (2 * sqrt(80)) = 1.45, comfortably overdamped, so
 * the slide settles without overshoot. A viewport-wide slide that bounces at the
 * end is the other way to make this motion unpleasant.
 */
export const PAN_SPRING = { stiffness: 80, damping: 26, mass: 1 } as const

/**
 * Vertical parallax, as a multiple of scroll distance.
 *
 * These are absolute speeds, not relative offsets, because the landscape is
 * `position: fixed` and therefore moves at 0 by default. To make a fixed layer
 * behave as if it sat at depth k, translate it by -scrollY * k.
 *
 * Parallax speed rises toward the viewer, so the nearest band is fastest. Every
 * band except terrain1 stays BELOW 1.0, which means page content, moving at
 * exactly 1.0, gradually rises and covers them. That is the correct reading:
 * the page comes up out of the landscape.
 *
 * terrain1 is a touch ABOVE 1.0 because it is the one band painted in front of
 * content. It has to drift upward slightly faster than the page so its overlap
 * with the top of the content block closes as the reader scrolls, instead of
 * travelling along with the page and sitting on it permanently.
 *
 * water sits BETWEEN terrain2 and content, not behind terrain2, because the
 * river lies in the ground plane in front of row 2. It was 0.82 while the river
 * was painted behind that row; at that speed it drifted out from under the near
 * grass as the reader scrolled and eventually floated clear of the bank.
 *
 *   sky 0.40  <  haze 0.52  <  terrain4 0.66  <  terrain3 0.76
 *             <  terrain2 0.92  <  water 0.96  <  CONTENT 1.00  <  terrain1 1.08
 */
export const SPEED = {
  sky: 0.4,
  orb: 0.4,
  haze: 0.52,
  terrain4: 0.66,
  terrain3: 0.76,
  terrain2: 0.92,
  water: 0.96,
  terrain1: 1.08,
} as const

/**
 * Where page content begins, in dvh below the end of the hero.
 *
 * With a 100dvh hero on every route this puts content at an absolute 120dvh,
 * which is 2dvh clear of the furthest the foreground treeline can reach. See the
 * depth-1 cap in scripts/lib/terrain-config.mjs: the two numbers are a pair, and
 * raising either without the other puts terrain back on top of type.
 */
export const CONTENT_OFFSET_DVH = 20
