import type { CSSProperties } from 'react'

import type { TerrainLayer, TerrainWater } from '@/content/terrain.generated'

/**
 * How far a layer's solid ground extends below its own ground line, in dvh.
 *
 * This is a BAND, not a floor, and the distinction matters. An earlier version
 * ran every layer down to a fixed 168dvh, which gave the near band a 60dvh slab
 * of solid colour. Because that band travels faster than the page (see
 * SPEED.terrain1), the slab swept up and filled the entire viewport a few
 * hundred pixels into the scroll, hiding the page completely.
 *
 * At 24dvh the near band is 64dvh tall in total: it still overhangs the top of
 * the page content, so content genuinely passes behind the canopy, but it clears
 * the window instead of becoming a wall.
 */
const BODY_DVH = 24

/**
 * Fraction of the body that stays solid before the dissolve begins.
 *
 * Low on purpose. A long, soft dissolve is what makes page content look like it
 * is coming out from under the canopy rather than sliding out from behind a
 * rectangle. Raising this toward 1 turns the band into a hard-edged slab.
 */
const SOLID_TO = 0.4

/**
 * Percent-encodes an SVG for use in a `url()`. Only the characters that
 * actually break parsing are escaped, which keeps the emitted CSS readable and
 * the payload smaller than a full encodeURIComponent.
 */
function svgUrl(svg: string): string {
  const escaped = svg
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
    .replace(/\n/g, ' ')
  return `url("data:image/svg+xml,${escaped}")`
}

function tile(layer: TerrainLayer): string {
  // The mask only cares about alpha, so the tile is painted flat black. Colour
  // comes from the element's background, which is what lets one asset serve
  // both themes.
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${layer.w}' height='${layer.h}' viewBox='0 0 ${layer.w} ${layer.h}'><path fill='%23000' fill-rule='nonzero' d='${layer.d}'/></svg>`,
  )
}

/**
 * Positioning and masking for one terrain layer.
 *
 * The whole approach turns on `mask-size: auto <crest>`: the explicit height
 * comes from the crest, `auto` derives the width from the viewBox ratio, and so
 * the tile scales proportionally and repeats to fill any viewport with no
 * distortion at all. Crest height is decoupled from viewport width, which is
 * the thing neither preserveAspectRatio mode can give you. `none` stretches the
 * silhouette, and `slice` crops the peaks off at wide viewports.
 *
 * A second mask layer, a vertical gradient, fills everything below the crest
 * and fades out at the floor. `mask-composite: add` unions the two. The 1px
 * overlap is there so rounding never leaves a hairline between them.
 */
export function terrainLayerStyle(layer: TerrainLayer): CSSProperties {
  const top = layer.bottom - layer.crest
  const height = layer.crest + BODY_DVH
  const bodyHeight = `calc(${height}dvh - ${layer.crest}dvh + 1px)`

  const masks = [
    tile(layer),
    `linear-gradient(to bottom, #000 0 ${(SOLID_TO * 100).toFixed(0)}%, transparent 100%)`,
  ].join(', ')
  const sizes = [`auto ${layer.crest}dvh`, `100% ${bodyHeight}`].join(', ')
  const positions = ['top center', 'bottom center'].join(', ')
  const repeats = ['repeat-x', 'no-repeat'].join(', ')

  return {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${top}dvh`,
    height: `${height}dvh`,
    backgroundColor: `var(--terrain-${layer.fill})`,
    maskImage: masks,
    maskSize: sizes,
    maskPosition: positions,
    maskRepeat: repeats,
    maskComposite: 'add',
    WebkitMaskImage: masks,
    WebkitMaskSize: sizes,
    WebkitMaskPosition: positions,
    WebkitMaskRepeat: repeats,
  } as CSSProperties
}

/** The plains water band. One mask layer, no body, because it is a ribbon. */
export function waterStyle(water: TerrainWater): CSSProperties {
  const top = water.bottom - water.height
  const mask = svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${water.w}' height='${water.h}' viewBox='0 0 ${water.w} ${water.h}'><path fill='%23000' d='${water.d}'/></svg>`,
  )
  const size = `auto ${water.height}dvh`

  return {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${top}dvh`,
    height: `${water.height}dvh`,
    backgroundColor: 'var(--water)',
    maskImage: mask,
    maskSize: size,
    maskPosition: 'top center',
    maskRepeat: 'repeat-x',
    WebkitMaskImage: mask,
    WebkitMaskSize: size,
    WebkitMaskPosition: 'top center',
    WebkitMaskRepeat: 'repeat-x',
  } as CSSProperties
}
