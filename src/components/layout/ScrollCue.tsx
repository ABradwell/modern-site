import { CaretDown } from '@phosphor-icons/react/dist/ssr'

/**
 * "Scroll for more", pointing at the first section of the page.
 *
 * A REAL LINK, not a decorative cue. It names its destination in its href, it
 * is in the tab order, it responds to Enter, and clicking it jumps to the
 * section. That is what the brief asked for and it is also what makes it
 * defensible: the thing usually worth avoiding is an ornament that animates
 * forever and does nothing when pressed.
 *
 * It sits in the hero's normal flow rather than pinned to the bottom of the
 * viewport, which is what pays for the rest of its behaviour. It scrolls away on
 * its own, so nothing has to fade it out, toggle its visibility or pull it back
 * out of the tab order once it is gone, and there is never an invisible but
 * clickable target sitting over the page. Pinned cues need all of that.
 *
 * No looping animation. The caret shifts down two pixels on hover and focus, so
 * the affordance is tied to the reader's own pointer rather than nagging at
 * them, and there is nothing left to gate under reduced motion beyond the
 * transition itself.
 */
export function ScrollCue({
  href,
  label = 'Scroll for more',
}: {
  href: string
  label?: string
}) {
  return (
    <a
      href={href}
      className="group mt-14 inline-flex items-center gap-2 rounded-ctl text-sm font-medium text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
    >
      {label}
      <CaretDown
        className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-y-0.5 group-focus-visible:translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        weight="regular"
        aria-hidden
      />
    </a>
  )
}
