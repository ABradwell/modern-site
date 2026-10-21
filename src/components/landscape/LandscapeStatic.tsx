'use client'

// A client module with no hooks, on purpose. As a server component, its whole
// panorama was serialised into the RSC payload of every page, because the
// layout passes it as the error boundary's fallback: 300KB per route change for
// a frame that is almost never shown. As a client module the payload carries a
// reference, the data comes from the bundle the animated landscape already
// loads, and it still server-renders to HTML, so the 404's no-JS floor stands.
import { PANORAMA } from '@/content/terrain.generated'
import { stationIndex } from '@/content/stations'
import { panTarget, STRIP_VW } from '@/lib/station-geometry'
import { Z } from '@/lib/z'

import { ORB_CLASS, ORB_DISC, SKY_CLASS, hazeStyle } from './atmosphere'
import { PanoramaRowSvg, PanoramaWaterSvg, panoramaRow } from './panorama'

/**
 * The landscape with no motion at all: one composed frame, server-rendered.
 *
 * Two jobs. It is the fallback the error boundary swaps in if the animated
 * landscape throws, so a failure there degrades to a still scene rather than to
 * a hole in the page. And it is what global-error.tsx cannot use but not-found
 * can, since it needs no client JS.
 *
 * Deliberately not a variant of Landscape behind a flag. Keeping them separate
 * means this path has no hooks, no pathname dependency and nothing that can
 * throw a second time while handling the first throw. It shares the panorama's
 * pure renderer, so it cannot draw a different world from the one it replaces.
 *
 * The strip is parked at the station with a static transform, which is safe
 * here: none of its children is `position: fixed`.
 */
export function LandscapeStatic({ pathname = '/' }: { pathname?: string }) {
  const strip = {
    width: `${STRIP_VW}%`,
    height: `calc(var(--vu) * ${PANORAMA.bandVu})`,
    transform: `translateX(${panTarget(stationIndex(pathname))}%)`,
  }

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: Z.landscapeFar }}
      >
        <div className={SKY_CLASS} />
        <div style={hazeStyle()} />
        <div className={`${ORB_CLASS} rounded-full`} style={{ background: ORB_DISC }} />
        {/* Far to near, with the water in front of row 2. Same order as Landscape. */}
        <div className="absolute top-0 left-0" style={strip}>
          {([4, 3, 2] as const).map((depth) => (
            <div key={depth} className="absolute inset-0">
              <PanoramaRowSvg row={panoramaRow(depth)} id={`still${depth}`} />
            </div>
          ))}
          <div className="absolute inset-0">
            <PanoramaWaterSvg />
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: Z.landscapeNear }}
      >
        <div className="absolute top-0 left-0" style={strip}>
          <PanoramaRowSvg row={panoramaRow(1)} id="still1" />
        </div>
      </div>
    </>
  )
}
