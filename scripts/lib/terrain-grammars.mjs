/**
 * Terrain grammars.
 *
 * The shape languages the panorama is built from. Written as generators rather
 * than hand-drawn one-offs for three reasons: consistency of line across a few
 * hundred shapes, a reviewable diff when one changes, and the ability to keep
 * complexity falling with distance without doing that by hand.
 *
 * On hand-authored decorative SVG generally: the governing design skill
 * discourages it and prefers generated or photographic imagery. That guidance
 * is overridden here under its own stated exception, "the brief explicitly
 * calls for it". The brief specifies a continuous landscape walked west to
 * east, there is no image-generation tool in this toolchain, and photography
 * cannot deliver independently parallaxing silhouette rows whose colour comes
 * from theme tokens. This was a decision, not a default.
 *
 * TWO KINDS OF SHAPE, and the split is the whole design.
 *
 *   SYMBOLS keep their proportions. A tree, a poplar, a hill or a mountain is
 *   drawn once in its own viewBox and placed on the panorama by its centre, in
 *   viewport widths, at a height in scene units. The browser scales it
 *   uniformly, so a conifer is the same shape on a phone and on an ultrawide.
 *   Every symbol here returns `{ w, h, d }` with its base on the bottom edge of
 *   the viewBox and its highest point touching the top, so the height it is
 *   placed at is the height it is seen at.
 *
 *   PROFILES stretch. Ground rolls, the shoulders under a range, the cloud sea
 *   and the water are drawn straight in panorama units and scaled to the strip
 *   with no aspect lock. They are things that lie in the ground plane or have
 *   no characteristic proportion, so a phone squeezing them horizontally reads
 *   as a different view of the same place rather than as a distortion. Profiles
 *   are emitted in tenths of a viewport width across and tenths of a scene unit
 *   down, as integers.
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

const r1 = (n) => Math.round(n * 10) / 10
/**
 * Symbol coordinates are whole units. At SYMBOL_H that is well under a pixel
 * for the tallest shape on the largest screen, and it keeps the payload small.
 */
const pt = (x, y) => `${Math.round(x)} ${Math.round(y)}`

/** Profile coordinates are integers in tenths: 1vw across is 10, 1 scene unit down is 10. */
export const UNIT = 10
const ip = (x, y) => `${Math.round(x * UNIT)} ${Math.round(y * UNIT)}`

const smoothstep = (u) => u * u * (3 - 2 * u)

/** Height every symbol is drawn at. Only the w / h ratio matters to the page. */
export const SYMBOL_H = 160

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

/**
 * One conifer.
 *
 * The left flank climbs and the right flank descends with a different taper
 * exponent and notch depth, so no tree is symmetric. That asymmetry is what
 * stops a row reading as one stamp repeated. Boughs overhang, so the outline is
 * deliberately NOT monotonic in x; what keeps it a simple polygon is that y
 * moves strictly one way at every step.
 *
 * @param aspect width over height of the whole tree
 * @param boughs bough tiers. Never 1: a single bough degenerates into a blunt
 *               pentagon that reads as a hill, not a tree.
 */
export function conifer(seed, { aspect, boughs }) {
  const rand = rng(seed)
  const h = SYMBOL_H
  const hw = (aspect * h) / 2
  const rTaper = 1.06 + rand() * 0.2
  const rNotch = 0.46 + rand() * 0.14
  const cx = hw
  const tree = [`M${pt(cx - hw, h)}`]

  for (let b = 0; b < boughs; b += 1) {
    const t = b / boughs
    const taper = (1 - t) ** 1.18
    const droop = 0.045 * (1 - t)
    // Outer point is the bough tip, inner point the shoulder at the trunk.
    tree.push(`L${pt(cx - hw * taper, h - h * (t + droop))}`)
    tree.push(`L${pt(cx - hw * taper * 0.66, h - h * (t + 0.62 / boughs))}`)
  }
  tree.push(`L${pt(cx, 0)}`)

  for (let b = boughs - 1; b >= 0; b -= 1) {
    const t = b / boughs
    const taper = (1 - t) ** rTaper
    tree.push(`L${pt(cx + hw * taper * rNotch, h - h * (t + 0.62 / boughs))}`)
    tree.push(`L${pt(cx + hw * taper, h - h * (t + 0.04 * (1 - t)))}`)
  }
  tree.push(`L${pt(cx + hw, h)}`, 'Z')
  return { w: r1(2 * hw), h, d: tree.join('') }
}

/**
 * A dead snag: bare trunk, broken flat top. Rare, and its job is to interrupt
 * the rhythm of the spires around it.
 */
export function snag() {
  const h = SYMBOL_H
  const tw = h * 0.026
  return {
    w: r1(2 * tw),
    h,
    d: `M${pt(0, h)}L${pt(0, h * 0.06)}L${pt(2 * tw, 0)}L${pt(2 * tw, h)}Z`,
  }
}

/** A lombardy poplar: the sentinel tree of open ground. Two quadratics, no tips. */
function poplarPath(cx, base, height, rand) {
  const tw = height * (0.11 + rand() * 0.04)
  return `M${pt(cx - tw, base)}Q${pt(cx - tw * 1.15, base - height * 0.62)} ${pt(cx, base - height)}Q${pt(cx + tw * 1.15, base - height * 0.62)} ${pt(cx + tw, base)}Z`
}

export function poplar(seed) {
  const rand = rng(seed)
  const h = SYMBOL_H
  // 0.15 * 1.15 is the widest the curve can bulge, so this box always holds it.
  const w = h * 0.36
  return { w: r1(w), h, d: poplarPath(w / 2, h, h, rand) }
}

/**
 * A hill or a mountain, standing alone.
 *
 * Seeded with alternating summits and saddles, then roughened by midpoint
 * displacement with an amplitude decaying by `roughness` per level, which is
 * what separates a crag from a lump. Both ends ease down to the ground with a
 * smoothstep, so a massif meets the ground at a slope rather than at a cliff.
 * The profile is then normalised so its highest point touches the top of the
 * viewBox: the height a massif is placed at is the height it stands.
 *
 * @param poplars optional trees standing on the massif, as fractions of its
 *                width. Baked into the symbol rather than placed beside it,
 *                because a tree positioned on the panorama would leave the
 *                hillside the moment the viewport changed shape.
 */
export function massif(
  seed,
  { aspect, peaks, depth, roughness, smooth = false, saddle = 0.55, poplars = [] },
) {
  const rand = rng(seed)
  const h = SYMBOL_H
  const w = h * aspect

  let profile = [{ x: 0, y: h }]
  for (let i = 1; i < peaks * 2; i += 1) {
    const isPeak = i % 2 === 1
    const height = isPeak ? 0.62 + rand() * 0.38 : saddle * (0.5 + rand() * 0.4)
    profile.push({ x: (w * i) / (peaks * 2), y: h - h * height })
  }
  profile.push({ x: w, y: h })

  for (let level = 0; level < depth; level += 1) {
    const decay = roughness ** (level + 1)
    const next = [profile[0]]
    for (let i = 1; i < profile.length; i += 1) {
      const a = profile[i - 1]
      const b = profile[i]
      const my = (a.y + b.y) / 2 - (rand() - 0.35) * h * 0.5 * decay
      next.push({ x: (a.x + b.x) / 2, y: Math.max(0, Math.min(h, my)) }, b)
    }
    profile = next
  }

  // Ease into the ground over the outer sixth of each side. Matching height at
  // the foot is only half of it; a smoothstep also matches the slope, so the
  // massif lands on the ground instead of standing on a knife edge.
  const EDGE = 0.16
  for (const p of profile) {
    const u = Math.min(p.x, w - p.x) / (w * EDGE)
    if (u < 1) p.y = h - (h - p.y) * smoothstep(u)
  }

  const top = Math.min(...profile.map((p) => p.y))
  for (const p of profile) p.y = h - ((h - p.y) * h) / (h - top)

  // Poplars stand on the surface. The surface is read off the polyline, which
  // the smoothed curve hugs closely enough that a trunk sinking a hair into the
  // hill is invisible, while one floating above it would not be.
  const trees = poplars.map((at, i) => {
    const x = w * at
    const j = Math.max(
      1,
      profile.findIndex((p) => p.x >= x),
    )
    const a = profile[j - 1]
    const b = profile[j]
    const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x)
    const ground = a.y + (b.y - a.y) * t + h * 0.015
    return { x, ground, height: h * (0.32 + rand() * 0.14 + i * 0.02) }
  })

  // A poplar near the summit can stand above it. Lift everything so the
  // highest point of the symbol, tree or hill, still touches the top edge.
  const lift = Math.max(0, ...trees.map((p) => p.height - p.ground))
  const y = (v) => v + lift

  const cmds = [`M${pt(0, y(h))}`]
  if (smooth) {
    // Quadratic through midpoints: every vertex becomes a control point and the
    // curve passes through the midpoint of each pair. It stays inside the convex
    // hull of its control points, so it cannot introduce a crossing.
    for (let i = 1; i < profile.length - 1; i += 1) {
      const a = profile[i]
      const b = profile[i + 1]
      cmds.push(`Q${pt(a.x, y(a.y))} ${pt((a.x + b.x) / 2, y((a.y + b.y) / 2))}`)
    }
    cmds.push(`L${pt(w, y(h))}`)
  } else {
    for (const p of profile.slice(1)) cmds.push(`L${pt(p.x, y(p.y))}`)
  }
  cmds.push('Z')
  for (const p of trees) cmds.push(poplarPath(p.x, y(p.ground), p.height, rand))

  return { w: r1(w), h: r1(h + lift), d: cmds.join('') }
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

/**
 * Smooth one-dimensional noise from a handful of sines with seeded phases.
 * Returns a function of x in viewport widths with output roughly in [-1, 1].
 */
export function waves(rand, wavelengths) {
  const parts = wavelengths.map((l) => ({
    k: (2 * Math.PI) / (l * (0.8 + rand() * 0.4)),
    phase: rand() * 2 * Math.PI,
  }))
  return (x) =>
    parts.reduce((sum, p) => sum + Math.sin(p.k * x + p.phase), 0) / parts.length
}

/** 0 outside [from, to], easing to 1 over `ramp` viewport widths at each end. */
export function envelope(x, from, to, ramp) {
  const u = Math.min(x - from, to - x) / ramp
  if (u <= 0) return 0
  return u >= 1 ? 1 : smoothstep(u)
}

/**
 * A closed profile standing on `base`, as a path in profile units.
 *
 * `top(x)` is the height above the base, in scene units. The outline is
 * sampled every `step` viewport widths and smoothed by quadratics through the
 * midpoints, then closed one unit below the base so it overlaps the row's body
 * instead of leaving a hairline above it.
 */
export function profile(from, to, base, top, step = 2) {
  const n = Math.max(2, Math.ceil((to - from) / step))
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const x = from + ((to - from) * i) / n
    return { x, y: base - Math.max(0, top(x)) }
  })
  const cmds = [`M${ip(from, base + 1)}`, `L${ip(pts[0].x, pts[0].y)}`]
  for (let i = 1; i < pts.length - 1; i += 1) {
    const a = pts[i]
    const b = pts[i + 1]
    cmds.push(`Q${ip(a.x, a.y)} ${ip((a.x + b.x) / 2, (a.y + b.y) / 2)}`)
  }
  const last = pts[pts.length - 1]
  cmds.push(`L${ip(last.x, last.y)}`, `L${ip(to, base + 1)}`, 'Z')
  return cmds.join('')
}

/**
 * The cloud sea: a flat deck with billows on it.
 *
 * Billows are independent lopsided hummocks under nonzero fill, so they merge
 * where they overlap without cutting notches into each other. Wide height
 * variation is what keeps the crown from reading as a stone shelf.
 */
export function cloudSea(rand, { from, to, base, height, deck }) {
  const cmds = [profile(from, to, base, (x) => deck * envelope(x, from, to, 8), 4)]
  let x = from + 2
  while (x < to - 2) {
    const rw = 5 + rand() * 7
    const env = envelope(x, from, to, 10)
    const rh = height * (0.4 + rand() * 0.6) * env
    if (rh > 0.5) {
      cmds.push(
        `M${ip(x - rw, base + 1)}Q${ip(x - rw * 0.55, base - rh * 1.24)} ${ip(x - rw * 0.08, base - rh)}Q${ip(x + rw * 0.52, base - rh * 0.84)} ${ip(x + rw, base + 1)}Z`,
      )
    }
    x += rw * (0.9 + rand() * 0.5)
  }
  return cmds.join('')
}

/**
 * The river and the lake it feeds, as one shape so they cannot fail to meet.
 *
 * A river lies IN the ground plane, so the parts of it that sit higher on the
 * screen are further from the camera and must be narrower. Width is therefore
 * keyed to the centreline's height above the horizon, which is ordinary linear
 * perspective: apparent size is proportional to distance below the horizon.
 *
 * The lake is a superellipse with a wavering far shore. The river runs into
 * its tapered west end, and under nonzero fill the overlap is simply a union.
 */
export function water(rand, { horizon, river, lake }) {
  const meander = waves(rand, river.wavelengths)
  const centre = (x) => {
    // Ease the channel onto the lake's own centreline as it reaches the mouth,
    // so the river enters the lake rather than meeting its shore at an angle.
    const t = smoothstep(Math.min(1, Math.max(0, (x - (river.to - 14)) / 14)))
    return river.y + meander(x) * river.swing * (1 - t) + (lake.y - river.y) * t
  }
  const halfWidth = (x, y) => {
    const source = smoothstep(Math.min(1, (x - river.from) / 6))
    return (y - horizon) * river.width * source
  }

  const n = Math.ceil((river.to - river.from) / 1.5)
  const xs = Array.from(
    { length: n + 1 },
    (_, i) => river.from + ((river.to - river.from) * i) / n,
  )
  const far = xs.map((x) => {
    const y = centre(x)
    return [x, y - halfWidth(x, y)]
  })
  const near = xs.map((x) => {
    const y = centre(x)
    return [x, y + halfWidth(x, y)]
  })
  const channel = [...far, ...near.reverse()]

  const shore = waves(rand, [9, 17])
  const m = Math.ceil((lake.to - lake.from) / 1.5)
  const span = (lake.to - lake.from) / 2
  const mid = (lake.from + lake.to) / 2
  const lakeAt = (i) => lake.from + ((lake.to - lake.from) * i) / m
  const reach = (x) => {
    const u = Math.min(1, Math.abs(x - mid) / span)
    return (1 - u ** 2.6) ** (1 / 2.6)
  }
  const top = Array.from({ length: m + 1 }, (_, i) => {
    const x = lakeAt(i)
    return [x, lake.y - (lake.half + shore(x) * lake.waver) * reach(x)]
  })
  const bottom = Array.from({ length: m + 1 }, (_, i) => {
    const x = lakeAt(m - i)
    return [x, lake.y + lake.half * 1.15 * reach(x)]
  })
  const basin = [...top, ...bottom]

  const poly = (points) => `M${points.map(([x, y]) => ip(x, y)).join('L')}Z`
  return {
    d: poly(channel) + poly(basin),
    farthest: Math.min(...[...far, ...top].map(([, y]) => y)),
  }
}
