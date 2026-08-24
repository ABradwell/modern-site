/**
 * Generates src/content/terrain.generated.ts.
 *
 * Output is deterministic: the same seeds produce the same paths on every
 * machine and every build. That is why it is committed rather than generated at
 * runtime. Zero cost at render, no risk of a hydration mismatch, and a
 * reviewable diff when a silhouette changes.
 *
 *   pnpm terrain            regenerate
 *   pnpm terrain --preview  also write a visual contact sheet to .terrain-preview/
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BANDS, BIOMES } from './lib/terrain-config.mjs'
import {
  BASE_RATIO,
  cloudbank,
  conifers,
  grassland,
  ridge,
  river,
} from './lib/terrain-grammars.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const preview = process.argv.includes('--preview')

const GRAMMARS = { conifers, grassland, ridge, cloudbank }

// --- build ------------------------------------------------------------------

const out = {}
let failures = 0

for (const [key, biome] of Object.entries(BIOMES)) {
  out[key] = { label: biome.label, layers: [] }

  biome.layers.forEach((spec, i) => {
    const band = BANDS[i]
    const { grammar, seed, ...opts } = spec
    const fn = GRAMMARS[grammar]
    if (!fn) throw new Error(`unknown grammar "${grammar}" in biome "${key}"`)

    const d = fn(band.w, band.h, seed, opts)
    const report = validate(d, band, `${key} depth${band.depth} (${grammar})`)
    if (!report.ok) failures += 1

    out[key].layers.push({
      depth: band.depth,
      grammar,
      w: band.w,
      h: band.h,
      crest: band.crest,
      commands: report.commands,
      d,
    })
  })

  if (biome.river) {
    const band = BANDS[1]
    out[key].river = {
      w: band.w,
      h: Math.round(band.h * 0.5),
      d: river(band.w, Math.round(band.h * 0.5), biome.river),
    }
  }
}

// --- validation -------------------------------------------------------------

/**
 * Geometry checks that catch the ways a generated tile actually breaks: a crest
 * that does not start on the baseline (visible step where the tile repeats),
 * geometry escaping the viewBox (clipped peaks), and a crest polyline that
 * crosses itself (a silhouette with a knot in it).
 *
 * Note on the self-intersection test: it runs on line-only crests, which is
 * where the risk lives. A conifer's boughs legitimately overhang, so the crest
 * is NOT x-monotonic and must not be checked for that. What matters is that it
 * stays a simple polygon. The curve grammars (grassland, cloudbank) are unions
 * of overlapping convex lumps under nonzero fill, where overlap is the intent,
 * so they get the bounds and seam checks only.
 */
function validate(d, band, label) {
  const base = band.h * BASE_RATIO
  const main = d.split(/(?=M)/).filter(Boolean)[0]
  const commands = (d.match(/[MLCQZ]/g) || []).length

  const nums = main.match(/-?\d+(?:\.\d+)?/g).map(Number)
  const points = []
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]])

  const problems = []

  // The crest must start on the baseline for the tile to repeat cleanly.
  if (Math.abs(points[0][1] - base) > 1) {
    problems.push(`starts at y=${points[0][1]}, expected baseline ${base.toFixed(1)}`)
  }

  // Everything must sit inside the viewBox.
  const minY = Math.min(...points.map((p) => p[1]))
  const maxX = Math.max(...points.map((p) => p[0]))
  const maxY = Math.max(...points.map((p) => p[1]))
  if (minY < -0.5) problems.push(`peak escapes the top by ${(-minY).toFixed(1)}`)
  if (maxY > band.h + 0.5) problems.push(`extends below the box to y=${maxY}`)
  if (maxX > band.w + 0.5) problems.push(`extends past the right edge to x=${maxX}`)

  // Seam: the crest must return to the height it started at.
  const closing = points.slice(-3)
  const seamY = closing[0][1]
  if (Math.abs(seamY - base) > 1) {
    problems.push(`ends at y=${seamY}, expected baseline ${base.toFixed(1)}`)
  }

  // Every line-only subpath must be a simple polygon. Curve subpaths are
  // skipped: they are overlapping convex lumps where union is the intent.
  let crossings = 0
  for (const sub of d.split(/(?=M)/).filter(Boolean)) {
    if (/[CQ]/.test(sub)) continue
    const sn = sub.match(/-?\d+(?:\.\d+)?/g).map(Number)
    const sp = []
    for (let i = 0; i + 1 < sn.length; i += 2) sp.push([sn[i], sn[i + 1]])
    crossings += selfIntersections(sp)
  }
  if (crossings > 0) problems.push(`${crossings} self-intersection(s)`)

  const ok = problems.length === 0
  const detail = ok ? '' : `  <- ${problems.join('; ')}`
  console.log(
    `${ok ? 'pass' : 'FAIL'}  ${String(commands).padStart(4)} cmds  ${label.padEnd(34)}${detail}`,
  )
  return { ok, commands }
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

const header = `// GENERATED FILE. Do not edit by hand.
//
// Produced by scripts/generate-terrain.mjs from the grammars in
// scripts/lib/terrain-grammars.mjs and the declarations in
// scripts/lib/terrain-config.mjs. To change a silhouette, edit those and run
// \`pnpm terrain\`. Output is deterministic, so the diff here is reviewable.
//
// Each layer is an SVG path for a tile that repeats horizontally. It is
// delivered as a CSS mask over a background-coloured div rather than as an
// inline <svg>, which is what lets a single asset serve both themes: colour
// lives entirely in the background, so dark mode is a token swap.

/* eslint-disable */
/* prettier-ignore */

export interface TerrainLayer {
  readonly depth: 1 | 2 | 3 | 4
  readonly grammar: 'conifers' | 'grassland' | 'ridge' | 'cloudbank'
  readonly w: number
  readonly h: number
  /** CSS length the tile is drawn at. Rendered width follows from w/h. */
  readonly crest: string
  readonly commands: number
  readonly d: string
}

export interface TerrainWater {
  readonly w: number
  readonly h: number
  readonly d: string
}

export interface TerrainBiome {
  readonly label: string
  readonly layers: readonly TerrainLayer[]
  readonly river?: TerrainWater
}

export type BiomeKey = ${Object.keys(BIOMES)
  .map((k) => `'${k}'`)
  .join(' | ')}

export const TERRAIN: Record<BiomeKey, TerrainBiome> = ${JSON.stringify(out, null, 2)} as const
`

mkdirSync(resolve(root, 'src/content'), { recursive: true })
writeFileSync(resolve(root, 'src/content/terrain.generated.ts'), header, 'utf8')

const layerCount = Object.values(out).reduce((n, b) => n + b.layers.length, 0)
const totalCmds = Object.values(out).reduce(
  (n, b) => n + b.layers.reduce((m, l) => m + l.commands, 0),
  0,
)
console.log(
  `\nwrote src/content/terrain.generated.ts  ${layerCount} layers, ${totalCmds} path commands`,
)

// --- optional visual contact sheet -----------------------------------------

if (preview) {
  const dir = resolve(root, '.terrain-preview')
  mkdirSync(dir, { recursive: true })

  // Light-mode tokens, inlined so the preview needs no stylesheet.
  const FILL = ['#414833', '#656d4a', '#817854', '#bca68d']
  const SKY = ['#f5efe9', '#ede0d4', '#d3c2b0']
  const W = 1200
  const H = 460

  for (const [key, biome] of Object.entries(out)) {
    // Depth 4 paints first (furthest back), depth 1 last.
    const bands = [...biome.layers].reverse()
    const parts = bands.map((l) => {
      const idx = l.depth - 1
      // Rendered tile height as a share of the preview, mirroring the CSS crest
      // ladder so the preview shows the real proportions.
      const crestPx = H * [0.26, 0.22, 0.18, 0.14][idx] * 1.9
      const tileW = crestPx * (l.w / l.h)
      const repeats = Math.ceil(W / tileW) + 1
      const top = H - crestPx - H * [0.0, 0.03, 0.06, 0.09][idx]
      const tiles = Array.from({ length: repeats }, (_, r) => {
        const sx = tileW / l.w
        const sy = crestPx / l.h
        return `<g transform="translate(${(r * tileW).toFixed(1)} ${top.toFixed(1)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"><path d="${l.d}" fill="${FILL[idx]}"/></g>`
      }).join('')
      // A solid body beneath each crest, as the gradient mask layer provides.
      return `${tiles}<rect x="0" y="${(top + crestPx - 1).toFixed(1)}" width="${W}" height="${(H - top - crestPx + 1).toFixed(1)}" fill="${FILL[idx]}"/>`
    })

    const river = biome.river
      ? (() => {
          const rh = H * 0.1
          const rw = rh * (biome.river.w / biome.river.h)
          const reps = Math.ceil(W / rw) + 1
          const top = H - H * 0.3
          return Array.from({ length: reps }, (_, r) => {
            const sx = rw / biome.river.w
            const sy = rh / biome.river.h
            return `<g transform="translate(${(r * rw).toFixed(1)} ${top.toFixed(1)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"><path d="${biome.river.d}" fill="#9aa88f"/></g>`
          }).join('')
        })()
      : ''

    // River sits between depth 3 and depth 2, so splice it in there.
    const ordered = [parts[0], parts[1], river, parts[2], parts[3]].join('')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${SKY[0]}"/><stop offset="0.46" stop-color="${SKY[1]}"/><stop offset="1" stop-color="${SKY[2]}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="${W * 0.78}" cy="${H * 0.26}" r="${H * 0.13}" fill="#a68a64"/>
${ordered}
<text x="16" y="30" font-family="sans-serif" font-size="20" fill="#414833">${biome.label}</text>
</svg>`
    writeFileSync(resolve(dir, `${key}.svg`), svg, 'utf8')
  }
  console.log(`wrote ${Object.keys(out).length} preview SVGs to .terrain-preview/`)
}

if (failures > 0) {
  console.error(`\n${failures} layer(s) failed geometry validation`)
  process.exit(1)
}
