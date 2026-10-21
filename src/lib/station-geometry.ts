import { STATIONS } from '@/content/stations'

/**
 * Station geometry for the landscape strip, in viewport widths.
 *
 * Lives here rather than in Landscape.tsx because two things now need it: the
 * landscape, which draws the strip, and the swipe gesture, which drags it. One
 * copy, or they drift and the pan stops landing on a station.
 *
 * THE GUTTER. Each station is one viewport of content followed by GUTTER_VW of
 * world that is only seen in passing. The panorama is continuous, so there is
 * no seam to hide in it; what the gutter buys is room for a change of scene to
 * happen off-screen. At rest, each station's window shows one place, and the
 * woods' edge, the hill and the climb into rock are what the reader walks
 * through on the way to the next one.
 *
 * The cost is travel distance: the strip is 116 viewports wide per station rather
 * than 100, so the same spring covers 16 percent more ground in the same time.
 * PAN_SPRING was slackened to hold the felt speed where it was.
 *
 * scripts/lib/terrain-config.mjs mirrors SPAN_VW, because the generator lays the
 * world out against these windows.
 */
export const GUTTER_VW = 16

/** Distance travelled per station: one viewport of content plus its gutter. */
export const SPAN_VW = 100 + GUTTER_VW

export const STRIP_VW = STATIONS.length * SPAN_VW

/**
 * Viewport widths to a percentage of the whole strip.
 *
 * The unit throughout this module is one percent of a viewport, so 100 is one
 * full screen and SPAN_VW of 116 is one screen plus its gutter.
 */
export const stripPct = (vw: number) => (vw / STRIP_VW) * 100

/** Where the strip has to sit for station `index` to fill the viewport. */
export const panTarget = (index: number) => -stripPct(index * SPAN_VW)
