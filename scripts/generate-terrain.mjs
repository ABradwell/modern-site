/**
 * Generates src/content/terrain.generated.ts: the panorama.
 *
 * Output is deterministic: the same seeds produce the same shapes on every
 * machine and every build. That is why it is committed rather than generated at
 * runtime. Zero cost at render, no risk of a hydration mismatch, and a
 * reviewable diff when the landscape changes.
 *
 *   pnpm terrain            regenerate and validate
 *   pnpm terrain --preview  also write flattened SVGs to .terrain-preview/
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { STATIONS } from './lib/stations.mjs'
import {
  BODY_VU,
  CAMERA,
  DESIGN_ASPECT,
  GROUND,
  NEAR_TOP,
  REFERENCE,
  ROWS,
  SOLID_TO,
  SPAN_VW,
  STRIP_VW,
  WATER,
  groundLine,
} from './lib/terrain-config.mjs'
import {
  SYMBOL_H,
  UNIT,
  cloudSea,
  conifer,
  envelope,
  massif,
  poplar,
  profile,
  rng,
  snag,
  water,
  waves,
} from './lib/terrain-grammars.mjs'
import { renderWindow } from './lib/terrain-render.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const preview = process.argv.includes('--preview')

/**
 * How far past each end of the strip the world is drawn. A swipe past the first
 * or last station moves the strip a little, against resistance, and the edge of
 * the world must never be what it reveals.
 */
const EXTENT = [-24, STRIP_VW + 26]

/** Floor for the open ground visible between one row and the next, in scene units. */
const MIN_STRIP = 3.5

/** Distinct conifers per forest region, and massifs per range. */
const TREE_POOL = 10

/** See lodOf, and BOX in src/components/landscape/panorama.tsx. */
const BOX_FIT = 2.6
const MASSIF_POOL = 6

const round1 = (n) => Math.round(n * 10) / 10
const round2 = (n) => Math.round(n * 100) / 100

/**
 * Level of detail for the n-th shape placed in a region: every other one is
 * detail.
 *
 * Shapes are placed in viewport widths and sized in scene units. Down to
 * BOX_FIT times narrower than the design shape they keep their size, so as the
 * viewport narrows they stand closer together; below that they scale down with
 * the width (see panorama.tsx) and their spacing stops changing. One cut-off is
 * therefore enough: under 7:5, the `.lod-1` rule in globals.css hides every
 * other shape, and the density stays within a factor of two of the design
 * everywhere from a folded phone to an ultrawide.
 */
const lodOf = (n) => n % 2

/** Piecewise-linear density from [x, d] keys; the first key holds to the west. */
function densityAt(keys, x) {
  if (x <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [x1, d1] = keys[i]
    if (x <= x1) {
      const [x0, d0] = keys[i - 1]
      return d0 + ((d1 - d0) * (x - x0)) / (x1 - x0)
    }
  }
  return keys[keys.length - 1][1]
}

// --- region builders --------------------------------------------------------

/**
 * Conifers, placed one at a time, about a quarter of the crest apart, so that
 * neighbours overlap and a forest reads as one mass rather than as a fence. Low density spaces trees out, makes each one less likely to appear,
 * and shortens it, which together read as the light opening up at an edge.
 */
function forest(region, { symbols, group }) {
  const rand = rng(region.seed)
  const first = symbols.length
  for (let k = 0; k < TREE_POOL; k += 1) {
    symbols.push(
      conifer(region.seed + 101 * (k + 1), {
        aspect: 0.42 + rand() * 0.32,
        boughs: region.boughs,
      }),
    )
  }
  const snagAt = region.snags ? symbols.push(snag()) - 1 : -1

  const step = (0.26 * region.crest) / DESIGN_ASPECT
  let x = region.from
  let n = 0
  while (x < region.to) {
    const d = Math.max(0, densityAt(region.density, x))
    // Every draw happens before any branch, so the sequence does not depend on
    // which trees were placed and a density tweak cannot reshuffle the forest.
    const [keep, tall, dead, pick, gap] = [rand(), rand(), rand(), rand(), rand()]
    if (d > 0 && keep < Math.min(1, d * 1.15)) {
      const h =
        region.crest * 0.85 * (region.minH + tall * (1 - region.minH)) * (0.55 + 0.45 * d)
      const sym =
        snagAt >= 0 && dead < region.snags * d
          ? snagAt
          : first + Math.floor(pick * TREE_POOL)
      group.uses.push([sym, round2(x), round2(h), lodOf(n)])
      n += 1
    }
    x += (step * (0.88 + gap * 0.24)) / (0.35 + 0.65 * d)
  }
}

/** Rolling ground and its poplars. Poplars never take a level of detail: there are too few. */
function meadow(region, { base, symbols, group }) {
  const rand = rng(region.seed)
  const roll = waves(rand, [16, 31, 47])
  group.ground.push(
    profile(region.from, region.to, base, (x) => {
      return (
        region.rise * (0.55 + 0.45 * roll(x)) * envelope(x, region.from, region.to, 6)
      )
    }),
  )
  if (!region.poplars) return

  const first = symbols.length
  for (let k = 0; k < 4; k += 1) symbols.push(poplar(region.seed + 31 * (k + 1)))
  const { every, height } = region.poplars
  let x = region.from + every * (0.3 + rand() * 0.5)
  while (x < region.to - 4) {
    const [pick, tall, pair, pairPick, pairGap, pairTall, gap] = Array.from(
      { length: 7 },
      rand,
    )
    const h = height[0] + tall * (height[1] - height[0])
    group.uses.push([first + Math.floor(pick * 4), round2(x), round2(h), 0])
    // Poplars are planted, and planted trees come in pairs as often as not.
    if (pair < 0.35) {
      group.uses.push([
        first + Math.floor(pairPick * 4),
        round2(x + 1.2 + pairGap * 1.5),
        round2(h * (0.7 + pairTall * 0.2)),
        0,
      ])
    }
    x += every * (0.65 + gap * 0.7)
  }
}

function single(region, { symbols, group }) {
  const sym = massif(region.seed, region)
  symbols.push(sym)
  // A poplar on the hill can lift the symbol above the hilltop; scale the
  // placement with it so `height` stays the height of the hill.
  group.uses.push([
    symbols.length - 1,
    region.at,
    round2((region.height * sym.h) / SYMBOL_H),
    0,
  ])
}

/**
 * A mountain range: overlapping massifs on a continuous shoulder. Peaks rise
 * toward the middle of the region and fall away at its ends, so a range has a
 * shape of its own rather than starting at full height. The shoulder is what
 * keeps sky from showing between their feet when level of detail thins them.
 */
function range(region, { base, symbols, group }) {
  const rand = rng(region.seed)
  const sh = waves(rand, [23, 41])
  group.ground.push(
    profile(
      region.from,
      region.to,
      base,
      (x) =>
        region.shoulder * (0.6 + 0.4 * sh(x)) * envelope(x, region.from, region.to, 14),
      3,
    ),
  )

  const [lo, hi] = region.aspect
  const first = symbols.length
  for (let k = 0; k < MASSIF_POOL; k += 1) {
    symbols.push(
      massif(region.seed + 97 * (k + 1), {
        aspect: lo + ((hi - lo) * k) / (MASSIF_POOL - 1),
        peaks: region.peaks,
        depth: region.depth,
        roughness: region.roughness,
        smooth: region.smooth,
      }),
    )
  }

  const meanH = region.crest * 0.85 * 0.78
  const step = (0.7 * meanH * (lo + hi)) / 2 / DESIGN_ASPECT
  let x = region.from + step * 0.5
  let n = 0
  while (x < region.to - step * 0.3) {
    const [tall, pick, gap] = [rand(), rand(), rand()]
    const rise = 0.45 + 0.55 * envelope(x, region.from, region.to, 18)
    const h = region.crest * 0.85 * (0.6 + 0.4 * tall) * rise
    group.uses.push([
      first + Math.floor(pick * MASSIF_POOL),
      round2(x),
      round2(h),
      lodOf(n),
    ])
    n += 1
    x += step * (0.75 + gap * 0.5)
  }
}

function cloud(region, { base, group }) {
  const rand = rng(region.seed)
  group.ground.push(
    cloudSea(rand, {
      from: region.from,
      to: region.to,
      base,
      height: region.crest * 0.85,
      deck: region.deck,
    }),
  )
}

const BUILDERS = { forest, meadow, massif: single, range, cloud }

// --- build ------------------------------------------------------------------

let failures = 0
const fail = (message) => {
  failures += 1
  console.log(`FAIL  ${message}`)
}

const rows = ROWS.map((spec, i) => {
  // Ground line from the camera, never declared per row. See CAMERA in
  // scripts/lib/terrain-config.mjs: the ladder of ground lines IS the angle.
  const bottom = groundLine(i)
  const base = round1(bottom - GROUND * spec.nominalCrest)
  const symbols = []
  const groups = new Map()
  const groupFor = (fill) => {
    if (!groups.has(fill)) groups.set(fill, { fill, body: [], ground: [], uses: [] })
    return groups.get(fill)
  }

  groupFor(spec.depth).body.push(EXTENT)
  for (const region of spec.regions) {
    const build = BUILDERS[region.kind]
    if (!build)
      throw new Error(`unknown region kind "${region.kind}" in row ${spec.depth}`)
    const fill = region.fill ?? spec.depth
    const group = groupFor(fill)
    // A region with its own colour brings its own ground with it.
    if (fill !== spec.depth) group.body.push([region.from, region.to])
    build(region, { base, symbols, group })
  }

  return {
    depth: spec.depth,
    bottom,
    base,
    symbols,
    fills: [...groups.values()].map((g) => ({ ...g, ground: g.ground.join('') })),
  }
})

const waterShape = water(rng(WATER.seed), { horizon: CAMERA.horizon, ...WATER })

// --- validation -------------------------------------------------------------

/**
 * THE CAMERA CHECK. A row behind reads as a separate row when open ground shows
 * between the solid ground of the row in front and this row's own ground line,
 * so the eye sees a receding floor and can count the rows on it. With every row
 * standing on a fixed base, that strip is a property of the camera alone.
 */
for (let i = 1; i < rows.length; i += 1) {
  const front = rows[i - 1]
  const back = rows[i]
  if (back.bottom >= front.bottom) fail(`row ${back.depth} ground line does not recede`)
  const strip = round1(front.base - back.bottom)
  if (strip < MIN_STRIP)
    fail(
      `only ${strip} scene units of floor between rows ${front.depth} and ${back.depth}`,
    )
  else console.log(`pass  floor  rows ${front.depth}/${back.depth}  ${strip} scene units`)
}
if (rows[0].bottom > CAMERA.nearBase)
  fail(`near row at ${rows[0].bottom}, past the ${CAMERA.nearBase} cap`)

// Nothing in the near row may stand into the hero's copy.
const near = rows[0]
const tallest = Math.min(
  ...near.fills.flatMap((f) => f.uses.map(([, , h]) => near.base - h)),
)
if (tallest < NEAR_TOP)
  fail(`near row reaches ${round1(tallest)}, above the ${NEAR_TOP} limit`)
else
  console.log(
    `pass  near   tallest shape tops out at ${round1(tallest)} (limit ${NEAR_TOP})`,
  )

// The water lies between row 2's ground line and the near row.
const waterYs = (waterShape.d.match(/-?\d+/g) ?? [])
  .map(Number)
  .filter((_, i) => i % 2 === 1)
const waterFar = Math.min(...waterYs) / UNIT
const waterNear = Math.max(...waterYs) / UNIT
const row2 = rows[1]
if (waterFar < row2.bottom + 0.4)
  fail(`water reaches ${waterFar}, behind row 2's ground line ${row2.bottom}`)
else if (waterNear > near.bottom)
  fail(`water reaches ${waterNear}, past the near ground line`)
else console.log(`pass  water  ${round1(waterFar)} to ${round1(waterNear)} scene units`)

/**
 * Symbol geometry: everything inside its viewBox, and every line-only subpath a
 * simple polygon. Conifer boughs legitimately overhang, so they are not checked
 * for monotonic x, only for crossings. Curve subpaths are unions of convex lumps
 * where overlap is the intent, so they get the bounds check only.
 */
for (const row of rows) {
  let crossings = 0
  let escapes = 0
  for (const sym of row.symbols) {
    const nums = (sym.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    for (let k = 0; k + 1 < nums.length; k += 2) {
      const [x, y] = [nums[k], nums[k + 1]]
      if (x < -0.5 || x > sym.w + 0.5 || y < -0.5 || y > sym.h + 0.5) escapes += 1
    }
    for (const sub of sym.d.split(/(?=M)/).filter(Boolean)) {
      if (/[CQ]/.test(sub)) continue
      const sn = sub.match(/-?\d+(?:\.\d+)?/g).map(Number)
      const sp = []
      for (let k = 0; k + 1 < sn.length; k += 2) sp.push([sn[k], sn[k + 1]])
      crossings += selfIntersections(sp)
    }
  }
  const uses = row.fills.reduce((n, f) => n + f.uses.length, 0)
  if (escapes > 0)
    fail(`row ${row.depth}: ${escapes} symbol point(s) outside their viewBox`)
  else if (crossings > 0) fail(`row ${row.depth}: ${crossings} self-intersection(s)`)
  else {
    console.log(
      `pass  row ${row.depth}  ${String(row.symbols.length).padStart(3)} symbols ${String(uses).padStart(4)} placed  ground ${row.bottom}, base ${row.base}`,
    )
  }
}

/** Counts crossing pairs among non-adjacent segments of a closed polyline. */
function selfIntersections(points) {
  const n = points.length
  let count = 0
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 2; j < n - 1; j += 1) {
      if (i === 0 && j === n - 2) continue // shared closing vertex
      if (segmentsCross(points[i], points[i + 1], points[j], points[j + 1])) count += 1
    }
  }
  return count
}

function segmentsCross(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const d1 = d(p3, p4, p1)
  const d2 = d(p3, p4, p2)
  const d3 = d(p1, p2, p3)
  const d4 = d(p1, p2, p4)
  const eps = 1e-9
  // Strict crossing only. Touching at a shared endpoint is not a defect.
  return (
    ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) &&
    ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))
  )
}

// --- emit -------------------------------------------------------------------

const panorama = {
  stripVw: STRIP_VW,
  bandVu: Math.max(...rows.map((r) => r.bottom)) + BODY_VU,
  unit: UNIT,
  designAspect: DESIGN_ASPECT,
  boxFit: BOX_FIT,
  bodyVu: BODY_VU,
  solidTo: SOLID_TO,
  seamVu: 0.3,
  rows,
  water: { d: waterShape.d },
}

/** JSON, with every array of plain numbers kept on one line so the diff stays readable. */
const json = JSON.stringify(panorama, null, 2).replace(
  /\[\s+(-?[\d.]+(?:,\s+-?[\d.]+)*)\s+\]/g,
  (_, nums) => `[${nums.split(/,\s+/).join(', ')}]`,
)

const header = `// GENERATED FILE. Do not edit by hand.
//
// Produced by scripts/generate-terrain.mjs from the grammars in
// scripts/lib/terrain-grammars.mjs and the route in
// scripts/lib/terrain-config.mjs. To change the landscape, edit those and run
// \`pnpm terrain\`. Output is deterministic, so the diff here is reviewable.
//
// One panorama for the whole trail. Each row is a set of SYMBOLS, which keep
// their proportions and are placed by centre in strip viewport widths at a
// height in scene units, and PROFILES, which are drawn in panorama units and
// stretch with the strip. See src/components/landscape/panorama.tsx.

/* eslint-disable */
/* prettier-ignore */

export interface PanoramaSymbol {
  /** viewBox width and height. The base is on the bottom edge, the top touches y = 0. */
  readonly w: number
  readonly h: number
  readonly d: string
}

/** [symbol index, centre x in strip vw, height in scene units, level of detail]. */
export type PanoramaUse = readonly [number, number, number, 0 | 1]

export interface PanoramaFill {
  /** Which rung of the terrain colour ramp, 1 near to 4 far. */
  readonly fill: 1 | 2 | 3 | 4
  /** Spans of solid ground below the base, [from, to] in strip vw. */
  readonly body: readonly (readonly [number, number])[]
  /** Stretching profiles, in panorama units. */
  readonly ground: string
  readonly uses: readonly PanoramaUse[]
}

export interface PanoramaRow {
  readonly depth: 1 | 2 | 3 | 4
  /** Ground line, from the camera, in scene units. */
  readonly bottom: number
  /** Where this row's shapes stand, in scene units. */
  readonly base: number
  readonly symbols: readonly PanoramaSymbol[]
  readonly fills: readonly PanoramaFill[]
}

export interface Panorama {
  /** Strip width in viewport widths. Must equal STRIP_VW in src/lib/station-geometry.ts. */
  readonly stripVw: number
  /** How deep every row's box runs, in scene units: lowest ground line plus the body. */
  readonly bandVu: number
  /** Panorama units per viewport width across and per scene unit down. */
  readonly unit: number
  /** Viewport width over scene height that the panorama is laid out at. */
  readonly designAspect: number
  /**
   * How much wider than its design width, in viewport widths, a shape's box is.
   * Narrower than designAspect / boxFit, shapes scale down with the viewport.
   */
  readonly boxFit: number
  readonly bodyVu: number
  readonly solidTo: number
  /** How far the body starts above the base, so it overlaps the feet of what stands there. */
  readonly seamVu: number
  readonly rows: readonly PanoramaRow[]
  readonly water: { readonly d: string }
}

/** Scene units at which the ground plane converges. */
export const HORIZON_DVH = ${CAMERA.horizon}

export const PANORAMA: Panorama = ${json}
`

mkdirSync(resolve(root, 'src/content'), { recursive: true })
writeFileSync(resolve(root, 'src/content/terrain.generated.ts'), header, 'utf8')

const placed = rows.reduce(
  (n, r) => n + r.fills.reduce((m, f) => m + f.uses.length, 0),
  0,
)
console.log(
  `\nwrote src/content/terrain.generated.ts  ${placed} shapes placed, ${Math.round(header.length / 1024)}KB`,
)

// --- optional preview -------------------------------------------------------

if (preview) {
  const dir = resolve(root, '.terrain-preview')
  mkdirSync(dir, { recursive: true })

  const sky = (w, h) =>
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5efe9"/><stop offset="0.46" stop-color="#ede0d4"/><stop offset="1" stop-color="#d3c2b0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#sky)"/>`

  // The whole trail at the design aspect, then every station at rest on a
  // laptop and on a phone, which are the two shapes that disagree most.
  const pxPerVu = 6
  const fullW = Math.round(((EXTENT[1] - EXTENT[0]) * pxPerVu * DESIGN_ASPECT) / 1)
  writeFileSync(
    resolve(dir, 'panorama.svg'),
    renderWindow(panorama, {
      x0: EXTENT[0],
      x1: EXTENT[1],
      width: fullW,
      height: 130 * pxPerVu,
      pxPerVu,
      background: sky(fullW, 130 * pxPerVu),
    }),
  )
  const shapes = {
    laptop: { width: REFERENCE.width, height: REFERENCE.height },
    phone: { width: 390, height: 844 },
  }
  STATIONS.forEach((href, i) => {
    for (const [name, { width, height }] of Object.entries(shapes)) {
      const x0 = i * SPAN_VW
      writeFileSync(
        resolve(dir, `${i}-${href === '/' ? 'home' : href.slice(1)}-${name}.svg`),
        renderWindow(panorama, {
          x0,
          x1: x0 + 100,
          width,
          height,
          background: sky(width, height),
        }),
      )
    }
  })
  console.log(`wrote previews to .terrain-preview/`)
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
