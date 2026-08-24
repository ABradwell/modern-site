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
    const { grammar, seed, crest, bottom, fill, ...opts } = spec
    const fn = GRAMMARS[grammar]
    if (!fn) throw new Error(`unknown grammar "${grammar}" in biome "${key}"`)

    const d = fn(band.w, band.h, seed, opts)
    const report = validate(d, band, `${key} depth${band.depth} (${grammar})`)
    if (!report.ok) failures += 1

    // Rendered element aspect. Reported so a silhouette that has drifted into
    // fat-cone or needle territory is visible in the build log, not only on the
    // page. Only meaningful for grammars with discrete repeated elements.
    const count = opts.count ?? opts.peaks ?? opts.lumps ?? opts.rolls
    const aspect = count ? (0.85 * count * band.h) / band.w : null

    out[key].layers.push({
      depth: band.depth,
      grammar,
      w: band.w,
      h: band.h,
      crest,
      bottom,
      fill: fill ?? band.depth,
      commands: report.commands,
      aspect: aspect === null ? null : Math.round(aspect * 100) / 100,
      d,
    })
  })

  if (biome.river) {
    const band = BANDS[1]
    const rh = Math.round(band.h * 0.5)
    out[key].river = {
      w: band.w,
      h: rh,
      bottom: biome.river.bottom,
      height: biome.river.height,
      d: river(band.w, rh, biome.river),
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
  /** Drawn tile height in vh. Rendered tile width is crest * (w / h). */
  readonly crest: number
  /** Baseline position in dvh from the top of the hero. bottom - crest = summit. */
  readonly bottom: number
  /** Which rung of the terrain colour ramp this layer takes, 1 near to 4 far. */
  readonly fill: 1 | 2 | 3 | 4
  readonly commands: number
  /** Rendered element aspect, height over width. Near 2.8 is a good conifer. */
  readonly aspect: number | null
  readonly d: string
}

export interface TerrainWater {
  readonly w: number
  readonly h: number
  /** Baseline position in dvh, and band height in dvh. */
  readonly bottom: number
  readonly height: number
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

  // Light-mode terrain ramp, inlined so the preview needs no stylesheet.
  const FILL = { 1: '#414833', 2: '#656d4a', 3: '#817854', 4: '#bca68d' }
  const SKY = ['#f5efe9', '#ede0d4', '#d3c2b0']

  // 1 dvh = VH px. The canvas runs past 100dvh so the overhang that covers page
  // content is visible, with a rule drawn at the fold.
  const VH = 7
  const W = 1280
  const VIEWPORT = 100 * VH
  const H = 145 * VH

  for (const [key, biome] of Object.entries(out)) {
    const layer = (l) => {
      const crestPx = l.crest * VH
      const bottomPx = l.bottom * VH
      const topPx = bottomPx - crestPx
      const tileW = crestPx * (l.w / l.h)
      const reps = Math.ceil(W / tileW) + 1
      const sx = tileW / l.w
      const sy = crestPx / l.h
      const tiles = Array.from(
        { length: reps },
        (_, r) =>
          `<g transform="translate(${(r * tileW).toFixed(1)} ${topPx.toFixed(1)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"><path d="${l.d}" fill="${FILL[l.fill]}"/></g>`,
      ).join('')
      // The solid body the gradient mask layer supplies on the real page.
      const bodyTop = bottomPx - 1
      return `${tiles}<rect x="0" y="${bodyTop.toFixed(1)}" width="${W}" height="${(H - bodyTop).toFixed(1)}" fill="${FILL[l.fill]}"/>`
    }

    const riverEl = biome.river
      ? (() => {
          const r = biome.river
          const bandH = r.height * VH
          const bandW = bandH * (r.w / r.h)
          const reps = Math.ceil(W / bandW) + 1
          const topPx = r.bottom * VH - bandH
          const sx = bandW / r.w
          const sy = bandH / r.h
          return Array.from(
            { length: reps },
            (_, i) =>
              `<g transform="translate(${(i * bandW).toFixed(1)} ${topPx.toFixed(1)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"><path d="${r.d}" fill="#9aa88f"/></g>`,
          ).join('')
        })()
      : ''

    // Paint far to near. The river slots in just behind the two near bands,
    // which is where it sits in the real z-order.
    const byDepth = [...biome.layers].sort((a, b) => b.depth - a.depth)
    const painted = byDepth.map((l) => ({ depth: l.depth, svg: layer(l) }))
    const body = painted.map((p) => (p.depth === 2 ? riverEl + p.svg : p.svg)).join('\n')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${SKY[0]}"/><stop offset="0.46" stop-color="${SKY[1]}"/><stop offset="1" stop-color="${SKY[2]}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="${(W * 0.74).toFixed(0)}" cy="${(30 * VH).toFixed(0)}" r="${(11 * VH).toFixed(0)}" fill="#a68a64"/>
<text x="72" y="${(30 * VH).toFixed(0)}" font-family="-apple-system,sans-serif" font-size="${(6.5 * VH).toFixed(0)}" font-weight="600" fill="#414833">${biome.label}</text>
${body}
<line x1="0" y1="${VIEWPORT}" x2="${W}" y2="${VIEWPORT}" stroke="#8a3b2a" stroke-width="2" stroke-dasharray="10 8"/>
<text x="8" y="${VIEWPORT - 8}" font-family="-apple-system,sans-serif" font-size="14" fill="#8a3b2a">100dvh fold</text>
</svg>`
    writeFileSync(resolve(dir, `${key}.svg`), svg, 'utf8')
  }
  console.log(`wrote ${Object.keys(out).length} preview SVGs to .terrain-preview/`)
}

if (failures > 0) {
  console.error(`\n${failures} layer(s) failed geometry validation`)
  process.exit(1)
}
