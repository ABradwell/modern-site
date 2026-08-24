/**
 * The camera, and the twenty silhouettes it looks at.
 *
 * =========================================================================
 * THE CAMERA
 * =========================================================================
 *
 * Everything about how much depth a biome reads with comes down to one thing:
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
 * TILE GEOMETRY
 * =========================================================================
 *
 * `w` and `h` are viewBox units, so only their ratio matters. Each tile is
 * delivered as a CSS mask sized `auto <crest>`, which means:
 *
 *     rendered tile width      = crest_px * (w / h)
 *     rendered element width   = rendered tile width / count
 *     rendered element aspect  = 0.85 * count * h / w
 *
 * Two numbers have to be right at once, and getting one of them backwards is
 * what made an earlier version of this file read as wallpaper.
 *
 *   1. ELEMENT ASPECT, held near 2.4 for every conifer band. That is what makes
 *      a distant tree the same SHAPE as a near one rather than a squashed
 *      version of it. It depends only on count and ratio, NOT on crest, so
 *      element width is fixed the moment those two are chosen and `count` is
 *      free to be used for the second constraint below at no visual cost.
 *
 *   2. RENDERED TILE WIDTH, kept around 550 to 1600px so no band repeats more
 *      than about two and a half times across a desktop viewport. Distant bands
 *      have the smallest crests, so they need the WIDEST viewBox aspect to still
 *      produce a wide tile. The ratios below therefore increase with distance:
 *      3.30, 4.30, 5.30, 6.40. An earlier version had them decreasing, which
 *      made the far bands repeat five to eight times and the repetition was the
 *      first thing the eye found.
 *
 * The four ratios are mutually non-integer, so no two bands re-phase into a
 * visible beat at any viewport width.
 *
 * Height is the same 240 for all four on purpose. Only the ratio is meaningful,
 * so varying both numbers only ever hid what was being changed.
 */
export const BANDS = [
  { depth: 1, w: 792, h: 240 }, // ratio 3.30
  { depth: 2, w: 1032, h: 240 }, // ratio 4.30
  { depth: 3, w: 1272, h: 240 }, // ratio 5.30
  { depth: 4, w: 1536, h: 240 }, // ratio 6.40
]

/** The viewport the build log's px figures are quoted at. A common laptop. */
export const REFERENCE = { width: 1440, height: 900 }

/**
 * =========================================================================
 * THE BIOMES
 * =========================================================================
 *
 * Grammars are mixed WITHIN a biome, not only between them, because four scaled
 * copies of one shape is exactly how a generated landscape gives itself away.
 *
 * Element counts rise steeply with distance. That is not decoration: it is what
 * holds element aspect constant while the crest shrinks, and it is also correct
 * atmospheric perspective, since a distant treeline resolves into a fine
 * serration rather than into individual trees.
 *
 * `lift` departs from strict perspective. `fill` overrides which rung of the
 * colour ramp a layer takes; it is used once, at the above-cloud station, where
 * the cloud sea has to be paler than the rock standing behind it.
 */
export const BIOMES = {
  forest: {
    label: 'Forest',
    // One species, one height, so no lifts: pure 1 / d falloff. Ground lines at
    // 106 / 93.5 / 84.3 / 77.4dvh, which leaves 8.9, 6.5 and 4.9dvh of open
    // ground showing between successive rows. Those three numbers are the whole
    // effect, and the generator asserts them.
    nearCrest: 30,
    layers: [
      // Bough counts fall 5 / 4 / 3 / 2 and never reach 1: a single bough
      // degenerates into a blunt pentagon that reads as a hill, not a tree.
      { grammar: 'conifers', seed: 1741, count: 9, boughs: 5, snags: 1, minH: 0.5 },
      { grammar: 'conifers', seed: 2939, count: 12, boughs: 4, minH: 0.46 },
      { grammar: 'conifers', seed: 3907, count: 15, boughs: 3, minH: 0.44 },
      { grammar: 'conifers', seed: 4831, count: 18, boughs: 2, minH: 0.42 },
    ],
  },

  plains: {
    label: 'Plains',
    nearCrest: 24,
    layers: [
      // Sentinel poplars break the horizontal so the near bands do not read as a
      // set of stacked rules, and they give the eye something to measure the
      // ground plane against.
      { grammar: 'grassland', seed: 5197, rolls: 5, amp: 0.34, sentinels: 4 },
      { grammar: 'grassland', seed: 6143, rolls: 6, amp: 0.4, sentinels: 6 },
      // Far rises, smoothed so they are landform rather than crag.
      {
        grammar: 'ridge',
        seed: 7013,
        lift: 1.15,
        peaks: 6,
        amp: 0.5,
        depth: 2,
        roughness: 0.38,
        smooth: true,
      },
      { grammar: 'cloudbank', seed: 8087, lift: 1.3, lumps: 9, amp: 0.5, spread: 0.6 },
    ],
    /**
     * The river.
     *
     * A river lies IN the ground plane, which is the entire reason it needed the
     * camera fixed before it could work. It now sits in the open ground between
     * the near grass and the row behind: the band spans 93 to 104dvh, so its far
     * bank meets the foot of the second row's rises at 93.5dvh and its near bank
     * tucks under the near grass, whose solid ground starts at 103.1dvh.
     *
     * `taper` is the perspective cue that makes it read as water on a receding
     * plane rather than as a horizontal ribbon: the channel narrows where it
     * sits higher in the band, because higher in the band is further away.
     *
     * It also has to be painted IN FRONT OF row 2, not behind it. Behind, row
     * 2's solid ground hides it completely, which is what an earlier version did
     * and why the river kept having to be shoved up into the sky to be seen.
     */
    river: {
      w: 900,
      h: 130,
      bottom: 104,
      height: 11,
      periods: 2,
      amp: 0.18,
      thickness: 0.5,
      taper: 0.42,
    },
  },

  foothills: {
    label: 'Foothills',
    nearCrest: 30,
    // Rolling rather than craggy: `smooth` rounds every vertex, which is what
    // separates this station from the mountains without a second grammar. Lifts
    // rise with distance because a receding range of hills does not shrink as
    // fast as one hill would: the ones behind are bigger hills.
    layers: [
      {
        grammar: 'ridge',
        seed: 9109,
        peaks: 4,
        amp: 0.6,
        depth: 3,
        roughness: 0.42,
        smooth: true,
      },
      {
        grammar: 'ridge',
        seed: 10133,
        lift: 1.05,
        peaks: 5,
        amp: 0.66,
        depth: 3,
        roughness: 0.4,
        smooth: true,
      },
      {
        grammar: 'ridge',
        seed: 11197,
        lift: 1.2,
        peaks: 7,
        amp: 0.6,
        depth: 3,
        roughness: 0.38,
        smooth: true,
      },
      {
        grammar: 'ridge',
        seed: 12203,
        lift: 1.4,
        peaks: 9,
        amp: 0.52,
        depth: 2,
        roughness: 0.42,
        smooth: true,
      },
    ],
  },

  mountains: {
    label: 'Mountains',
    nearCrest: 34,
    // Summits at 72 / 60.8 / 52.6 / 47.1dvh, so the far range stands highest.
    // That is how a range actually reads: taller mountains seen over a nearer
    // ridge, not one ridge drawn four times. The lifts are steep for exactly
    // that reason, and they are the honest version of it: apparent height still
    // FALLS with distance, just more slowly than 1 / d. Angular, never smoothed.
    layers: [
      { grammar: 'ridge', seed: 13297, peaks: 4, amp: 0.74, depth: 4, roughness: 0.52 },
      {
        grammar: 'ridge',
        seed: 14323,
        lift: 1.3,
        peaks: 5,
        amp: 0.86,
        depth: 3,
        roughness: 0.5,
      },
      {
        grammar: 'ridge',
        seed: 15331,
        lift: 1.7,
        peaks: 7,
        amp: 0.9,
        depth: 3,
        roughness: 0.46,
      },
      {
        grammar: 'ridge',
        seed: 16381,
        lift: 2.2,
        peaks: 8,
        amp: 0.82,
        depth: 3,
        roughness: 0.5,
      },
    ],
  },

  abovecloud: {
    label: 'Above the cloud line',
    nearCrest: 30,
    // A high pass, not a view straight down onto cloud. Dark rock near, a pale
    // cloud sea filling the valley, distant summits standing above it.
    //
    // The cloud's summit at 68.7dvh sits BELOW the near rock's at 63.5, which is
    // the one place on the site where the summit ladder is deliberately out of
    // order: the near ridge has to poke above the cloud sea or there is no pass,
    // only weather. The generator allows it because that row still shows 5.6dvh
    // of open ground, so the depth reads without the summit needing to clear.
    layers: [
      { grammar: 'ridge', seed: 17401, peaks: 4, amp: 0.72, depth: 3, roughness: 0.5 },
      {
        grammar: 'ridge',
        seed: 18427,
        lift: 1.35,
        peaks: 5,
        amp: 0.78,
        depth: 2,
        roughness: 0.45,
      },
      {
        grammar: 'cloudbank',
        seed: 19433,
        lift: 0.95,
        lumps: 6,
        amp: 0.66,
        spread: 0.72,
        fill: 4,
      },
      {
        grammar: 'ridge',
        seed: 20479,
        lift: 2.15,
        peaks: 7,
        amp: 0.86,
        depth: 3,
        roughness: 0.5,
        fill: 3,
      },
    ],
  },
}
