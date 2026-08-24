'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'

import { STATIONS, stationIndex } from '@/content/stations'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/cn'

/**
 * The primary navigation, and the site's "you are here".
 *
 * Five links on one line with a hairline beneath them and a marker that slides
 * along it. The marker is the point: the site is one landscape travelled west
 * to east, so the nav should read as a position on a route rather than as a set
 * of unrelated tabs. When you navigate, the marker slides in the same direction
 * the terrain pans, which ties the two motions together.
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
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="relative flex items-stretch">
        {STATIONS.map((station, i) => {
          const current = i === active
          return (
            <li key={station.href} style={{ width: `${step}%` }} className="min-w-24">
              <Link
                href={station.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'block px-3 pb-3 text-center text-sm transition-colors',
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
    </nav>
  )
}
