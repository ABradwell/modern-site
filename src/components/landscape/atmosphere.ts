import type { CSSProperties } from 'react'

import { HORIZON_DVH } from '@/content/terrain.generated'

/**
 * Sky, haze and orb, in one place.
 *
 * Every vertical measurement here is in --vu, one percent of --scene, which is
 * the same unit the terrain and the hero use. See globals.css: the scene has a
 * floor so a rotated phone does not compress the composition down onto the copy.
 *
 * Landscape and LandscapeStatic are deliberately separate components: the still
 * frame has no hooks and nothing that can throw while handling the first throw.
 * But they have to draw the SAME sky, and when these were inline in both files
 * they drifted, which meant the error fallback quietly showed a different scene
 * from the page it replaced. Shared values, separate components.
 */

export const SKY_CLASS =
  'absolute inset-x-0 top-[calc(var(--vu)*-10)] h-[calc(var(--vu)*150)] bg-[linear-gradient(to_bottom,var(--sky-high)_0%,var(--sky-mid)_46%,var(--sky-low)_100%)]'

/**
 * Atmospheric haze, centred on the horizon.
 *
 * Two things about this are load-bearing. It is CENTRED on the horizon rather
 * than sitting above or below it, because haze is thickest where the sight line
 * is longest, which is exactly at the vanishing point; deriving the position
 * from HORIZON_DVH is what keeps it there when the camera angle changes.
 *
 * And the radial is centred inside the element, not on its edge. Centred on the
 * bottom edge (`at 50% 100%`) it drew a hard horizontal line right across the
 * viewport at the point the element ended.
 *
 * The horizontal radius is 120%, past the element's own width on purpose: at
 * 78% the gradient reached transparent about 160px short of each edge, so the
 * haze read as a soft ellipse floating in the sky rather than as thickness in
 * the air. Only the vertical falloff should be visible.
 */
const HAZE_DVH = 52

export function hazeStyle(): CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `calc(var(--vu) * ${HORIZON_DVH - HAZE_DVH / 2})`,
    height: `calc(var(--vu) * ${HAZE_DVH})`,
    background: 'radial-gradient(78% 58% at 50% 50%, var(--haze) 0%, transparent 72%)',
  }
}

/**
 * Orb placement. On mobile it moves DOWN rather than just shrinking: at 375px
 * the desktop position sits directly behind the second line of the headline.
 */
export const ORB_CLASS =
  'absolute top-[calc(var(--vu)*46)] right-[10vw] size-[clamp(72px,20vw,104px)] md:top-[calc(var(--vu)*17)] md:right-[9vw] md:size-[clamp(132px,14vw,208px)]'

export const ORB_DISC =
  'radial-gradient(circle at 38% 34%, var(--orb-core) 0%, var(--orb) 62%, color-mix(in oklab, var(--orb) 88%, var(--terrain-1)) 100%)'

export const ORB_HALO = 'radial-gradient(circle, var(--orb-halo) 0%, transparent 62%)'
