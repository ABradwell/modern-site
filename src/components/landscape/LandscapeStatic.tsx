import { stationFor } from '@/content/stations'
import { TERRAIN } from '@/content/terrain.generated'
import { Z } from '@/lib/z'

import { ORB_CLASS, ORB_DISC, SKY_CLASS, hazeStyle } from './atmosphere'
import { terrainLayerStyle, waterStyle } from './terrain-mask'

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
 * throw a second time while handling the first throw.
 */
export function LandscapeStatic({ pathname = '/' }: { pathname?: string }) {
  const station = stationFor(pathname)
  const biome = TERRAIN[station.biome]
  // Only the nearest band paints in front of content, matching Landscape.
  const far = biome.layers.filter((l) => l.depth >= 2)
  const near = biome.layers.filter((l) => l.depth === 1)

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
        {/* Far to near, with the river in front of row 2. Same order as Landscape. */}
        {far.map((l) => (
          <div key={l.depth} style={terrainLayerStyle(l)} />
        ))}
        {biome.river ? <div style={waterStyle(biome.river)} /> : null}
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: Z.landscapeNear }}
      >
        {near.map((l) => (
          <div key={l.depth} style={terrainLayerStyle(l)} />
        ))}
      </div>
    </>
  )
}
