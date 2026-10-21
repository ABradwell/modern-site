'use client'

import { motion, useReducedMotion, useScroll, type MotionValue } from 'motion/react'

import { useStationPan } from '@/components/system/station-swipe'
import { STATIONS } from '@/content/stations'
import { TERRAIN } from '@/content/terrain.generated'
import { SPEED } from '@/lib/motion'
import {
  GUTTER_VW,
  SEAM_RAMP_PCT,
  SLOT_VW,
  SPAN_VW,
  STRIP_VW,
  stripPct,
} from '@/lib/station-geometry'
import { Z } from '@/lib/z'

import { SKY_CLASS, hazeStyle } from './atmosphere'
import { Orb } from './Orb'
import { BODY_DVH, terrainLayerStyle, waterStyle } from './terrain-mask'
import { Travel, useTravelRange } from './travel'

/**
 * The landscape.
 *
 * Mounted in the ROOT LAYOUT, never in a page. App Router keeps layout state
 * across navigation inside the same layout, so this never unmounts and the
 * horizontal pan is genuinely continuous travel rather than a crossfade
 * pretending to be one. Move it into a page and the illusion collapses into a
 * flicker on every route change.
 *
 * It returns two sibling fixed bands from a fragment rather than one wrapper,
 * because a wrapper carrying a transform would capture `position: fixed`
 * children in its own containing block.
 *
 * ON THE TWO BANDS. Almost everything sits BEHIND page content. Only the
 * nearest treeline sits in front, and only far enough to overlap the top edge
 * of the content block, which is section padding rather than anything readable.
 * That is the entire budget for the "content comes out from under the trees"
 * idea. An earlier version ran a tall opaque band across the content itself and
 * the result was a green wash over the first heading. Foreground terrain gets to
 * touch empty space, never type.
 *
 * ON HORIZONTAL MOVEMENT. Every depth pans in LOCKSTEP off one shared spring.
 * An earlier version gave each depth its own stiffness so the near ground swept
 * past while distant ridges lagged. That is textbook parallax and it was
 * genuinely unpleasant: on a full-viewport slide, layers moving at different
 * rates read as the world coming apart rather than as depth, and it induced
 * motion sickness. Depth is expressed on the vertical axis, where it is tied to
 * the reader's own scrolling and stays comfortable. The horizontal axis moves as
 * one image.
 *
 * The sky, haze and orb sit OUTSIDE the pan on purpose. A continuous sky has no
 * edges to slide, and a celestial body is effectively at infinity, so walking
 * east does not move it.
 *
 * ON PAINT ORDER AND LAYERS. Each depth is one Travel layer holding one strip
 * of every station's row at that depth, so a row is moved, never repainted:
 * scrolling moves the depth's layer and panning moves its strip, and both are
 * compositor transforms. It used to be the other way round, one strip per band
 * with every depth inside each station's slot, which put the whole band on a
 * single layer that had to be repainted on every frame of motion. Grouping by
 * depth also means that in a gutter each row fades into the matching row of the
 * next biome, and a far ridge never paints over a nearer row from the west.
 */
export function Landscape() {
  const reduce = useReducedMotion() ?? false

  // No scroll listener anywhere. Where the browser has scroll timelines the
  // travel is a CSS animation; elsewhere Motion reads scroll through its own
  // batched frameloop and writes transforms straight to style, outside React's
  // render cycle. Either way no continuous value ever passes through useState.
  const { scrollY } = useScroll()
  useTravelRange()

  // The pan is owned by StationSwipe, not by this component. Both a route change
  // and a finger on the screen move the same strip, and giving them one spring
  // between them is what stops a swipe and a tap fighting each other.
  const pan = useStationPan()

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: Z.landscapeFar }}
      >
        <Travel
          scrollY={scrollY}
          speed={SPEED.sky}
          still={reduce}
          className={SKY_CLASS}
        />
        <Travel scrollY={scrollY} speed={SPEED.haze} still={reduce} style={hazeStyle()} />
        <Orb scrollY={scrollY} still={reduce} />
        <DepthBand depth={4} pan={pan} scrollY={scrollY} still={reduce} />
        <DepthBand depth={3} pan={pan} scrollY={scrollY} still={reduce} />
        <DepthBand depth={2} pan={pan} scrollY={scrollY} still={reduce} />
        {/*
          The river paints AFTER row 2, not before it. Water lies in the ground
          plane in front of that row, and behind it the row's solid ground hides
          the ribbon completely, which is what an earlier version did and why the
          river kept having to be shoved up into the sky to be visible at all.
        */}
        <WaterBand pan={pan} scrollY={scrollY} still={reduce} />
      </div>

      {/*
        The near treeline, in front of page content. pointer-events-none is
        mandatory rather than defensive: without it these silhouettes silently
        swallow every click in the top strip of every page.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: Z.landscapeNear }}
      >
        <DepthBand depth={1} pan={pan} scrollY={scrollY} still={reduce} />
      </div>
    </>
  )
}

type Biome = (typeof STATIONS)[number]['biome']

// ---------------------------------------------------------------------------
// Horizontal pan
// ---------------------------------------------------------------------------

/**
 * Every station side by side, panned as one.
 *
 * Absolutely positioned rather than flexed, because the slots have to OVERLAP in
 * the gutters and flex children cannot. Later stations paint over earlier ones in
 * DOM order, which is the direction the fade needs.
 *
 * The fade is a mask on the slot, multiplying with the terrain masks inside it.
 * repeat-y rather than no-repeat is load-bearing: the mask box is the slot, which
 * is one viewport tall, while the near band's body runs to 130dvh. With no-repeat
 * everything past the bottom of the slot falls outside the mask and is cut off.
 * The gradient is uniform vertically, so tiling it costs nothing and covers every
 * overhang.
 *
 * will-change keeps the strip on its own layer, so the pan slides pixels that
 * were rasterised once instead of repainting every mask on every frame.
 */
function PanStrip({
  pan,
  children,
}: {
  pan: MotionValue<string>
  children: (biome: Biome) => React.ReactNode
}) {
  const seam = `linear-gradient(to right, transparent 0%, #000 ${SEAM_RAMP_PCT.toFixed(3)}%)`

  return (
    <motion.div
      className="absolute inset-y-0 left-0"
      style={{ x: pan, width: `${STRIP_VW}%`, willChange: 'transform' }}
    >
      {STATIONS.map((station, i) => (
        <div
          key={station.href}
          className="absolute inset-y-0"
          style={{
            left: `${stripPct(i * SPAN_VW - GUTTER_VW)}%`,
            width: `${stripPct(SLOT_VW)}%`,
            maskImage: seam,
            maskSize: '100% 100%',
            maskRepeat: 'repeat-y',
          }}
        >
          {children(station.biome)}
        </div>
      ))}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

/**
 * How deep a depth band's box runs, in scene units: the lowest ground line of
 * any layer plus the body it carries. 130 with the current camera.
 *
 * The box has to contain every row, because the seam mask on each slot clips
 * to the slot's box and the slot now travels with its depth. With a one-viewport
 * box, scrolling lifted that edge into view and cut the near body off along a
 * hard line instead of letting it dissolve.
 */
const BAND_DEPTH_VU =
  Math.max(...Object.values(TERRAIN).flatMap((b) => b.layers.map((l) => l.bottom))) +
  BODY_DVH

const BAND_STYLE = { height: `calc(var(--vu) * ${BAND_DEPTH_VU})` } as const

const SPEED_BY_DEPTH = {
  1: SPEED.terrain1,
  2: SPEED.terrain2,
  3: SPEED.terrain3,
  4: SPEED.terrain4,
} as const

/** One depth across every station: its own vertical travel, one shared pan. */
function DepthBand({
  depth,
  pan,
  scrollY,
  still,
}: {
  depth: 1 | 2 | 3 | 4
  pan: MotionValue<string>
  scrollY: MotionValue<number>
  still: boolean
}) {
  return (
    <Travel
      scrollY={scrollY}
      speed={SPEED_BY_DEPTH[depth]}
      still={still}
      className="absolute inset-x-0 top-0"
      style={BAND_STYLE}
    >
      <PanStrip pan={pan}>
        {(biome) => {
          const layer = TERRAIN[biome].layers.find((l) => l.depth === depth)
          return layer ? <div style={terrainLayerStyle(layer)} /> : null
        }}
      </PanStrip>
    </Travel>
  )
}

/** The plains river. Only one station has water, so the other slots are empty. */
function WaterBand({
  pan,
  scrollY,
  still,
}: {
  pan: MotionValue<string>
  scrollY: MotionValue<number>
  still: boolean
}) {
  return (
    <Travel
      scrollY={scrollY}
      speed={SPEED.water}
      still={still}
      className="absolute inset-x-0 top-0"
      style={BAND_STYLE}
    >
      <PanStrip pan={pan}>
        {(biome) => {
          const water = TERRAIN[biome].river
          return water ? <div style={waterStyle(water)} /> : null
        }}
      </PanStrip>
    </Travel>
  )
}
