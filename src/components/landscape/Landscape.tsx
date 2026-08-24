'use client'

import { usePathname } from 'next/navigation'
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect } from 'react'

import { STATIONS, stationIndex } from '@/content/stations'
import { TERRAIN } from '@/content/terrain.generated'
import { PAN_SPRING, SPEED } from '@/lib/motion'
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
  const pathname = usePathname()
  const reduce = useReducedMotion() ?? false
  const index = stationIndex(pathname)

  // No scroll listener anywhere. Motion reads scroll through its own batched
  // frameloop and writes transforms straight to style, outside React's render
  // cycle, so no continuous value ever passes through useState.
  const { scrollY } = useScroll()
  const pan = usePan(index, reduce)

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
 * THE SEAM. Station geometry, in viewport widths.
 *
 * Stations used to butt-joint. Every biome's crest is a tile repeating at its own
 * width, so at a boundary the tile was cut at an arbitrary phase: a conifer
 * sliced down the middle at 60dvh sitting next to a mountain saddle at 75dvh.
 * That step is a hard vertical line, invisible at rest because it sits exactly on
 * the viewport edge, and unmissable the moment the strip slides.
 *
 * The fix is a GUTTER between stations, not a wider slot. Each station is one
 * viewport of content followed by GUTTER_VW of transition, and a station's
 * terrain bleeds east across its own gutter while the next station reaches back
 * west across it and fades in. In the gutter the western biome is fully opaque
 * and the eastern one ramps from 0 to 1 over the top of it, so total coverage is
 * exactly 1 everywhere and, where the two biomes assign different colours to the
 * same depth as the above-cloud station does, the colour interpolates instead of
 * stepping.
 *
 * ONE-SIDED, not a cross-fade. Two ramps meeting in the middle would each be at
 * 50 percent there, and two half-opaque layers of the same colour composite to 75
 * percent rather than 100, which would leave a pale band down every join.
 *
 * THE GUTTER IS WHY THIS IS OFF-SCREEN AT REST. An earlier attempt widened each
 * slot westward instead, with no gutter. That put a station's own fade off-screen
 * to its west, but the NEXT station then began one viewport later, which is the
 * current station's eastern edge, at full opacity: at rest on the plains there
 * was a mountain peak sitting in the right-hand tenth of the window. With a
 * gutter, a station's window is bounded by its neighbours' slot edges on both
 * sides, so at rest exactly one biome is drawn and the blend is only ever visible
 * while travelling.
 *
 * The cost is travel distance: the strip is now 116 viewports wide per station
 * rather than 100, so the same spring covers 16 percent more ground in the same
 * time. PAN_SPRING was slackened to hold the felt speed where it was.
 */
const GUTTER_VW = 16

/** Distance travelled per station: one viewport of content plus its gutter. */
const SPAN_VW = 100 + GUTTER_VW
const STRIP_VW = STATIONS.length * SPAN_VW

/** Viewport widths as a percentage of the whole strip. */
const pct = (vw: number) => (vw / STRIP_VW) * 100

/** A slot is its gutter, its viewport, and the next gutter it bleeds into. */
const SLOT_VW = 100 + 2 * GUTTER_VW

/** Ramp width as a percentage of one slot. */
const SEAM_RAMP_PCT = (GUTTER_VW / SLOT_VW) * 100

/**
 * Offset of the station strip, as a percentage of its own width.
 *
 * One spring, shared by both bands, so nothing can drift out of alignment. The
 * config is deliberately overdamped: a damping ratio above 1 means the slide
 * settles without overshoot, and a full-viewport slide that bounces at the end
 * is the other way to make this motion unpleasant.
 */
function usePan(index: number, still: boolean) {
  const target = -pct(index * SPAN_VW)
  const spring = useSpring(target, still ? { duration: 0 } : PAN_SPRING)

  useEffect(() => {
    if (still) spring.jump(target)
    else spring.set(target)
  }, [spring, target, still])

  return useMotionTemplate`${spring}%`
}

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
            left: `${pct(i * SPAN_VW - GUTTER_VW)}%`,
            width: `${pct(SLOT_VW)}%`,
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
