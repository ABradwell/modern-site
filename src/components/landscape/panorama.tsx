import type { CSSProperties } from 'react'

import { PANORAMA, type PanoramaRow } from '@/content/terrain.generated'

/**
 * The panorama, one row at a time, as inline SVG.
 *
 * Pure render, no hooks, so the animated landscape and its static fallback draw
 * the same world from the same code.
 *
 * ONE WORLD, NOT FOUR TILES. Each row spans the whole trail, so the woods thin
 * into a clearing, a river leaves the trees and runs behind a hill into a lake,
 * and nothing repeats. An earlier version gave every station its own biome as a
 * repeating CSS mask tile and cross-faded them in the gutters, which read as
 * wallpaper and could not carry a feature from one station into the next.
 *
 * POSITIONED IN WIDTHS, SIZED IN SCENE UNITS. Stations are spaced in viewport
 * widths, so everything has to be placed in them. But a tree drawn in viewport
 * widths would be squeezed to a needle on a phone and splayed on an ultrawide.
 * So every shape that has a characteristic proportion is a <symbol>, placed by
 * a <use> whose box is positioned in percentages of the strip and sized in
 * percentages of the row's height. `xMidYMax meet` then scales the symbol
 * uniformly to fit the box and stands it on the box's floor.
 *
 * The box is `boxFit` times the shape's design width, in viewport widths. On
 * anything near the design shape the box is wider than the shape, so height
 * limits it and it stands at its full height. On a narrow screen, where a
 * shape at full height would swallow a whole station (a phone at Experience
 * saw nothing but the far mountains), width takes over and the shape scales
 * down uniformly. A phone then sees the same composition as a laptop with
 * lower shapes, rather than a crowd of full-size ones.
 *
 * What does stretch is drawn in a nested SVG with `preserveAspectRatio="none"`:
 * ground rolls, mountain shoulders, the cloud sea and the water. Those lie in
 * the ground plane or have no proportion of their own, so a narrow viewport
 * reads them as a different view of the same place.
 *
 * Colour is a token per group, inherited by every symbol, so one asset serves
 * both themes and dark mode is a token swap.
 */

const pct = (n: number) => `${n.toFixed(3)}%`

/**
 * One row. `id` prefixes every symbol and gradient id, because the 404 renders
 * the static scene alongside the animated one and ids are document-wide.
 */
export function PanoramaRowSvg({ row, id }: { row: PanoramaRow; id: string }) {
  const { stripVw, bandVu, unit, bodyVu, solidTo, seamVu, designAspect, boxFit } =
    PANORAMA
  const top = row.base - seamVu
  const floor = row.bottom + bodyVu
  const solid = (row.bottom + bodyVu * solidTo - top) / (floor - top)

  return (
    <svg
      aria-hidden
      focusable="false"
      width="100%"
      height="100%"
      className="absolute inset-0 overflow-visible"
    >
      <defs>
        {row.symbols.map((s, i) => (
          <symbol
            key={i}
            id={`${id}-${i}`}
            viewBox={`0 0 ${s.w} ${s.h}`}
            preserveAspectRatio="xMidYMax meet"
          >
            <path d={s.d} />
          </symbol>
        ))}
        {row.fills.map((f) => (
          <linearGradient
            key={f.fill}
            id={`${id}-body-${f.fill}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset={solid.toFixed(3)} style={stop(f.fill, 1)} />
            <stop offset="1" style={stop(f.fill, 0)} />
          </linearGradient>
        ))}
      </defs>

      {row.fills.map((f) => (
        <g key={f.fill} style={{ fill: `var(--terrain-${f.fill})` }}>
          <svg
            viewBox={`0 0 ${stripVw * unit} ${bandVu * unit}`}
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            className="overflow-visible"
          >
            {f.body.map(([from, to]) => (
              <rect
                key={from}
                x={from * unit}
                y={top * unit}
                width={(to - from) * unit}
                height={(floor - top) * unit}
                fill={`url(#${id}-body-${f.fill})`}
              />
            ))}
            {f.ground ? <path d={f.ground} /> : null}
          </svg>

          {f.uses.map(([s, x, h, lod], i) => {
            const symbol = row.symbols[s]!
            const box = (h * (symbol.w / symbol.h) * boxFit) / designAspect / stripVw
            return (
              <use
                key={i}
                href={`#${id}-${s}`}
                className={lod > 0 ? `lod-${lod}` : undefined}
                x={pct((x / stripVw - box / 2) * 100)}
                y={pct(((row.base - h) / bandVu) * 100)}
                width={pct(box * 100)}
                height={pct((h / bandVu) * 100)}
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

function stop(fill: number, opacity: number): CSSProperties {
  return { stopColor: `var(--terrain-${fill})`, stopOpacity: opacity }
}

/** The river and the lake, one shape, painted between row 2 and the near row. */
export function PanoramaWaterSvg() {
  const { stripVw, bandVu, unit, water } = PANORAMA
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${stripVw * unit} ${bandVu * unit}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      className="absolute inset-0 overflow-visible"
    >
      <path d={water.d} style={{ fill: 'var(--water)' }} />
    </svg>
  )
}

/** The row at a depth. Throws at build time, not at render, if one is missing. */
export function panoramaRow(depth: 1 | 2 | 3 | 4): PanoramaRow {
  const row = PANORAMA.rows.find((r) => r.depth === depth)
  if (!row) throw new Error(`no panorama row at depth ${depth}`)
  return row
}
