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
    const cx = span * (i + 0.5) + (rand() - 0.5) * span * 0.24
    const height = (base - h * 0.03) * (minH + rand() * (1 - minH))
    const apexY = base - height
    const hw = span * (0.34 + rand() * 0.18)

    // A dead snag: bare trunk, broken flat top. One per near layer at most,
    // and its job is to interrupt the rhythm of the spires around it.
    if (snagAt.has(i)) {
      const tw = hw * 0.16
      cmds.push(
        `M${pt(cx - tw, base)}L${pt(cx - tw, apexY + height * 0.06)}L${pt(cx + tw, apexY + height * 0.1)}L${pt(cx + tw, base)}Z`,
      )
      continue
    }

    const tree = [`M${pt(cx - hw, base)}`]

    // Left flank, climbing. The outer point is a bough tip, the inner point the
    // shoulder where that bough meets the trunk. Boughs overhang, so this is
    // deliberately not monotonic in x. What keeps it a simple polygon is that y
    // decreases strictly at every step.
    for (let b = 0; b < boughs; b += 1) {
      const t = b / boughs
      const taper = (1 - t) ** 1.18
      const droop = 0.045 * (1 - t)
      tree.push(`L${pt(cx - hw * taper, base - height * (t + droop))}`)
      tree.push(`L${pt(cx - hw * taper * 0.52, base - height * (t + 0.62 / boughs))}`)
    }
    tree.push(`L${pt(cx, apexY)}`)

    // Right flank, descending, with a different taper exponent and notch depth
    // so no tree is symmetric. That asymmetry is what stops the row reading as
    // one stamp repeated.
    const rTaper = 1.06 + rand() * 0.2
    const rNotch = 0.46 + rand() * 0.14
    for (let b = boughs - 1; b >= 0; b -= 1) {
      const t = b / boughs
      const taper = (1 - t) ** rTaper
      tree.push(`L${pt(cx + hw * taper * rNotch, base - height * (t + 0.62 / boughs))}`)
      tree.push(`L${pt(cx + hw * taper, base - height * (t + 0.04 * (1 - t)))}`)
    }
    tree.push(`L${pt(cx + hw, base)}`, 'Z')
    cmds.push(tree.join(''))
  }

  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 2. GRASSLAND. Plains. Low soft undulation and tufts. No spires anywhere.
// ---------------------------------------------------------------------------

export function grassland(w, h, seed, { rolls, amp, tufts = 0 }) {
  const rand = rng(seed)
  const base = h * BASE_RATIO
  const crest = base - h * amp
  const step = w / rolls

  // Cubic rolls, starting and ending at the same y so the tile is seamless.
  const cmds = [`M${pt(0, base)}`, `L${pt(0, crest)}`]
  for (let i = 0; i < rolls; i += 1) {
    const x0 = step * i
    const x1 = step * (i + 1)
    const lift = (rand() - 0.5) * h * amp * 1.5
    const y1 = i === rolls - 1 ? crest : crest + lift
    cmds.push(
      `C${pt(x0 + step * 0.34, crest + lift * 0.5)} ${pt(x1 - step * 0.34, y1 - lift * 0.35)} ${pt(x1, y1)}`,
    )
  }
  cmds.push(`L${pt(w, base)}`, `L${pt(w, h)}`, `L${pt(0, h)}`, 'Z')

  // Tufts ride on top of the rolls as short quadratic blades, as separate
  // subpaths so they union rather than cutting into the crest.
  for (let t = 0; t < tufts; t += 1) {
    const tx = rand() * w
    const th = h * amp * (1.4 + rand() * 1.6)
    const tw = h * amp * 0.5
    cmds.push(
      `M${pt(tx - tw, base)}Q${pt(tx - tw * 0.2, crest - th)} ${pt(tx + tw * 0.3, crest - th * 0.55)}Q${pt(tx + tw * 0.4, base)} ${pt(tx + tw, base)}Z`,
    )
  }

  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 3. RIDGE. Foothills and mountains. Fractal midpoint displacement, angular.
// ---------------------------------------------------------------------------

export function ridge(w, h, seed, { peaks, amp, depth, roughness }) {
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

  const cmds = [`M${pt(0, base)}`]
  for (const p of profile) cmds.push(`L${pt(p.x, p.y)}`)
  cmds.push(`L${pt(w, base)}`, `L${pt(w, h)}`, `L${pt(0, h)}`, 'Z')
  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 4. CLOUDBANK. Above the cloud line. Pure quadratic mass, no tips at all.
// ---------------------------------------------------------------------------

export function cloudbank(w, h, seed, { lumps, amp }) {
  const rand = rng(seed)
  const base = h * BASE_RATIO
  const step = w / lumps

  // Independent overlapping subpaths under nonzero fill, so lumps may merge
  // without cutting notches where they cross.
  const cmds = [`M${pt(0, base)}L${pt(w, base)}L${pt(w, h)}L${pt(0, h)}Z`]
  for (let i = 0; i < lumps; i += 1) {
    const cx = step * (i + 0.5) + (rand() - 0.5) * step * 0.4
    const rw = step * (0.62 + rand() * 0.34)
    const rh = (base - h * 0.04) * amp * (0.55 + rand() * 0.45)
    cmds.push(
      `M${pt(cx - rw, base)}Q${pt(cx - rw * 0.62, base - rh * 1.18)} ${pt(cx, base - rh)}Q${pt(cx + rw * 0.66, base - rh * 1.1)} ${pt(cx + rw, base)}Z`,
    )
  }
  return cmds.join('')
}

// ---------------------------------------------------------------------------
// 5. RIVER. The plains water band. A meander whose period divides the tile
// width exactly, which makes it seamless by construction rather than by luck.
// ---------------------------------------------------------------------------

export function river(w, h, { periods, amp, thickness }) {
  const mid = h * 0.5
  const a = h * amp
  const half = h * thickness * 0.5
  const steps = periods * 8
  const seg = w / steps
  const wave = (i) => a * Math.sin((i / steps) * periods * 2 * Math.PI)

  const edge = (offset, forward) => {
    const cmds = []
    const idx = forward
      ? Array.from({ length: steps }, (_, i) => i)
      : Array.from({ length: steps }, (_, i) => steps - i)
    for (const i of idx) {
      const next = forward ? i + 1 : i - 1
      const x0 = seg * i
      const x1 = seg * next
      const y0 = mid + offset + wave(i)
      const y1 = mid + offset + wave(next)
      cmds.push(
        `C${pt(x0 + (x1 - x0) * 0.42, y0)} ${pt(x1 - (x1 - x0) * 0.42, y1)} ${pt(x1, y1)}`,
      )
    }
    return cmds.join('')
  }

  return [
    `M${pt(0, mid - half + wave(0))}`,
    edge(-half, true),
    `L${pt(w, mid + half + wave(steps))}`,
    edge(half, false),
    'Z',
  ].join('')
}
