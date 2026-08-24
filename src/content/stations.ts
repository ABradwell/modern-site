import type { BiomeKey } from './terrain.generated'

/**
 * The journey.
 *
 * The site is one continuous landscape read west to east, and each route is a
 * station along it. Order here IS the geography: index 0 is the westmost point,
 * and moving forward pans the terrain left. Reordering this array reorders the
 * world, so it is the single source of truth for the nav, the pan offset and
 * the trail marker alike.
 *
 * The progression is deliberate rather than decorative. You start on the forest
 * floor, cross open ground, climb through foothills, reach the peaks, and end
 * above the cloud line looking at what has not been written yet.
 */
export interface Station {
  readonly href: string
  readonly label: string
  /** Used on the trail marker, where the full label will not fit. */
  readonly short: string
  readonly biome: BiomeKey
}

export const STATIONS: readonly Station[] = [
  { href: '/', label: 'Home', short: 'Home', biome: 'forest' },
  {
    href: '/skills',
    label: 'Skills',
    short: 'Skills',
    biome: 'plains',
  },
  {
    href: '/experience',
    label: 'Experience',
    short: 'Work',
    biome: 'foothills',
  },
  {
    href: '/projects',
    label: 'Projects',
    short: 'Projects',
    biome: 'mountains',
  },
  {
    href: '/articles',
    label: 'Writing',
    short: 'Writing',
    biome: 'abovecloud',
  },
] as const

/**
 * Index of the station a pathname belongs to.
 *
 * Anything off the trail, a 404 included, resolves to the forest. That is a
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
