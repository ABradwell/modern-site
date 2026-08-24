/**
 * The twenty silhouettes, declared.
 *
 * Tile geometry per depth band. `w`/`h` are viewBox units, so only their ratio
 * matters: the mask is sized `auto <crest>`, meaning rendered tile width is
 * crest * (w/h). The four ratios are chosen so no two rendered widths sit at a
 * small integer multiple of each other, which is what stops the layers
 * re-phasing into a visible wallpaper repeat at any viewport width.
 *
 * `crest` is the CSS height the tile is drawn at, and it falls with distance
 * along with element count, which is atmospheric perspective and performance
 * discipline arriving at the same answer.
 */
export const BANDS = [
  { depth: 1, w: 640, h: 270, crest: 'clamp(96px, 26vh, 300px)' },
  { depth: 2, w: 700, h: 346, crest: 'clamp(82px, 22vh, 252px)' },
  { depth: 3, w: 880, h: 568, crest: 'clamp(66px, 18vh, 204px)' },
  { depth: 4, w: 760, h: 500, crest: 'clamp(52px, 14vh, 158px)' },
]

/**
 * Each biome names a grammar per depth. Grammars are deliberately mixed WITHIN
 * a biome, not just between them, because four scaled copies of one shape is
 * exactly how a generated treeline gives itself away.
 *
 * The above-cloud station inverts the usual arrangement: cloud in front, rock
 * behind. That is what standing above the cloud line actually looks like.
 */
export const BIOMES = {
  forest: {
    label: 'Forest',
    layers: [
      { grammar: 'conifers', seed: 1741, count: 7, boughs: 5, snags: 1, minH: 0.5 },
      { grammar: 'conifers', seed: 2939, count: 11, boughs: 4, minH: 0.44 },
      { grammar: 'conifers', seed: 3907, count: 17, boughs: 2, minH: 0.38 },
      { grammar: 'cloudbank', seed: 4831, lumps: 14, amp: 0.5 },
    ],
  },
  plains: {
    label: 'Plains',
    layers: [
      { grammar: 'grassland', seed: 5197, rolls: 5, amp: 0.1, tufts: 7 },
      { grammar: 'grassland', seed: 6143, rolls: 4, amp: 0.15, tufts: 3 },
      { grammar: 'ridge', seed: 7013, peaks: 3, amp: 0.24, depth: 1, roughness: 0.36 },
      { grammar: 'cloudbank', seed: 8087, lumps: 9, amp: 0.36 },
    ],
    river: { periods: 2, amp: 0.055, thickness: 0.3 },
  },
  foothills: {
    label: 'Foothills',
    layers: [
      { grammar: 'ridge', seed: 9109, peaks: 3, amp: 0.44, depth: 2, roughness: 0.34 },
      { grammar: 'ridge', seed: 10133, peaks: 4, amp: 0.52, depth: 2, roughness: 0.32 },
      { grammar: 'ridge', seed: 11197, peaks: 5, amp: 0.44, depth: 1, roughness: 0.3 },
      { grammar: 'ridge', seed: 12203, peaks: 7, amp: 0.34, depth: 1, roughness: 0.28 },
    ],
  },
  mountains: {
    label: 'Mountains',
    layers: [
      { grammar: 'ridge', seed: 13297, peaks: 2, amp: 0.86, depth: 4, roughness: 0.52 },
      { grammar: 'ridge', seed: 14323, peaks: 3, amp: 0.92, depth: 3, roughness: 0.5 },
      { grammar: 'ridge', seed: 15331, peaks: 4, amp: 0.78, depth: 3, roughness: 0.46 },
      { grammar: 'ridge', seed: 16381, peaks: 5, amp: 0.62, depth: 2, roughness: 0.42 },
    ],
  },
  abovecloud: {
    label: 'Above the cloud line',
    layers: [
      { grammar: 'cloudbank', seed: 17401, lumps: 5, amp: 0.82 },
      { grammar: 'cloudbank', seed: 18427, lumps: 7, amp: 0.66 },
      { grammar: 'cloudbank', seed: 19433, lumps: 10, amp: 0.5 },
      { grammar: 'ridge', seed: 20479, peaks: 3, amp: 0.54, depth: 3, roughness: 0.5 },
    ],
  },
}
