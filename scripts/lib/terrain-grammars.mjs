/**
 * Terrain grammars.
 *
 * Four shape languages, parameterised into the twenty silhouettes the site
 * needs (five biomes x four depth bands). Written as generators rather than
 * hand-drawn one-offs for three reasons: consistency of line across twenty
 * assets, a reviewable diff when a silhouette changes, and the ability to keep
 * path complexity falling with distance without doing that by hand.
 *
 * On hand-authored decorative SVG generally: the governing design skill
 * discourages it and prefers generated or photographic imagery. That guidance
 * is overridden here under its own stated exception, "the brief explicitly
 * calls for it". The brief specifies a treeline and a five-biome landscape,
 * there is no image-generation tool in this toolchain, and photography cannot
 * deliver four independently parallaxing silhouette layers whose colour comes
 * from theme tokens. This was a decision, not a default.
 *
 * Every crest function returns an SVG path `d` for a tile that:
 *   - starts and ends on the baseline at the same y, so it repeats seamlessly;
 *   - keeps its lowest crest point above the viewBox bottom, leaving a solid
 *     band so the crest mask joins its gradient body layer without a seam;
 *   - never backtracks in x along the crest, so it cannot self-intersect.
 */

/** Deterministic xorshift32. Same seed, same terrain, every build, forever. */
export function rng(seed) {
  let s = seed | 0 || 0x9e3779b9
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

const r2 = (n) => Math.round(n * 10) / 10
const pt = (x, y) => `${r2(x)} ${r2(y)}`

/** Baseline sits at 88% of tile height, leaving a solid band beneath the crest. */
export const BASE_RATIO = 0.88

// ---------------------------------------------------------------------------
// 1. CONIFERS. Forest. Sharp asymmetric spires, drooping boughs, dead snags.
// ---------------------------------------------------------------------------

export function conifers(w, h, seed, { count, boughs, snags = 0, minH = 0.45 }) {
  const rand = rng(seed)
  const base = h * BASE_RATIO
  const span = w / count
  const snagAt = new Set()
  while (snags > 0 && snagAt.size < snags) {
    snagAt.add(1 + Math.floor(rand() * Math.max(1, count - 2)))
  }

  // The ground band first, then one closed subpath per tree.
  //
  // Trees are separate subpaths on purpose. Neighbours are allowed to overlap,
  // because a treeline where every trunk is politely spaced reads as a fence,
  // and under nonzero fill overlapping subpaths simply union. Emitting them as
  // one continuous outline instead would make those overlaps self-intersections.
  const cmds = [`M${pt(0, base)}L${pt(w, base)}L${pt(w, h)}L${pt(0, h)}Z`]

  for (let i = 0; i < count; i += 1) {
    // Every random draw happens here, before any branch, so the sequence does
    // not depend on which trees turned out to be snags.
    const cx = span * (i + 0.5) + (rand() - 0.5) * span * 0.24
    const height = (base - h * 0.03) * (minH + rand() * (1 - minH))
    const hw = span * (0.34 + rand() * 0.18)
    const rTaper = 1.06 + rand() * 0.2
    const rNotch = 0.46 + rand() * 0.14

    const at = snagAt.has(i)
      ? (x) => snag(x, base, height, hw)
      : (x) => spire(x, base, height, hw, boughs, rTaper, rNotch)

    cmds.push(at(cx))

    // A crown that crosses a tile edge is drawn a SECOND time one tile over, so
    // the two halves meet across the repeat. Without this the crown is simply
    // clipped at the edge and the seam shows up as a vertical cut straight down
    // the treeline, which is the one repeat artefact the eye finds immediately.
    // Same device as the cloudbank's edge hummock, for the same reason.
    if (cx - hw < 0) cmds.push(at(cx + w))
    if (cx + hw > w) cmds.push(at(cx - w))
  }

  return cmds.join('')
}

/**
 * One conifer, as a closed subpath centred on `cx`.
 *
 * The left flank climbs and the right flank descends with a different taper
 * exponent and notch depth, so no tree is symmetric. That asymmetry is what
 * stops a row reading as one stamp repeated. Boughs overhang, so the outline is
 * deliberately NOT monotonic in x; what keeps it a simple polygon is that y
 * moves strictly one way at every step.
 */
function spire(cx, base, height, hw, boughs, rTaper, rNotch) {
  const apexY = base - height
  const tree = [`M${pt(cx - hw, base)}`]

  for (let b = 0; b < boughs; b += 1) {
    const t = b / boughs
    const taper = (1 - t) ** 1.18
    const droop = 0.045 * (1 - t)
    // Outer point is the bough tip, inner point the shoulder at the trunk.
    tree.push(`L${pt(cx - hw * taper, base - height * (t + droop))}`)
    tree.push(`L${pt(cx - hw * taper * 0.66, base - height * (t + 0.62 / boughs))}`)
  }
  tree.push(`L${pt(cx, apexY)}`)

  for (let b = boughs - 1; b >= 0; b -= 1) {
    const t = b / boughs
    const taper = (1 - t) ** rTaper
    tree.push(`L${pt(cx + hw * taper * rNotch, base - height * (t + 0.62 / boughs))}`)
    tree.push(`L${pt(cx + hw * taper, base - height * (t + 0.04 * (1 - t)))}`)
  }
  tree.push(`L${pt(cx + hw, base)}`, 'Z')
  return tree.join('')
}

/**
 * A dead snag: bare trunk, broken flat top. One per near layer at most, and its
 * job is to interrupt the rhythm of the spires around it.
 */
function snag(cx, base, height, hw) {
  const apexY = base - height
  const tw = hw * 0.16
  return `M${pt(cx - tw, base)}L${pt(cx - tw, apexY + height * 0.06)}L${pt(cx + tw, apexY + height * 0.1)}L${pt(cx + tw, base)}Z`
}

// ---------------------------------------------------------------------------
// 2. GRASSLAND. Plains. Low soft undulation plus sentinel poplars. No spires.
// ---------------------------------------------------------------------------

export function grassland(w, h, seed, { rolls, amp, sentinels = 0 }) {
  const rand = rng(seed)
  const base = h * BASE_RATIO
  const crest = base - h * amp * 0.5
  const step = w / rolls

  // Cubic rolls, starting and ending at the same y so the tile is seamless.
  const cmds = [`M${pt(0, base)}`, `L${pt(0, crest)}`]
  for (let i = 0; i < rolls; i += 1) {
    const x0 = step * i
    const x1 = step * (i + 1)
    const lift = (rand() - 0.5) * h * amp * 0.6
    const y1 = i === rolls - 1 ? crest : crest + lift
    cmds.push(
      `C${pt(x0 + step * 0.34, crest + lift * 0.5)} ${pt(x1 - step * 0.34, y1 - lift * 0.35)} ${pt(x1, y1)}`,
    )
  }
  cmds.push(`L${pt(w, base)}`, `L${pt(w, h)}`, `L${pt(0, h)}`, 'Z')

  // Sentinel poplars. Separate subpaths, so they union with the ground rather
  // than cutting into it. These are what stop a plains band reading as a flat
  // horizontal rule, and they carry the eye toward the river.
  for (let t = 0; t < sentinels; t += 1) {
    const tx = (w * (t + 0.5)) / sentinels + (rand() - 0.5) * (w / sentinels) * 0.5
    const th = h * (0.34 + rand() * 0.3)
    const tw = th * 0.13
    cmds.push(
      `M${pt(tx - tw, base)}Q${pt(tx - tw * 1.15, crest - th * 0.62)} ${pt(tx, crest - th)}Q${pt(tx + tw * 1.15, crest - th * 0.62)} ${pt(tx + tw, base)}Z`,
    )
  }

  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 3. RIDGE. Foothills and mountains. Fractal midpoint displacement, angular.
// ---------------------------------------------------------------------------

export function ridge(w, h, seed, { peaks, amp, depth, roughness, smooth = false }) {
  const rand = rng(seed)
  const base = h * BASE_RATIO
  const usable = base - h * 0.03

  // Seed the profile with alternating summits and saddles.
  let profile = []
  for (let i = 0; i <= peaks * 2; i += 1) {
    const x = (w * i) / (peaks * 2)
    const isPeak = i % 2 === 1
    const height = isPeak ? usable * amp * (0.62 + rand() * 0.38) : usable * amp * 0.14
    profile.push({ x, y: base - height })
  }
  // Force the ends level so the tile repeats without a step.
  const endY = base - usable * amp * 0.2
  profile[0].y = endY
  profile[profile.length - 1].y = endY

  // Midpoint displacement, amplitude decaying by `roughness` each level.
  for (let level = 0; level < depth; level += 1) {
    const decay = roughness ** (level + 1)
    const next = [profile[0]]
    for (let i = 1; i < profile.length; i += 1) {
      const a = profile[i - 1]
      const b = profile[i]
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2 - (rand() - 0.35) * usable * amp * decay
      next.push({ x: mx, y: Math.max(h * 0.02, Math.min(base, my)) }, b)
    }
    profile = next
  }

  // Ease the outer tenth of the tile into the end height with a smoothstep,
  // which has zero slope at the edge. Matching the HEIGHT at both ends is only
  // half of a seamless repeat: matching the height but not the slope leaves a
  // sharp V at every tile boundary, and against an otherwise organic profile
  // that V is the only straight line in the picture, so it is exactly what the
  // eye locks onto. Applied after displacement, so it cannot be undone by it.
  const EDGE = 0.1
  for (const p of profile) {
    const u = Math.min(p.x, w - p.x) / (w * EDGE)
    if (u < 1) p.y = endY + (p.y - endY) * (u * u * (3 - 2 * u))
  }

  const cmds = [`M${pt(0, base)}`]
  if (smooth) {
    // Quadratic through midpoints: every vertex becomes a control point and the
    // curve passes through the midpoint of each pair. Rounds the whole profile
    // without moving it, which is what separates a rolling foothill from a
    // mountain crag while keeping one grammar. A smoothed curve stays inside
    // the convex hull of its control points, so it cannot introduce a crossing
    // the source polyline did not already have.
    cmds.push(`L${pt(profile[0].x, profile[0].y)}`)
    for (let i = 1; i < profile.length - 1; i += 1) {
      const a = profile[i]
      const b = profile[i + 1]
      cmds.push(`Q${pt(a.x, a.y)} ${pt((a.x + b.x) / 2, (a.y + b.y) / 2)}`)
    }
    const last = profile[profile.length - 1]
    cmds.push(`L${pt(last.x, last.y)}`)
  } else {
    for (const p of profile) cmds.push(`L${pt(p.x, p.y)}`)
  }
  cmds.push(`L${pt(w, base)}`, `L${pt(w, h)}`, `L${pt(0, h)}`, 'Z')
  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 4. CLOUDBANK. Distant haze and cloud sea. Quadratic mass, no tips at all.
// ---------------------------------------------------------------------------

/**
 * @param lumps  number of hummocks across the tile
 * @param amp    crown height as a fraction of available height
 * @param spread how wide each hummock is relative to its slot. Below 1 the
 *               hummocks stay distinct; near 1 they merge into a plateau, which
 *               is what made an earlier cloud sea read as a stone shelf.
 */
export function cloudbank(w, h, seed, { lumps, amp, spread = 0.72 }) {
  const rand = rng(seed)
  const base = h * BASE_RATIO
  const step = w / lumps

  // Independent overlapping subpaths under nonzero fill, so hummocks may merge
  // without cutting notches where they cross.
  const cmds = [`M${pt(0, base)}L${pt(w, base)}L${pt(w, h)}L${pt(0, h)}Z`]

  /**
   * One hummock. The crown is deliberately lopsided: the apex sits left of
   * centre and the two arcs have different control heights, so a row of them
   * does not read as a repeated dome.
   */
  const hummock = (cx, rw, rh) =>
    `M${pt(cx - rw, base)}Q${pt(cx - rw * 0.55, base - rh * 1.24)} ${pt(cx - rw * 0.08, base - rh)}Q${pt(cx + rw * 0.52, base - rh * 0.84)} ${pt(cx + rw, base)}Z`

  for (let i = 0; i < lumps; i += 1) {
    const cx = step * (i + 0.5) + (rand() - 0.5) * step * 0.4
    const rw = step * spread * (0.8 + rand() * 0.5)
    // Wide height variation is what breaks up the crown. At a narrow range every
    // hummock tops out at the same y and the union becomes a flat plateau.
    const rh = (base - h * 0.04) * amp * (0.35 + rand() * 0.65)
    cmds.push(hummock(cx, rw, rh))
  }

  // A hummock straddling the tile edge, drawn identically at x=0 and x=w.
  // Without it the crown drops to the base line at every tile boundary and the
  // repeat shows up as a row of vertical notches, which is exactly what it did.
  const edgeW = step * spread * (0.8 + rand() * 0.5)
  const edgeH = (base - h * 0.04) * amp * (0.35 + rand() * 0.65)
  cmds.push(hummock(0, edgeW, edgeH), hummock(w, edgeW, edgeH))

  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 5. RIVER. The plains water band. A meander whose period divides the tile
// width exactly, which makes it seamless by construction rather than by luck.
// ---------------------------------------------------------------------------

/**
 * @param periods   meanders per tile. Integer, or the tile will not repeat.
 * @param amp       meander excursion as a fraction of band height
 * @param thickness channel width at its nearest, as a fraction of band height
 * @param taper     channel width at its furthest, relative to its nearest.
 *
 * `taper` is the perspective. A river lies flat in the ground plane, so the
 * parts of it that sit higher in the band are further from the camera and have
 * to be narrower. Without it the channel is a constant-width ribbon, which reads
 * as a painted stripe rather than as water lying on a receding floor, and no
 * amount of moving the band up or down fixes that.
 *
 * Width is keyed to the meander phase, not to x, so the near-side bends run wide
 * and the far-side bends run narrow. That also keeps the seam exact: the phase
 * is zero at both tile edges, so both edges are the same width.
 */
export function river(w, h, { periods, amp, thickness, taper = 1 }) {
  const mid = h * 0.5
  const a = h * amp
  const steps = periods * 8
  const seg = w / steps
  const wave = (i) => a * Math.sin((i / steps) * periods * 2 * Math.PI)

  // 0 at the top of the meander (furthest), 1 at the bottom (nearest).
  const half = (i) => {
    const t = a === 0 ? 1 : (wave(i) + a) / (2 * a)
    return h * thickness * 0.5 * (taper + (1 - taper) * t)
  }

  const edge = (sign, forward) => {
    const cmds = []
    const idx = forward
      ? Array.from({ length: steps }, (_, i) => i)
      : Array.from({ length: steps }, (_, i) => steps - i)
    for (const i of idx) {
      const next = forward ? i + 1 : i - 1
      const x0 = seg * i
      const x1 = seg * next
      const y0 = mid + wave(i) + sign * half(i)
      const y1 = mid + wave(next) + sign * half(next)
      cmds.push(
        `C${pt(x0 + (x1 - x0) * 0.42, y0)} ${pt(x1 - (x1 - x0) * 0.42, y1)} ${pt(x1, y1)}`,
      )
    }
    return cmds.join('')
  }

  return [
    `M${pt(0, mid + wave(0) - half(0))}`,
    edge(-1, true),
    `L${pt(w, mid + wave(steps) + half(steps))}`,
    edge(1, false),
    'Z',
  ].join('')
}
