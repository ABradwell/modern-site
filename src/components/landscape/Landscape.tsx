'use client'

import { motion, useReducedMotion, useScroll, type MotionValue } from 'motion/react'

import { useStationPan } from '@/components/system/station-swipe'
import { PANORAMA } from '@/content/terrain.generated'
import { SPEED } from '@/lib/motion'
import { STRIP_VW } from '@/lib/station-geometry'
import { Z } from '@/lib/z'

import { SKY_CLASS, hazeStyle } from './atmosphere'
import { Orb } from './Orb'
import { PanoramaRowSvg, PanoramaWaterSvg, panoramaRow } from './panorama'
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
 * ON PAINT ORDER AND LAYERS. Each depth is one Travel layer holding one strip:
 * that depth's row of the panorama, the whole trail long. A row is moved, never
 * repainted: scrolling moves the depth's layer and panning moves its strip, and
 * both are compositor transforms. See panorama.tsx for how the row is drawn.
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

// ---------------------------------------------------------------------------
// Horizontal pan
// ---------------------------------------------------------------------------

// The generator lays the world out across a strip of its own width. If the
// station list changes length without `pnpm terrain` being run, the pan would
// stop landing on stations, so fail where it is noticed rather than on screen.
if (PANORAMA.stripVw !== STRIP_VW) {
  throw new Error(
    `terrain is ${PANORAMA.stripVw}vw wide but stations span ${STRIP_VW}vw; run pnpm terrain`,
  )
}

/**
 * The whole trail, panned as one.
 *
 * will-change keeps the strip on its own layer, so the pan slides pixels that
 * were rasterised once instead of redrawing the row on every frame.
 */
function PanStrip({
  pan,
  children,
}: {
  pan: MotionValue<string>
  children: React.ReactNode
}) {
  return (
    <motion.div
      className="absolute inset-y-0 left-0"
      style={{ x: pan, width: `${STRIP_VW}%`, willChange: 'transform' }}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

/**
 * Every row's box runs PANORAMA.bandVu deep: the lowest ground line plus the
 * body it carries, 130 with the current camera. Shallower and the near body is
 * cut off along a hard line once the reader scrolls.
 */
const BAND_STYLE = { height: `calc(var(--vu) * ${PANORAMA.bandVu})` } as const

const SPEED_BY_DEPTH = {
  1: SPEED.terrain1,
  2: SPEED.terrain2,
  3: SPEED.terrain3,
  4: SPEED.terrain4,
} as const

/** One depth of the panorama: its own vertical travel, the one shared pan. */
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
        <PanoramaRowSvg row={panoramaRow(depth)} id={`land${depth}`} />
      </PanStrip>
    </Travel>
  )
}

/** The river and the lake it runs into. */
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
        <PanoramaWaterSvg />
      </PanStrip>
    </Travel>
  )
}
