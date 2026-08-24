import { STATIONS } from '@/content/stations'

/**
 * Station geometry for the landscape strip, in viewport widths.
 *
 * Lives here rather than in Landscape.tsx because two things now need it: the
 * landscape, which draws the strip, and the swipe gesture, which drags it. One
 * copy, or they drift and the pan stops landing on a station.
 *
 * THE SEAM. Stations used to butt-joint. Every biome's crest is a tile repeating
 * at its own width, so at a boundary the tile was cut at an arbitrary phase: a
 * conifer sliced down the middle at 60dvh sitting next to a mountain saddle at
 * 75dvh. That step is a hard vertical line, invisible at rest because it sits
 * exactly on the viewport edge, and unmissable the moment the strip slides.
 *
 * The fix is a GUTTER between stations, not a wider slot. Each station is one
 * viewport of content followed by GUTTER_VW of transition, and a station's
 * terrain bleeds east across its own gutter while the next station reaches back
 * west across it and fades in. In the gutter the western biome is fully opaque
 * and the eastern one ramps from 0 to 1 over the top of it, so total coverage is
 * exactly 1 everywhere and, where two biomes assign different colours to the same
 * depth as the above-cloud station does, the colour interpolates instead of
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
 * The cost is travel distance: the strip is 116 viewports wide per station rather
 * than 100, so the same spring covers 16 percent more ground in the same time.
 * PAN_SPRING was slackened to hold the felt speed where it was.
 */
export const GUTTER_VW = 16

/** Distance travelled per station: one viewport of content plus its gutter. */
export const SPAN_VW = 100 + GUTTER_VW

export const STRIP_VW = STATIONS.length * SPAN_VW

/** A slot is its gutter, its viewport, and the next gutter it bleeds into. */
export const SLOT_VW = 100 + 2 * GUTTER_VW

/**
 * Viewport widths to a percentage of the whole strip.
 *
 * The unit throughout this module is one percent of a viewport, so 100 is one
 * full screen and SPAN_VW of 116 is one screen plus its gutter.
 */
export const stripPct = (vw: number) => (vw / STRIP_VW) * 100

/** Ramp width as a percentage of one slot. */
export const SEAM_RAMP_PCT = (GUTTER_VW / SLOT_VW) * 100

/** Where the strip has to sit for station `index` to fill the viewport. */
export const panTarget = (index: number) => -stripPct(index * SPAN_VW)
