import type { Skill } from '@/content/types'
import { cn } from '@/lib/cn'

import { BRAND_MARKS } from './registry'

/**
 * One cell on the technology wall.
 *
 * Two problems here, and the obvious answer fails both.
 *
 * TINT. Not brand colours. Thirty brand hexes is a rainbow, and next to a
 * five-colour palette it reads as breakage rather than as variety. Every mark
 * takes currentColor from a single --logo-ink token, which flips once per theme
 * and carries the whole wall with it.
 *
 * OPTICAL SIZE. A single height class looks broken across thirty marks, because
 * a wide wordmark and a square glyph at equal height carry very different
 * visual weight. The fix is three-part: a fixed cell with the mark centred in
 * it, the mark bounded on BOTH axes so wide marks shrink to fit rather than
 * overflow, and a per-mark opticalScale for the handful that still read wrong.
 *
 * Skills with no mark render as set type. That is not a placeholder: Amazon,
 * Microsoft and Google all had their logos removed from Simple Icons on
 * trademark request, so no lawful mark exists for AWS or its services. Drawing
 * one would be fabricating another company's brand. Two registers, deliberately.
 */
export function BrandMark({ skill }: { skill: Skill }) {
  const Mark = skill.icon ? BRAND_MARKS[skill.id as keyof typeof BRAND_MARKS] : undefined

  if (!Mark) {
    return (
      <span
        className={cn(
          'inline-flex h-11 items-center rounded-ctl border border-border px-3',
          'font-mono text-[0.8125rem] tracking-tight text-logo-ink',
        )}
      >
        {skill.name}
      </span>
    )
  }

  return (
    <span className="grid h-11 w-24 place-items-center text-logo-ink" title={skill.name}>
      <Mark
        color="currentColor"
        title={skill.name}
        className="max-h-7 w-auto max-w-20"
        {...(skill.opticalScale
          ? { style: { transform: `scale(${skill.opticalScale})` } }
          : {})}
      />
    </span>
  )
}
