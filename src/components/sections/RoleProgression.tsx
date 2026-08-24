import { cn } from '@/lib/cn'
import { PRESENT, formatMonth, formatSpan, monthsSince } from '@/lib/dates'
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
 * WHY THE RAIL RUNS PAST THE LAST PROMOTION. A rail that stops on the newest
 * title ends on a date, and a date reads as the moment something finished. For a
 * role still held that is backwards: the newest step is the one still running,
 * and its length is the fact a reader wants. So a current role gets a terminus,
 * and the stretch between the last promotion and now is lit rather than left as
 * ordinary rail. Both ends of that stretch carry the filled node, because what
 * is being shown is the span, not either end of it.
 */
export function RoleProgression({
  items,
  employer,
  current = false,
  className,
}: {
  items: readonly Milestone[]
  employer: string
  /** True where the role is still held, which is what earns the terminus. */
  current?: boolean
  className?: string
}) {
  const steps = railSteps(items, current)

  return (
    <div className={className}>
      <h4 className={`${META} font-medium text-foreground`}>Progression at {employer}</h4>

      <ol className="mt-6 flex max-w-[52rem] flex-col md:flex-row">
        {steps.map((step, index) => {
          const last = index === steps.length - 1
          // The connector belongs to the step it leaves, so it is lit only when
          // both ends of it are. The run-up to the last promotion stays plain.
          const lit = step.lit && (steps[index + 1]?.lit ?? false)

          return (
            <li
              key={step.key}
              className="flex gap-4 md:min-w-0 md:flex-1 md:flex-col md:gap-0"
            >
              {/* The rail cell: node, then the connector to the next node. */}
              <div className="flex flex-col items-center md:w-full md:flex-row">
                <span
                  aria-hidden
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    step.lit
                      ? 'bg-primary ring-4 ring-primary/20'
                      : 'border border-muted-foreground/50 bg-background',
                  )}
                />
                {last ? null : (
                  <span
                    aria-hidden
                    className={cn(
                      'my-1.5 w-px flex-1 md:mx-2 md:my-0 md:h-px md:w-auto',
                      lit ? 'bg-primary/45' : 'bg-border-strong',
                    )}
                  />
                )}
              </div>

              <div className={cn('md:pt-4 md:pr-8', last ? 'pb-0' : 'pb-8 md:pb-0')}>
                {/*
                  The terminus has no machine date to give: `present` is a
                  sentinel, not a month, and putting it in a `datetime`
                  attribute would be invalid. So it renders as plain text in the
                  same slot, which is what the tenure chip on the card above
                  already does.
                */}
                {step.date === PRESENT ? (
                  <span className={`block ${CHIP} text-muted-foreground`}>{PRESENT}</span>
                ) : (
                  <time
                    dateTime={step.date}
                    className={`block ${CHIP} text-muted-foreground`}
                  >
                    {formatMonth(step.date)}
                  </time>
                )}

                <p
                  className={cn(
                    'mt-1.5',
                    META,
                    step.lit ? 'font-medium text-foreground' : 'text-foreground/75',
                  )}
                >
                  {step.title}
                </p>

                {step.note ? (
                  <p className={`mt-1 ${CHIP} text-muted-foreground`}>{step.note}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

interface RailStep {
  readonly key: string
  /** ISO YYYY-MM, or the `PRESENT` sentinel for the terminus. */
  readonly date: string
  readonly title: string
  readonly note?: string
  /** Filled node and full-strength label, rather than outline and dimmed. */
  readonly lit: boolean
}

/**
 * The milestones, plus the terminus where the role is still held.
 *
 * The array is ordered oldest to newest, so the last milestone is the current
 * title by construction and needs no flag in the content file. The terminus is
 * derived rather than authored for the same reason: a hand-written "1 year 6
 * months" is wrong the month after it is written, and a content file should not
 * carry a fact that decays.
 */
function railSteps(items: readonly Milestone[], current: boolean): readonly RailStep[] {
  const newest = items.at(-1)

  const steps: RailStep[] = items.map((milestone, index) => ({
    key: milestone.date,
    date: milestone.date,
    title: milestone.title,
    note: milestone.note,
    lit: index === items.length - 1,
  }))

  if (!current || !newest) return steps

  return [
    ...steps,
    {
      key: PRESENT,
      date: PRESENT,
      title: `${formatSpan(monthsSince(newest.date))} in the role`,
      lit: true,
    },
  ]
}
