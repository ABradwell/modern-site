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
