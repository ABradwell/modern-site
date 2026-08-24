'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { EXTERNAL_LINKS, STATIONS, stationIndex } from '@/content/stations'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/cn'

/**
 * The primary navigation, and the site's "you are here".
 *
 * The stations sit on one line with a hairline beneath them and a marker that
 * slides along it. The marker is the point: the site is one landscape travelled
 * west to east, so the nav should read as a position on a route rather than as
 * a set of unrelated tabs. When you navigate, the marker slides in the same
 * direction the terrain pans, which ties the two motions together.
 *
 * Off-trail links hang off the end, outside the <ul> on purpose. Keeping them
 * out means the hairline and the marker still divide by STATIONS.length alone,
 * so the trail ends where the site does and the marker cannot drift off it.
 * They size to their own text rather than taking a full station slot, which is
 * also what keeps the row inside the header at the md breakpoint.
 *
 * Kept to a single row and well under the 80px nav height cap. The elevation
 * idea is expressed by the marker's travel rather than by offsetting each link
 * vertically, which would push the nav to two lines and break both rules at
 * once.
 */
export function TrailNav() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const active = stationIndex(pathname)
  const step = 100 / STATIONS.length

  return (
    <nav aria-label="Primary" className="hidden md:flex md:items-stretch">
      <ul className="relative flex flex-1 items-stretch">
        {STATIONS.map((station, i) => {
          const current = i === active
          return (
            <li
              key={station.href}
              style={{ width: `${step}%` }}
              // Tightened one step at md so the row plus the off-trail link
              // costs no more width than the four stations did on their own.
              // "Experience" is the longest label and sets the floor.
              className="min-w-[5.5rem] lg:min-w-24"
            >
              <Link
                href={station.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'block px-2 pb-3 text-center text-sm transition-colors lg:px-3',
                  current
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {station.label}
              </Link>
            </li>
          )
        })}

        {/* The trail itself. aria-hidden because the <a aria-current> above
            already carries the state for assistive tech. */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border-strong" />
        <motion.span
          aria-hidden
          className="absolute bottom-0 h-px bg-primary"
          style={{ width: `${step}%` }}
          initial={false}
          animate={{ left: `${active * step}%` }}
          transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT_EXPO }}
        />
        <motion.span
          aria-hidden
          className="absolute bottom-0 size-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 bg-primary"
          initial={false}
          animate={{ left: `${active * step + step / 2}%` }}
          transition={
            reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 22 }
          }
        />
      </ul>

      {EXTERNAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 pb-3 pl-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground lg:pl-4"
        >
          {link.label}
          <ArrowUpRight
            aria-hidden
            className="ml-1 inline size-3 align-[-0.1em]"
            weight="regular"
          />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </nav>
  )
}
