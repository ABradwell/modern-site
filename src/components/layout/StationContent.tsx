import type { ReactNode } from 'react'

import { CONTENT_OFFSET_DVH } from '@/lib/motion'
import { Z } from '@/lib/z'

/**
 * Everything below the hero.
 *
 * Opaque, unlike the hero, because this is where the landscape stops being the
 * subject. The top offset is what keeps the first heading clear of the near
 * terrain, which reaches 168dvh and would otherwise sit permanently in front of
 * it. See CONTENT_OFFSET_DVH.
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
 * A section, with the site's vertical rhythm and a real accessible name.
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
      id={id}
      aria-labelledby={`${id}-title`}
      className={['py-24 md:py-32 lg:py-40', className].filter(Boolean).join(' ')}
    >
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <h2
          id={`${id}-title`}
          className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
        >
          {title}
        </h2>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  )
}
