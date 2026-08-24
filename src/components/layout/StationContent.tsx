import type { ReactNode } from 'react'

import { CONTENT_OFFSET_DVH } from '@/lib/motion'
import { Z } from '@/lib/z'

/**
 * Everything below the hero.
 *
 * Opaque, unlike the hero, because this is where the landscape stops being the
 * subject. The top offset is what keeps the first heading clear of the near
 * terrain, whose ground line is capped at 106dvh and whose body fades out by
 * 130dvh. See CONTENT_OFFSET_DVH.
 */
export function StationContent({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative"
      style={{ zIndex: Z.content, paddingTop: `${CONTENT_OFFSET_DVH}dvh` }}
    >
      <div className="bg-background">{children}</div>
    </div>
  )
}

/**
 * A section, with the site's vertical rhythm, a real accessible name and a
 * stable anchor.
 *
 * THE ANCHOR IS THE HEADING, not the section element. That is deliberate: a
 * section carries up to 160px of top padding, so `#work` pointing at the section
 * scrolls the reader to a screenful of empty space with the heading somewhere
 * below the fold. Pointing at the heading and giving IT the scroll margin lands
 * the words 32px under the fixed header, which is where a reader following a
 * link expects to arrive.
 *
 * One id per section, used twice: as the anchor target and as the section's
 * accessible name via aria-labelledby. There is no separate `-title` id any
 * more, because two ids for one heading is two things to keep in step.
 *
 * py-24 to py-40 is the low-density end of the scale, chosen because the pages
 * are short and the landscape needs room to be seen between them.
 *
 * There is deliberately no eyebrow slot. The budget for those small uppercase
 * wide-tracking labels is at most one per three sections, and this site ships
 * zero of them: in every case the headline alone carried it, so the slot would
 * only ever have been an invitation to spend a budget nothing needed.
 */
export function Section({
  children,
  id,
  title,
  className,
}: {
  children: ReactNode
  id: string
  title: string
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={['py-12 md:py-12 lg:py-12', className].filter(Boolean).join(' ')}
    >
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="group/heading flex items-baseline gap-2">
          <h2
            id={id}
            className="scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            {title}
          </h2>
          {/*
            The permalink. Hidden until the heading is hovered or the link itself
            is focused, so it is discoverable with a pointer and reachable by
            keyboard without decorating every heading with a hash.
          */}
          <a
            href={`#${id}`}
            aria-label={`Link to the ${title} section`}
            className="rounded-ctl px-1 font-mono text-base text-muted-foreground opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
          >
            #
          </a>
        </div>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  )
}
