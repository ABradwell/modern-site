'use client'

import { motion, useTransform, type MotionValue } from 'motion/react'

import { SPEED } from '@/lib/motion'

/**
 * The sun, or the moon in dark mode.
 *
 * Rendered as a div with two nested radial gradients rather than as SVG, since
 * there is no path here. The gradient centre is offset to 38% 34%, which gives
 * the disc a lit side and a terminator, so it reads as a body with form rather
 * than a flat circle. Every stop is a mix of palette values, so chroma cannot
 * exceed 0.070 and the disc cannot become a bloom by construction.
 *
 * ON THE HALO: it is a single low-chroma radial at 26% alpha in light and 9% in
 * dark, same hue as the disc, with no blur or saturation boost and no
 * box-shadow. That is atmospheric scatter. A banned neon glow is a saturated
 * ring brighter than its source, which this cannot be.
 *
 * NO AMBIENT MOTION. The orb already moves, drifting at roughly half the scroll
 * rate, and that motion is motivated: it is what places it furthest away. A
 * second decorative animation on the same element would be motion for its own
 * sake.
 *
 * NO HORIZONTAL PAN either, deliberately. A celestial body is effectively at
 * infinity, so walking east does not move it. Every terrain band pans; this
 * does not, and that contrast is part of what sells the distance.
 *
 * ON MOBILE it moves DOWN rather than just shrinking. At 375px the desktop
 * position sits directly behind the second line of the headline, and a tan disc
 * at 2.52:1 behind dark green type is a mess even though the type stays legible.
 * Below md it drops into the empty sky between the buttons and the treeline.
 *
 * It is NOT the theme control. See ThemeControl for why: at 2.52:1 against the
 * sky the tan sun is a legal decorative graphic but an illegal UI component
 * under WCAG 1.4.11, and only in light mode, which is the worst kind of failure
 * to ship.
 */
export function Orb({
  scrollY,
  still,
}: {
  scrollY: MotionValue<number>
  still: boolean
}) {
  const y = useTransform(scrollY, (v) => (still ? 0 : -v * SPEED.orb))

  return (
    <motion.div
      style={{ y }}
      className="absolute top-[46dvh] right-[10vw] size-[clamp(72px,20vw,104px)] md:top-[17dvh] md:right-[9vw] md:size-[clamp(132px,14vw,208px)]"
    >
      <div
        className="absolute inset-[-55%] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle, var(--orb-halo) 0%, transparent 62%)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full transition-[background] duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none"
        style={{
          background:
            'radial-gradient(circle at 38% 34%, var(--orb-core) 0%, var(--orb) 62%, color-mix(in oklab, var(--orb) 88%, var(--terrain-1)) 100%)',
        }}
      />
    </motion.div>
  )
}
