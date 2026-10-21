/**
 * The journey.
 *
 * The site is one continuous landscape read west to east, and each route is a
 * station along it. Order here IS the geography: index 0 is the westmost point,
 * and moving forward pans the terrain left. Reordering this array reorders the
 * world, so it is the single source of truth for the nav, the pan offset and
 * the trail marker alike.
 *
 * The progression is deliberate rather than decorative. You start in deep
 * woods, walk out at their edge into a clearing where a river leaves the trees,
 * follow it behind a hill to a lake at the foot of the mountains, and end above
 * the cloud line looking at what has not been written yet. That world is one
 * panorama, drawn by scripts/generate-terrain.mjs from the route in
 * scripts/lib/terrain-config.mjs, and it is laid out against this list: each
 * station's window on it is fixed by its index.
 *
 * FOUR STATIONS, not five. Skills and experience were separate pages and are now
 * one, so `/experience` is gone and `/skills` carries both under the label
 * "Experience".
 *
 * Two things have to move with this list or the build breaks. STATIONS in
 * scripts/lib/stations.mjs is the plain-Node copy that verify-export.mjs checks
 * against out/, and it is what caught this route rename by failing the build.
 * The panorama is generated for a strip as wide as the stations, so adding or
 * removing one means extending the route in terrain-config.mjs and running
 * `pnpm terrain`; the landscape throws if the two disagree.
 */
export interface Station {
  readonly href: string
  readonly label: string
  /** Used on the trail marker, where the full label will not fit. */
  readonly short: string
}

export const STATIONS: readonly Station[] = [
  { href: '/', label: 'Home', short: 'Home' },
  { href: '/skills', label: 'Experience', short: 'Experience' },
  { href: '/projects', label: 'Projects', short: 'Projects' },
  { href: '/articles', label: 'Writing', short: 'Writing' },
] as const

/**
 * Destinations that are not stations.
 *
 * Deliberately kept out of STATIONS. That array is the geography: its order
 * sets the pan offset, its length divides the terrain strip, and every entry
 * needs a window on the panorama and a route the exporter can find. An off-site link has none of
 * those, so it rides alongside the trail rather than on it. The nav renders
 * these after the stations; the marker never travels to them, which is correct,
 * because you are never "here".
 */
export interface ExternalLink {
  readonly href: string
  readonly label: string
}

export const EXTERNAL_LINKS: readonly ExternalLink[] = [
  { href: 'https://www.bradwellmusic.co.uk', label: 'Music' },
] as const

/**
 * Index of the station a pathname belongs to.
 *
 * Anything off the trail, a 404 included, resolves to the woods. That is a
 * deliberate choice rather than a fallback: an unknown URL should land you
 * somewhere recognisable, not in a void.
 */
export function stationIndex(pathname: string): number {
  const exact = STATIONS.findIndex((s) => s.href === pathname)
  if (exact !== -1) return exact
  const nested = STATIONS.findIndex(
    (s) => s.href !== '/' && pathname.startsWith(`${s.href}/`),
  )
  return nested === -1 ? 0 : nested
}

export function stationFor(pathname: string): Station {
  return STATIONS[stationIndex(pathname)]!
}
