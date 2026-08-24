import { cn } from '@/lib/cn'
import { formatMonth } from '@/lib/dates'
import { CHIP, META } from '@/lib/type'
import type { Milestone } from '@/content/types'

/**
 * The progression inside a single employer.
 *
 * WHY IT IS NOT MORE ROLE CARDS. Splitting a promotion into sibling accordion
 * items would tell a reader this person had several employers, and would break
 * one continuous tenure into dates they then have to add up themselves. The card
 * stays whole and the arc lives inside it.
 *
 * WHY IT IS NOT A GENERIC VERTICAL TIMELINE. A vertical rail inside an already
 * vertical stack of roles adds a second reading axis to a page that has one, and
 * on a 1400px measure it wastes the width the card has. Horizontal from md up
 * means the progression reads left to right as time, in the space the layout was
 * already giving away, and it echoes the trail the rest of the site is built
 * around. Below md there is no width to read across, so it folds to vertical.
 *
 * The rail is drawn by the items themselves, a dot and a connector per step,
 * rather than by an absolutely positioned line behind them. That way it cannot
 * fall out of alignment with the dots at any width or item count.
 *
 * The last step is the current one by construction, since the array is ordered
 * oldest to newest. It gets the filled node and the only full-strength label on
 * the rail, so a glance lands on where this person is now rather than where they
 * started.
 */
export function RoleProgression({
  items,
  employer,
  className,
}: {
  items: readonly Milestone[]
  employer: string
  className?: string
}) {
  return (
    <div className={className}>
      <h4 className={`${META} font-medium text-foreground`}>Progression at {employer}</h4>

      <ol className="mt-6 flex max-w-[52rem] flex-col md:flex-row">
        {items.map((milestone, index) => {
          const last = index === items.length - 1

          return (
            <li
              key={milestone.date}
              className="flex gap-4 md:min-w-0 md:flex-1 md:flex-col md:gap-0"
            >
              {/* The rail cell: node, then the connector to the next node. */}
              <div className="flex flex-col items-center md:w-full md:flex-row">
                <span
                  aria-hidden
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    last
                      ? 'bg-primary ring-4 ring-primary/20'
                      : 'border border-muted-foreground/50 bg-background',
                  )}
                />
                {last ? null : (
                  <span
                    aria-hidden
                    className="my-1.5 w-px flex-1 bg-border-strong md:mx-2 md:my-0 md:h-px md:w-auto"
                  />
                )}
              </div>

              <div className={cn('md:pt-4 md:pr-8', last ? 'pb-0' : 'pb-8 md:pb-0')}>
                <time
                  dateTime={milestone.date}
                  className={`block ${CHIP} text-muted-foreground`}
                >
                  {formatMonth(milestone.date)}
                </time>

                <p
                  className={cn(
                    'mt-1.5',
                    META,
                    last ? 'font-medium text-foreground' : 'text-foreground/75',
                  )}
                >
                  {milestone.title}
                </p>

                {milestone.note ? (
                  <p className={`mt-1 ${CHIP} text-muted-foreground`}>{milestone.note}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
