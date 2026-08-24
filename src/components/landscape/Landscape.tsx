'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'

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
import { terrainLayerStyle, waterStyle } from './terrain-mask'

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
 */
export function Landscape() {
  const reduce = useReducedMotion() ?? false

  // No scroll listener anywhere. Motion reads scroll through its own batched
  // frameloop and writes transforms straight to style, outside React's render
  // cycle, so no continuous value ever passes through useState.
  const { scrollY } = useScroll()

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
        <Sky scrollY={scrollY} still={reduce} />
        <Haze scrollY={scrollY} still={reduce} />
        <Orb scrollY={scrollY} still={reduce} />
        <PanStrip pan={pan}>
          {(station) => (
            <>
              <DepthLayer biome={station} depth={4} scrollY={scrollY} still={reduce} />
              <DepthLayer biome={station} depth={3} scrollY={scrollY} still={reduce} />
              <DepthLayer biome={station} depth={2} scrollY={scrollY} still={reduce} />
              {/*
                The river paints AFTER row 2, not before it. Water lies in the
                ground plane in front of that row, and behind it the row's solid
                ground hides the ribbon completely, which is what an earlier
                version did and why the river kept having to be shoved up into
                the sky to be visible at all.
              */}
              <WaterLayer biome={station} scrollY={scrollY} still={reduce} />
            </>
          )}
        </PanStrip>
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
        <PanStrip pan={pan}>
          {(station) => (
            <DepthLayer biome={station} depth={1} scrollY={scrollY} still={reduce} />
          )}
        </PanStrip>
      </div>
    </>
  )
}

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
 */
function PanStrip({
  pan,
  children,
}: {
  pan: MotionValue<string>
  children: (biome: (typeof STATIONS)[number]['biome']) => React.ReactNode
}) {
  const seam = `linear-gradient(to right, transparent 0%, #000 ${SEAM_RAMP_PCT.toFixed(3)}%)`

  return (
    <motion.div
      className="absolute inset-y-0 left-0"
      style={{ x: pan, width: `${STRIP_VW}%` }}
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
// Vertical travel
// ---------------------------------------------------------------------------

/**
 * Upward travel for one layer: -scrollY * speed, in pixels.
 *
 * Pixels rather than dvh, so no viewport measurement and no resize listener are
 * needed. A layer at speed 1.0 tracks page content exactly; below 1.0 it falls
 * behind and reads as distant; above 1.0 it outruns the content and lifts away.
 *
 * `still` collapses the output instead of skipping the hook, so hook order
 * stays stable if the reader flips the OS reduced-motion setting mid-session.
 */
function useTravel(scrollY: MotionValue<number>, speed: number, still: boolean) {
  return useTransform(scrollY, (y) => (still ? 0 : -y * speed))
}

// ---------------------------------------------------------------------------
// Sky, haze
// ---------------------------------------------------------------------------

function Sky({ scrollY, still }: { scrollY: MotionValue<number>; still: boolean }) {
  const y = useTravel(scrollY, SPEED.sky, still)
  return <motion.div style={{ y }} className={SKY_CLASS} />
}

function Haze({ scrollY, still }: { scrollY: MotionValue<number>; still: boolean }) {
  const y = useTravel(scrollY, SPEED.haze, still)
  return <motion.div style={{ ...hazeStyle(), y }} />
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

const SPEED_BY_DEPTH = {
  1: SPEED.terrain1,
  2: SPEED.terrain2,
  3: SPEED.terrain3,
  4: SPEED.terrain4,
} as const

function DepthLayer({
  biome,
  depth,
  scrollY,
  still,
}: {
  biome: (typeof STATIONS)[number]['biome']
  depth: 1 | 2 | 3 | 4
  scrollY: MotionValue<number>
  still: boolean
}) {
  const y = useTravel(scrollY, SPEED_BY_DEPTH[depth], still)
  const layer = TERRAIN[biome].layers.find((l) => l.depth === depth)
  if (!layer) return null

  return (
    <motion.div className="absolute inset-0" style={{ y }}>
      <div style={terrainLayerStyle(layer)} />
    </motion.div>
  )
}

/** The plains river. Only one station has water, so the rest render nothing. */
function WaterLayer({
  biome,
  scrollY,
  still,
}: {
  biome: (typeof STATIONS)[number]['biome']
  scrollY: MotionValue<number>
  still: boolean
}) {
  const y = useTravel(scrollY, SPEED.water, still)
  const water = TERRAIN[biome].river
  if (!water) return null

  return (
    <motion.div className="absolute inset-0" style={{ y }}>
      <div style={waterStyle(water)} />
    </motion.div>
  )
}
