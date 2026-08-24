import { stationFor } from '@/content/stations'
import { TERRAIN } from '@/content/terrain.generated'
import { Z } from '@/lib/z'

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
        <div className="absolute inset-x-0 -top-[10dvh] h-[150dvh] bg-[linear-gradient(to_bottom,var(--sky-high)_0%,var(--sky-mid)_46%,var(--sky-low)_100%)]" />
        <div className="absolute inset-x-0 top-[44dvh] h-[54dvh] bg-[radial-gradient(78%_58%_at_50%_50%,var(--haze)_0%,transparent_72%)]" />
        <div
          className="absolute top-[46dvh] right-[10vw] size-[clamp(72px,20vw,104px)] rounded-full md:top-[17dvh] md:right-[9vw] md:size-[clamp(132px,14vw,208px)]"
          style={{
            background:
              'radial-gradient(circle at 38% 34%, var(--orb-core) 0%, var(--orb) 62%, color-mix(in oklab, var(--orb) 88%, var(--terrain-1)) 100%)',
          }}
        />
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
