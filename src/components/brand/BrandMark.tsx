import type { Skill } from '@/content/types'

import { BRAND_MARKS } from './registry'

/**
 * One pill on the technology wall: a mark where a lawful one exists, and the
 * name always.
 *
 * ONE SHAPE, NOT TWO REGISTERS. This used to render logo-backed skills as a
 * bare centred mark in a fixed 96px cell and mark-less ones as a bordered type
 * chip. The licensing reason for the split is real and unchanged, but the visual
 * result was two different objects sharing a row, and a reader who did not
 * happen to recognise a glyph got nothing from it. Every skill is now the same
 * bordered pill, the name is always set, and the mark is a prefix on the ones
 * that have it. The two registers become one, with a decoration.
 *
 * That also retires most of the optical-size problem. Marks are no longer
 * carrying a cell on their own at 28px, so a wide wordmark next to a square
 * glyph no longer reads as a weight mismatch; both are bounded to 16px on BOTH
 * axes beside 14px type. `opticalScale` survives for the handful that still sit
 * wrong inside that box, and does much less work than it did.
 *
 * TINT. Not brand colours. Thirty brand hexes is a rainbow, and next to a
 * five-colour palette it reads as breakage rather than as variety. Every mark
 * takes currentColor from a single --logo-ink token, which flips once per theme
 * and carries the whole wall with it.
 *
 * The mark is aria-hidden and carries no title. It sits directly beside the
 * name, so labelling it would make a screen reader announce every technology
 * twice. Skills with no mark are not placeholders: Amazon, Microsoft and Google
 * all had their logos removed from Simple Icons on trademark request, so no
 * lawful mark exists for AWS or its services, and drawing one would be
 * fabricating another company's brand.
 */
export function BrandMark({ skill }: { skill: Skill }) {
  const Mark = skill.icon ? BRAND_MARKS[skill.id as keyof typeof BRAND_MARKS] : undefined

  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-ctl border border-border px-3 text-logo-ink">
      {Mark ? (
        <Mark
          color="currentColor"
          aria-hidden
          className="max-h-4 w-auto max-w-4 shrink-0"
          {...(skill.opticalScale
            ? { style: { transform: `scale(${skill.opticalScale})` } }
            : {})}
        />
      ) : null}
      <span className="font-mono text-sm tracking-tight whitespace-nowrap">
        {skill.name}
      </span>
    </span>
  )
}
