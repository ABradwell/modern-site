/**
 * The whole site's z-index scale. Six values, documented, and nothing else is
 * allowed. Arbitrary `z-50` sprinkled around a codebase is how stacking bugs
 * become unfixable.
 *
 * The landscape occupies two of these bands, deliberately sandwiching the page
 * content: the far band paints behind it, the near band in front. That overlap
 * is the "content emerges from beneath the terrain" effect, and it is pure paint
 * order rather than anything animated.
 */
export const Z = {
  /** far landscape: sky gradient, haze, orb, terrain depths 4 and 3 */
  landscapeFar: 0,
  /** page content */
  content: 10,
  /** near landscape: terrain depths 2 and 1. Must be pointer-events-none. */
  landscapeNear: 30,
  /** sticky site header and the trail nav */
  header: 40,
  /** mobile nav sheet */
  overlay: 50,
  /** fixed film grain, pointer-events-none */
  grain: 60,
} as const

/**
 * Local stacking order inside the landscape's own contexts. These never leak
 * to the page, so they can start from zero again.
 */
export const SCENE_Z = {
  sky: 0,
  haze: 1,
  orb: 2,
  terrain4: 3,
  terrain3: 4,
  water: 5,
  terrain2: 6,
  terrain1: 7,
} as const
