/**
 * The twenty silhouettes, declared.
 *
 * TILE GEOMETRY. `w` and `h` are viewBox units, so only their ratio matters.
 * Each tile is delivered as a CSS mask sized `auto <crest>`, which means:
 *
 *     rendered tile width  = crest_px * (w / h)
 *     rendered element w   = rendered tile width / count
 *     rendered element aspect = 0.85 * count * h / w
 *
 * Two numbers have to be right at once, and getting one of them backwards is
 * what made an earlier version of this file read as wallpaper.
 *
 *   1. ELEMENT ASPECT, held near 2.4 for every conifer band. That is what makes
 *      a distant tree the same SHAPE as a near one rather than a squashed
 *      version of it. Because it depends on count, count has to RISE with
 *      distance as the crest falls.
 *
 *   2. RENDERED TILE WIDTH, kept around 400 to 1100px so no band repeats more
 *      than about three times across a desktop viewport. Distant bands have the
 *      smallest crests, so they need the WIDEST viewBox aspect to still produce
 *      a wide tile. The ratios below therefore increase with distance:
 *      2.47, 2.78, 3.13, 3.66. An earlier version had them decreasing, which
 *      made the far bands repeat five to eight times and the repetition was the
 *      first thing the eye found.
 *
 * The four ratios are also mutually non-integer, so no two bands re-phase into a
 * visible beat at any viewport width.
 *
 * LAYOUT. `crest` is the tile's drawn height in vh. `bottom` is where the
 * layer's baseline sits, in dvh from the top of the viewport. Distant bands have
 * SMALLER bottoms because the horizon recedes upward. Summit is bottom - crest.
 *
 * The depth-1 `bottom` is capped at 106 so that every biome's near band,
 * including its 12dvh body, ends by 118dvh. Page content begins at an absolute
 * 120dvh on every route, so that cap is what guarantees the foreground band can
 * never paint over a heading. The two numbers are a pair: raising one without
 * the other puts terrain back on top of type.
 */
export const BANDS = [
  { depth: 1, w: 640, h: 259 }, // ratio 2.47
  { depth: 2, w: 700, h: 252 }, // ratio 2.78
  { depth: 3, w: 880, h: 281 }, // ratio 3.13
  { depth: 4, w: 760, h: 208 }, // ratio 3.66
]

/**
 * Grammars are mixed WITHIN a biome, not only between them, because four scaled
 * copies of one shape is exactly how a generated landscape gives itself away.
 *
 * `fill` overrides which rung of the colour ramp a layer takes. It is used once,
 * at the above-cloud station, where the cloud sea has to be paler than the rock
 * standing behind it.
 */
export const BIOMES = {
  forest: {
    label: 'Forest',
    layers: [
      // Summits at 70 / 74 / 76 / 77 dvh. Near band highest, because on flat
      // ground distant treetops sit LOWER, nearer the horizon.
      //
      // Bough counts fall 5 / 4 / 3 / 2 and never reach 1: a single bough
      // degenerates into a blunt pentagon that reads as a hill, not a tree.
      // Element counts rise 7 / 8 / 9 / 10 as the crests fall, which is what
      // holds rendered aspect at roughly 2.4 in all four bands.
      {
        grammar: 'conifers',
        seed: 1741,
        crest: 36,
        bottom: 106,
        count: 7,
        boughs: 5,
        snags: 1,
        minH: 0.5,
      },
      {
        grammar: 'conifers',
        seed: 2939,
        crest: 28,
        bottom: 102,
        count: 8,
        boughs: 4,
        minH: 0.46,
      },
      {
        grammar: 'conifers',
        seed: 3907,
        crest: 22,
        bottom: 98,
        count: 9,
        boughs: 3,
        minH: 0.42,
      },
      {
        grammar: 'conifers',
        seed: 4831,
        crest: 17,
        bottom: 94,
        count: 10,
        boughs: 2,
        minH: 0.4,
      },
    ],
  },
  plains: {
    label: 'Plains',
    layers: [
      // A low horizon and a large sky. Sentinel poplars break the horizontal so
      // the band does not read as a set of stacked rules.
      {
        grammar: 'grassland',
        seed: 5197,
        crest: 22,
        bottom: 100,
        rolls: 5,
        amp: 0.34,
        sentinels: 4,
      },
      {
        grammar: 'grassland',
        seed: 6143,
        crest: 18,
        bottom: 94,
        rolls: 5,
        amp: 0.4,
        sentinels: 5,
      },
      {
        grammar: 'ridge',
        seed: 7013,
        crest: 15,
        bottom: 89,
        peaks: 4,
        amp: 0.5,
        depth: 2,
        roughness: 0.38,
        smooth: true,
      },
      {
        grammar: 'cloudbank',
        seed: 8087,
        crest: 12,
        bottom: 84,
        lumps: 6,
        amp: 0.5,
        spread: 0.6,
      },
    ],
    // Middle distance, and the window is narrow. The near grass goes solid at
    // 93.6dvh and the mid grass at 88.3dvh, so a river below 88 is buried; above
    // about 84 it floats free of the far rises and reads as a ribbon in the sky.
    // 81 to 88dvh sits in front of the rises and just behind the mid grass.
    river: { bottom: 88, height: 7, periods: 2, amp: 0.13, thickness: 0.42 },
  },
  foothills: {
    label: 'Foothills',
    layers: [
      // Rolling rather than craggy: `smooth` rounds every vertex, which is what
      // separates this station from the mountains without a second grammar.
      {
        grammar: 'ridge',
        seed: 9109,
        crest: 30,
        bottom: 104,
        peaks: 3,
        amp: 0.6,
        depth: 3,
        roughness: 0.42,
        smooth: true,
      },
      {
        grammar: 'ridge',
        seed: 10133,
        crest: 26,
        bottom: 96,
        peaks: 4,
        amp: 0.66,
        depth: 3,
        roughness: 0.4,
        smooth: true,
      },
      {
        grammar: 'ridge',
        seed: 11197,
        crest: 22,
        bottom: 88,
        peaks: 5,
        amp: 0.6,
        depth: 3,
        roughness: 0.38,
        smooth: true,
      },
      {
        grammar: 'ridge',
        seed: 12203,
        crest: 18,
        bottom: 80,
        peaks: 6,
        amp: 0.52,
        depth: 2,
        roughness: 0.42,
        smooth: true,
      },
    ],
  },
  mountains: {
    label: 'Mountains',
    layers: [
      // Summits at 60 / 58 / 50 / 42 dvh, so the far range stands highest. That
      // is how a range actually reads: taller mountains seen over a nearer
      // ridge, not one ridge drawn four times. Angular, never smoothed.
      {
        grammar: 'ridge',
        seed: 13297,
        crest: 46,
        bottom: 106,
        peaks: 2,
        amp: 0.74,
        depth: 4,
        roughness: 0.52,
      },
      {
        grammar: 'ridge',
        seed: 14323,
        crest: 42,
        bottom: 100,
        peaks: 3,
        amp: 0.86,
        depth: 3,
        roughness: 0.5,
      },
      {
        grammar: 'ridge',
        seed: 15331,
        crest: 38,
        bottom: 88,
        peaks: 4,
        amp: 0.9,
        depth: 3,
        roughness: 0.46,
      },
      {
        grammar: 'ridge',
        seed: 16381,
        crest: 34,
        bottom: 76,
        peaks: 5,
        amp: 0.82,
        depth: 3,
        roughness: 0.5,
      },
    ],
  },
  abovecloud: {
    label: 'Above the cloud line',
    layers: [
      // A high pass, not a view straight down onto cloud. Dark rock near, a pale
      // cloud sea filling the valley, and distant summits standing above it. The
      // fill overrides invert the usual ramp for those two bands, because cloud
      // has to be paler than the rock behind it.
      {
        grammar: 'ridge',
        seed: 17401,
        crest: 34,
        bottom: 106,
        peaks: 2,
        amp: 0.72,
        depth: 3,
        roughness: 0.5,
      },
      {
        grammar: 'ridge',
        seed: 18427,
        crest: 28,
        bottom: 96,
        peaks: 3,
        amp: 0.66,
        depth: 2,
        roughness: 0.45,
      },
      {
        grammar: 'cloudbank',
        seed: 19433,
        crest: 16,
        bottom: 86,
        lumps: 4,
        amp: 0.66,
        fill: 4,
      },
      {
        grammar: 'ridge',
        seed: 20479,
        crest: 30,
        bottom: 78,
        peaks: 4,
        amp: 0.86,
        depth: 3,
        roughness: 0.5,
        fill: 3,
      },
    ],
  },
}
