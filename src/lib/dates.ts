/**
 * Date formatting for content dates.
 *
 * ISO YYYY-MM in the content files, human months on the page. Lifted out of the
 * experience page when the progression timeline needed the same formatting, so
 * that "Jul 2023" is rendered by one function everywhere rather than two that
 * can drift apart.
 *
 * No date library. The input is a fixed-shape string written by hand in a
 * content file, so parsing it is a split and an index lookup.
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** The sentinel a content date uses for a position still held. */
export const PRESENT = 'present'

/** "Jan 2021", from an ISO YYYY-MM. `PRESENT` passes straight through. */
export function formatMonth(iso: string): string {
  if (iso === PRESENT) return PRESENT
  const [year, month] = iso.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

/** A plain hyphen between dates. Not an en dash, and certainly not an em dash. */
export function range(start: string, end: string | null): string {
  return `${formatMonth(start)} - ${end ? formatMonth(end) : PRESENT}`
}

/**
 * Whole months from an ISO YYYY-MM to now.
 *
 * `now` is injected so the progression rail's terminus is a pure function of
 * its inputs and can be reasoned about. In the app it is left to default, which
 * on a statically exported page means the span is fixed at build time. That is
 * the right trade here: the alternative is a client component recomputing a
 * number that moves once a month, and the site rebuilds far more often than
 * that.
 */
export function monthsSince(iso: string, now: Date = new Date()): number {
  const [year, month] = iso.split('-')
  const years = now.getFullYear() - Number(year)
  return Math.max(0, years * 12 + (now.getMonth() + 1 - Number(month)))
}

/**
 * "8 months", "1 year", "1 year 6 months".
 *
 * Months all the way up to a year, then years and months, because "19 months"
 * is a number a reader has to divide and "1 year 7 months" is one they read.
 */
export function formatSpan(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12

  if (years === 0) return plural(rest, 'month')
  if (rest === 0) return plural(years, 'year')
  return `${plural(years, 'year')} ${plural(rest, 'month')}`
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}
