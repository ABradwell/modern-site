/**
 * The body type scale.
 *
 * Four steps, each with one job. Before this the site set prose at text-sm,
 * text-base, text-lg and text-xl depending on which page it happened to be on,
 * plus three arbitrary text-[0.6875rem] values, which is how a scale stops being
 * a scale. The About paragraphs were the size that read best, so PROSE is that
 * size and everything else is measured against it.
 *
 * Size and leading only, never colour. Colour is a separate decision at each
 * call site, and folding it in here would mean every muted paragraph needed a
 * second class to undo the first.
 *
 * Headings, nav, buttons and the hero are deliberately outside this scale. They
 * are not body copy: headings carry their own responsive ramp, and controls sit
 * at a fixed text-sm across the whole site so that a link never changes size
 * depending on which section it landed in.
 *
 * The rule for choosing between the first two: a paragraph carrying the
 * section's argument is PROSE, a paragraph qualifying it is PROSE_TIGHT.
 */

/** Section prose. Paragraphs a reader actually reads. The reference size. */
export const PROSE = 'text-lg leading-relaxed'

/**
 * Prose inside a card, a dense list, or a caveat under a heading. One step down,
 * because a card's measure is far narrower than a section's and PROSE crowds it.
 */
export const PROSE_TIGHT = 'text-base leading-relaxed'

/** Labels, dates, locations, supporting lines. Never a paragraph. */
export const META = 'text-sm leading-relaxed'

/** Technology chips and the smallest supporting marks. Replaces the arbitrary values. */
export const CHIP = 'font-mono text-xs'
