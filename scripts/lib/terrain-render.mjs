/**
 * Draws a window of the panorama as one flat, standalone SVG.
 *
 * The page renders the panorama with <symbol> and <use>, sized in percentages
 * and laid out by the browser. Tools that are not a browser need it resolved:
 * the build preview, and the social card, which Satori draws from an <img>.
 * This does the layout the browser would do for one viewport shape, including
 * level of detail, so what it draws is what that viewport shows.
 *
 * Plain Node, no dependencies, so both scripts can share it.
 */

/** Light-mode terrain ramp and water, inlined so the output needs no stylesheet. */
export const LIGHT = {
  1: '#414833',
  2: '#656d4a',
  3: '#817854',
  4: '#bca68d',
  water: '#9aa88f',
}

/**
 * Highest level of detail a viewport of this shape shows. Mirrors the `.lod-1`
 * media query in src/app/globals.css.
 */
export const maxLod = (aspect) => (aspect < 1.4 ? 0 : 1)

/**
 * @param pano     the PANORAMA object from the generated file
 * @param x0, x1   the window, in strip viewport widths
 * @param width    output width in px; the window is 100vw across it
 * @param height   output height in px
 * @param pxPerVu  px per scene unit. Defaults to a full-scene window
 * @param colours  fill per ramp rung, plus `water`
 */
export function renderWindow(
  pano,
  { x0, x1, width, height, pxPerVu = height / 100, colours = LIGHT, background = '' },
) {
  const sx = width / (x1 - x0)
  const sy = pxPerVu
  // The shape of the viewport this window stands for: one viewport width over
  // one scene unit, which is the same ratio as 100vw over 100 scene units.
  const aspect = sx / sy
  const lod = maxLod(aspect)
  // A shape's box is boxFit times its design width in viewport widths. Below
  // the shape where that box gets narrower than the shape, the browser's
  // `meet` scales it down to the box; do the same here.
  const fit = Math.min(1, (pano.boxFit * aspect) / pano.designAspect)
  const U = pano.unit
  const parts = []
  const defs = []

  // Profiles: drawn in panorama units, mapped straight onto the window.
  const stretch = `matrix(${(sx / U).toFixed(5)} 0 0 ${(sy / U).toFixed(5)} ${(-x0 * sx).toFixed(2)} 0)`

  const row = (r) => {
    for (const f of r.fills) {
      const colour = colours[f.fill]
      const id = `b${r.depth}${f.fill}`
      // The body starts a hair above the base so it overlaps the feet of
      // everything standing on it; meeting exactly leaves an antialiased seam.
      const top = r.base - pano.seamVu
      const floor = r.bottom + pano.bodyVu
      const solid = (r.bottom + pano.bodyVu * pano.solidTo - top) / (floor - top)
      defs.push(
        `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="${solid.toFixed(3)}" stop-color="${colour}"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></linearGradient>`,
      )
      for (const [a, b] of f.body) {
        parts.push(
          `<rect x="${((a - x0) * sx).toFixed(1)}" y="${(top * sy).toFixed(1)}" width="${((b - a) * sx).toFixed(1)}" height="${((floor - top) * sy).toFixed(1)}" fill="url(#${id})"/>`,
        )
      }
      if (f.ground)
        parts.push(`<path transform="${stretch}" fill="${colour}" d="${f.ground}"/>`)

      for (const [s, x, h, level] of f.uses) {
        if (level > lod) continue
        const sym = r.symbols[s]
        const hPx = h * sy * fit
        const wPx = (hPx * sym.w) / sym.h
        const cx = (x - x0) * sx
        if (cx + wPx / 2 < 0 || cx - wPx / 2 > width) continue
        const k = hPx / sym.h
        parts.push(
          `<path transform="matrix(${k.toFixed(5)} 0 0 ${k.toFixed(5)} ${(cx - wPx / 2).toFixed(1)} ${(r.base * sy - hPx).toFixed(1)})" fill="${colour}" d="${sym.d}"/>`,
        )
      }
    }
  }

  const byDepth = (d) => pano.rows.find((r) => r.depth === d)
  row(byDepth(4))
  row(byDepth(3))
  row(byDepth(2))
  parts.push(`<path transform="${stretch}" fill="${colours.water}" d="${pano.water.d}"/>`)
  row(byDepth(1))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs.join('')}</defs>${background}${parts.join('')}</svg>`
}
