import { STATIONS } from './stations.mjs'

/**
 * The camera, and the route it looks along.
 *
 * =========================================================================
 * THE CAMERA
 * =========================================================================
 *
 * Everything about how much depth the landscape reads with comes down to one thing:
 * how far apart the rows' GROUND LINES sit. That distance is the camera angle.
 *
 * A camera at eye level sees the ground plane almost edge-on, so every row's
 * ground line lands within a couple of dvh of the row in front. An earlier
 * version of this file did exactly that: the forest's four rows had ground
 * lines at 94 / 98 / 102 / 106dvh, a 4dvh ladder, while the trees standing on
 * them were 17 to 36dvh tall. Every row behind the first was therefore buried
 * behind the trunks of the row in front, so the four bands merged into one dense
 * mass of trees. That is also why the plains river was unreadable: a river lies
 * IN the ground plane, and at that angle there was no ground plane to lie in,
 * only a 12dvh sliver between the near grass and the horizon.
 *
 * Raising the camera and tilting it down opens the ground plane out. The rows
 * separate, a strip of the row behind shows between the trunks of the row in
 * front, and a river has somewhere to sit.
 *
 * The model is ordinary linear perspective. A row's distance below the horizon
 * on screen is proportional to 1 / its distance from the camera, so successive
 * rows converge geometrically on the horizon rather than stepping evenly:
 *
 *     groundLine(i) = horizon + (nearBase - horizon) * recession^i
 *
 * and apparent size falls off at the same rate, because it is the same 1 / d:
 *
 *     crest(i) = nearCrest * recession^i * lift
 *
 * `recession` IS the camera angle, and it is the one number to change. Toward 1
 * the rows bunch back onto a single line (camera drops to eye level); downward
 * the ground plane opens out further (camera lifts and tilts down).
 */
export const CAMERA = {
  /** dvh at which the ground plane converges. */
  horizon: 58,
  /**
   * dvh of the nearest row's ground line.
   *
   * Capped at 106 so the near band, plus the 24dvh body it carries beneath it,
   * has faded out before page content starts at an absolute 120dvh. Paired with
   * CONTENT_OFFSET_DVH in src/lib/motion.ts: raising either without the other
   * puts foreground terrain back on top of type.
   */
  nearBase: 106,
  /** Ground-line spacing, and so the camera angle. See above. */
  recession: 0.74,
}

/** dvh of row `i`'s ground line. Row 0 is nearest. */
export function groundLine(i) {
  return round1(
    CAMERA.horizon + (CAMERA.nearBase - CAMERA.horizon) * CAMERA.recession ** i,
  )
}

/**
 * Apparent height of row `i`'s silhouette, in dvh.
 *
 * `lift` is a deliberate departure from perspective, and every use of it is a
 * real-world fact rather than a fudge: a distant mountain range genuinely is
 * taller than the ridge in front of it, so its apparent height falls off more
 * slowly than 1 / d. Forest rows, which are all the same species at the same
 * height, take no lift at all.
 */
export function apparentCrest(nearCrest, i, lift = 1) {
  return round1(nearCrest * CAMERA.recession ** i * lift)
}

const round1 = (n) => Math.round(n * 10) / 10

/**
 * =========================================================================
 * THE STRIP
 * =========================================================================
 *
 * The panorama is one strip, read west to east, as wide as every station plus
 * its gutter. Mirrors src/lib/station-geometry.ts, which the page uses to aim
 * the pan; the generator emits STRIP_VW into the generated file and the
 * landscape checks the two agree.
 *
 * At rest, station i fills the window [116i, 116i + 100] in viewport widths:
 *
 *     Home [0, 100]   Experience [116, 216]   Projects [232, 332]   Writing [348, 448]
 *
 * Every x in this file is in those units.
 */
export const SPAN_VW = 116
export const STRIP_VW = STATIONS.length * SPAN_VW

/** The viewport the build log's px figures are quoted at. A common laptop. */
export const REFERENCE = { width: 1440, height: 900 }

/**
 * The viewport shape the panorama is designed at, width over scene height.
 *
 * Positions are in viewport widths and sizes in scene units, so the shape of
 * the viewport decides how closely things stand. This is the shape at which
 * the spacings below are exactly as written; level of detail (see LOD in
 * globals.css) holds the density within a factor of two of it everywhere else.
 */
export const DESIGN_ASPECT = 1.75

/**
 * How far a row's solid ground extends below its own ground line, and the
 * fraction of that which stays solid before it dissolves.
 *
 * This is a BAND, not a floor. An earlier version ran every layer down to a
 * fixed 168dvh, which gave the near row a 60dvh slab of solid colour that swept
 * up and filled the window a few hundred pixels into the scroll, because the
 * near row travels faster than the page. At 24 it still overhangs the top of the
 * page content, so content passes behind the canopy, but it clears the window.
 * The dissolve starts early on purpose: a long, soft fade is what makes content
 * look like it comes out from under the trees rather than from behind a slab.
 */
export const BODY_VU = 24
export const SOLID_TO = 0.4

/**
 * Where a row's trees and rocks stand, as a fraction of its nominal crest above
 * its ground line. The strip between the two is solid ground, which is the
 * floor the eye sees between one row and the next.
 */
export const GROUND = 0.12

/**
 * The highest anything in the near row may reach, in scene units. The hero's
 * copy has to finish above it at every height down to the --scene floor; see
 * globals.css.
 */
export const NEAR_TOP = 76

/**
 * =========================================================================
 * THE ROUTE
 * =========================================================================
 *
 * One world, walked west to east. Each row is a list of regions, and regions
 * overlap: where the woods thin, the meadow is already underneath them, so an
 * edge is a change of density rather than a seam. Rows change at DIFFERENT
 * places on purpose. Walking out of a forest, the trees beside you end first
 * and the far treeline carries on, so the near row opens into the clearing
 * while the rows behind are still woods.
 *
 *   HOME        Deep woods. Four rows of conifers, no open ground but the floor.
 *   EXPERIENCE  The near trees thin out and give way to a meadow. A river comes
 *               out from under them and winds east across the clearing, past
 *               poplars, with the woods still standing on its far side and
 *               distant hills rising behind them.
 *   PROJECTS    The river runs behind a low hill and opens into a lake at the
 *               foot of the mountains.
 *   WRITING     The ground climbs into rock, and above it the valley is filled
 *               with cloud, with distant summits standing clear of it.
 *
 * Region kinds:
 *
 *   forest  conifers, placed one by one. `density` is a list of [x, d] keys,
 *           read as 1 before the first key and linear between them. Low density
 *           spaces trees out and shortens them, which is how a forest edge
 *           actually reads.
 *   meadow  a low rolling ground profile, with lombardy poplars `every` so many
 *           viewport widths.
 *   massif  one standing hill, with poplars baked into it.
 *   range   a run of mountains: one massif per peak, unique, on a shoulder of
 *           continuous ground so the range never shows sky between its feet.
 *   cloud   the cloud sea, as a profile.
 *
 * `crest` is the tallest a region's shapes may stand above its ground line
 * before GROUND is taken off. Wherever it describes a row of one kind of thing,
 * conifers or a mountain range, it comes from apparentCrest, so it falls off
 * with distance at the camera's rate; `lift` is what lets a far range stand
 * taller than the ridge in front of it.
 * `fill` overrides which rung of the colour ramp a region takes; it is used
 * where the cloud sea has to be paler than the rock standing behind it.
 */
export const ROWS = [
  {
    depth: 1,
    nominalCrest: apparentCrest(30, 0),
    regions: [
      {
        kind: 'forest',
        seed: 1741,
        from: -24,
        to: 134,
        crest: apparentCrest(30, 0),
        boughs: 5,
        minH: 0.5,
        snags: 0.05,
        density: [
          [90, 1],
          [104, 0.6],
          [116, 0.28],
          [128, 0.1],
          [134, 0],
        ],
      },
      {
        kind: 'meadow',
        seed: 5197,
        from: 98,
        to: 214,
        rise: 3.4,
        poplars: { every: 24, height: [9, 15] },
      },
      {
        // The hill the river runs behind. It sits in the gutter between
        // Experience and Projects, so at rest it is the right-hand edge of the
        // clearing and the left-hand edge of the lake.
        kind: 'massif',
        seed: 5233,
        at: 222,
        height: 17,
        aspect: 3.1,
        peaks: 2,
        depth: 3,
        roughness: 0.4,
        saddle: 0.8,
        smooth: true,
        poplars: [0.58, 0.66],
      },
      {
        // The lake shore. Low, so the water reads across it.
        kind: 'meadow',
        seed: 5309,
        from: 210,
        to: 344,
        rise: 1.1,
        poplars: { every: 44, height: [7, 11] },
      },
      {
        kind: 'range',
        seed: 17401,
        from: 334,
        to: 490,
        crest: apparentCrest(30, 0),
        aspect: [1.9, 2.6],
        peaks: 2,
        depth: 3,
        roughness: 0.5,
        shoulder: 7,
      },
    ],
  },
  {
    depth: 2,
    nominalCrest: apparentCrest(30, 1),
    regions: [
      {
        kind: 'forest',
        seed: 2939,
        from: -24,
        to: 164,
        crest: apparentCrest(30, 1),
        boughs: 4,
        minH: 0.46,
        density: [
          [118, 1],
          [132, 0.6],
          [146, 0.25],
          [158, 0.08],
          [164, 0],
        ],
      },
      {
        kind: 'meadow',
        seed: 6143,
        from: 124,
        to: 222,
        rise: 2,
        poplars: { every: 28, height: [5.5, 9] },
      },
      {
        kind: 'range',
        seed: 12203,
        from: 198,
        to: 256,
        crest: 18,
        aspect: [2.8, 3.6],
        peaks: 1,
        depth: 3,
        roughness: 0.42,
        smooth: true,
        shoulder: 4,
      },
      {
        kind: 'range',
        seed: 15331,
        from: 240,
        to: 346,
        crest: apparentCrest(34, 1, 1.3),
        aspect: [2, 2.9],
        peaks: 2,
        depth: 3,
        roughness: 0.46,
        shoulder: 8,
      },
      {
        kind: 'range',
        seed: 18427,
        from: 338,
        to: 490,
        crest: apparentCrest(30, 1, 1.35),
        aspect: [2, 2.8],
        peaks: 2,
        depth: 3,
        roughness: 0.45,
        shoulder: 8,
      },
    ],
  },
  {
    depth: 3,
    nominalCrest: apparentCrest(30, 2),
    regions: [
      {
        // The far side of the clearing stays wooded well past the near edge.
        kind: 'forest',
        seed: 3907,
        from: -24,
        to: 216,
        crest: apparentCrest(30, 2),
        boughs: 3,
        minH: 0.44,
        density: [
          [150, 1],
          [180, 0.75],
          [200, 0.35],
          [212, 0.1],
          [216, 0],
        ],
      },
      {
        kind: 'range',
        seed: 11197,
        from: 186,
        to: 244,
        crest: 15,
        aspect: [2.8, 3.8],
        peaks: 2,
        depth: 3,
        roughness: 0.38,
        smooth: true,
        shoulder: 3,
      },
      {
        kind: 'range',
        seed: 14323,
        from: 226,
        to: 352,
        crest: apparentCrest(34, 2, 1.7),
        aspect: [2, 2.9],
        peaks: 2,
        depth: 3,
        roughness: 0.5,
        shoulder: 9,
      },
      {
        // Paler than the rock behind it, or there is no cloud line, only weather.
        kind: 'cloud',
        seed: 19433,
        from: 340,
        to: 490,
        crest: apparentCrest(30, 2, 0.95),
        deck: 5.5,
        fill: 4,
      },
    ],
  },
  {
    depth: 4,
    nominalCrest: apparentCrest(30, 3),
    regions: [
      {
        kind: 'forest',
        seed: 4831,
        from: -24,
        to: 178,
        crest: apparentCrest(30, 3),
        boughs: 2,
        minH: 0.42,
        density: [
          [128, 1],
          [156, 0.55],
          [172, 0.15],
          [178, 0],
        ],
      },
      {
        // Distant hills behind the clearing: the first sign of the mountains.
        kind: 'range',
        seed: 8087,
        from: 138,
        to: 216,
        crest: 13,
        aspect: [3, 4],
        peaks: 2,
        depth: 3,
        roughness: 0.38,
        smooth: true,
        shoulder: 3,
      },
      {
        // Summits at roughly 47 scene units, so the far range stands highest.
        // That is how a range reads: taller mountains seen over a nearer ridge.
        kind: 'range',
        seed: 13297,
        from: 196,
        to: 354,
        crest: apparentCrest(34, 3, 2.2),
        aspect: [1.9, 2.8],
        peaks: 2,
        depth: 3,
        roughness: 0.52,
        shoulder: 7,
      },
      {
        kind: 'range',
        seed: 20479,
        from: 342,
        to: 490,
        crest: apparentCrest(30, 3, 2.15),
        aspect: [2, 2.8],
        peaks: 2,
        depth: 3,
        roughness: 0.5,
        shoulder: 6,
        fill: 3,
      },
    ],
  },
]

/**
 * The river and the lake.
 *
 * Painted after row 2 and before row 1: water lies in the ground plane in front
 * of row 2, and behind it that row's solid ground would hide it completely.
 *
 * The river rises under the near trees at the woods' edge, winds east across the
 * clearing, passes behind the hill and opens into the lake. Its far bank has to
 * stay in front of row 2's ground line and its near bank tucks under the near
 * row; the generator checks both.
 *
 * `width` is the perspective, as half-width per scene unit below the horizon.
 */
export const WATER = {
  seed: 23011,
  river: { from: 100, to: 254, y: 98.4, swing: 2.4, width: 0.05, wavelengths: [44, 19] },
  lake: { from: 246, to: 324, y: 99.6, half: 4.9, waver: 0.9 },
}
