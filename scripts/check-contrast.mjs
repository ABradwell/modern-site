// Verifies every foreground/background pair the site actually ships against its
// WCAG floor. Run with `node scripts/check-contrast.mjs`. Exits non-zero on any
// failure, so it can be wired into CI if the palette is ever touched.
//
// The pairs below are transcribed from src/app/globals.css. If you change a
// token there, change it here too, or this check stops meaning anything.

const toRgb = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
}
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const luminance = (h) => {
  const [r, g, b] = toRgb(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/** [label, foreground, background, floor] */
const PAIRS = [
  // light
  ['light  foreground / background', '#414833', '#ede0d4', 4.5],
  ['light  muted-foreground / background', '#5c6444', '#ede0d4', 4.5],
  ['light  card-foreground / card', '#414833', '#f5efe9', 4.5],
  ['light  muted-foreground / card', '#5c6444', '#f5efe9', 4.5],
  ['light  primary / background', '#7f5539', '#ede0d4', 4.5],
  ['light  primary-foreground / primary', '#ede0d4', '#7f5539', 4.5],
  ['light  secondary-foreground / secondary', '#414833', '#d3c2b0', 4.5],
  ['light  foreground / muted', '#414833', '#e3d5c7', 4.5],
  ['light  accent-foreground / accent', '#414833', '#e0cfc1', 4.5],
  ['light  destructive / background', '#8a3b2a', '#ede0d4', 4.5],
  ['light  destructive-foreground / destructive', '#ede0d4', '#8a3b2a', 4.5],
  ['light  ring / background', '#414833', '#ede0d4', 3.0],
  ['light  logo-ink / background', '#5c6444', '#ede0d4', 3.0],
  // dark
  ['dark   foreground / background', '#ede0d4', '#202417', 4.5],
  ['dark   muted-foreground / background', '#b9b2a4', '#202417', 4.5],
  ['dark   card-foreground / card', '#ede0d4', '#2b3021', 4.5],
  ['dark   muted-foreground / card', '#b9b2a4', '#2b3021', 4.5],
  ['dark   primary / background', '#a68a64', '#202417', 3.0],
  ['dark   primary-foreground / primary', '#202417', '#a68a64', 4.5],
  ['dark   secondary-foreground / secondary', '#ede0d4', '#3a4130', 4.5],
  ['dark   accent-foreground / accent', '#ede0d4', '#353423', 4.5],
  ['dark   destructive / background', '#d07a60', '#202417', 3.0],
  ['dark   destructive-foreground / destructive', '#202417', '#d07a60', 4.5],
  ['dark   ring / background', '#ede0d4', '#202417', 3.0],
  ['dark   logo-ink / background', '#bca68d', '#202417', 3.0],
]

// Terrain is decorative and has no contrast floor, but the ramp must stay
// monotonic front to back or the depth illusion inverts.
const RAMPS = {
  light: ['#414833', '#656d4a', '#817854', '#bca68d'],
  dark: ['#151810', '#1e2216', '#262a1b', '#2d3223'],
}

let failed = 0

for (const [label, fg, bg, floor] of PAIRS) {
  const r = ratio(fg, bg)
  const ok = r >= floor
  if (!ok) failed += 1
  console.log(
    `${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(6)}  need ${floor.toFixed(1)}  ${label}`,
  )
}

for (const [mode, ramp] of Object.entries(RAMPS)) {
  const ls = ramp.map(luminance)
  const monotonic = ls.every((l, i) => i === 0 || l > ls[i - 1])
  if (!monotonic) failed += 1
  console.log(
    `${monotonic ? 'pass' : 'FAIL'}  ${mode} terrain ramp is monotonic near to far`,
  )
}

// The near layer must sit below the page surface in luminance, so where it
// passes over content it reads as shadow rather than as a foreign panel.
const nearBelowSurface = luminance('#151810') < luminance('#202417')
if (!nearBelowSurface) failed += 1
console.log(
  `${nearBelowSurface ? 'pass' : 'FAIL'}  dark terrain-1 is darker than dark background`,
)

console.log(`\n${failed} failure(s)`)
process.exit(failed === 0 ? 0 : 1)
