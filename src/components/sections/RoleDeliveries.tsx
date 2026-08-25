import { cn } from '@/lib/cn'
import { CHIP, META, PROSE_TIGHT, TAG } from '@/lib/type'
import type { Delivery } from '@/content/types'

/**
 * The substantial work inside one role, as programmes rather than bullets.
 *
 * WHY NOT THE BULLET LIST IT REPLACES. Three bullets are the right form for a
 * four-month placement. For a tenure spanning several pivots they flatten
 * everything to one weight, so a fortnight's task and a year's programme read
 * identically, and they push the writer toward naming technologies because a
 * technology fits in a bullet and a piece of work does not. The list below is
 * the same information given room to keep its shape.
 *
 * WHY THE DISCIPLINE IS AN EYEBROW AND NOT A TAG. It is the reason each entry
 * is on the page: one delivery, one distinct skill set, which is a claim the
 * reader can only check if the skill set is stated rather than inferred
 * from the prose. Putting it above the name means it is read first, so the list
 * scans as a spread of disciplines before it is read as a set of projects. As a
 * tag in the row below it would sit among the tooling and lose that job.
 *
 * WHY AN ORDERED LIST WITH VISIBLE NUMERALS. The order is meaningful: these run
 * roughly as they happened, which is also dependency order. The numeral is the
 * only thing on the page holding the gutter the bullets used to occupy, so the
 * entries still line up on one left edge without a dot per item pretending a
 * run of paragraph-length blocks is a list of short phrases. It is aria-hidden
 * because the `ol` already conveys ordinal position to a screen reader, and
 * announcing "01" before every entry is noise.
 */
export function RoleDeliveries({
  items,
  className,
}: {
  items: readonly Delivery[]
  className?: string
}) {
  return (
    <div className={className}>
      <h4 className={`${META} font-medium text-foreground`}>Selected deliveries</h4>

      {/* Hairlines between, not around. A boxed card per delivery inside an
          already-bordered accordion panel is three nested frames deep. */}
      <ol className="mt-2 divide-y divide-border">
        {items.map((delivery, index) => (
          <li
            key={delivery.id}
            className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 py-8 sm:gap-x-6"
          >
            <span
              aria-hidden
              className={cn('tabular mt-1', CHIP, 'text-muted-foreground/70')}
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0">
              <p className={`${CHIP} tracking-wide text-primary uppercase`}>
                {delivery.discipline}
              </p>

              <h5 className="mt-2.5 max-w-[42ch] text-lg font-semibold tracking-tight text-foreground">
                {delivery.name}
              </h5>

              <p className={`mt-2 max-w-[58ch] ${PROSE_TIGHT} text-foreground/90`}>
                {delivery.summary}
              </p>

              {/* A step down from the summary, because it is the part a reader
                  drops into only once the summary has earned it. */}
              <p className={`mt-3.5 max-w-[68ch] ${META} text-muted-foreground`}>
                {delivery.detail}
              </p>

              <ul className="mt-5 flex flex-wrap gap-1.5">
                {delivery.tools.map((tool) => (
                  <li key={tool} className={`${TAG} text-muted-foreground`}>
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
