'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'

import { STATIONS, stationIndex } from '@/content/stations'
import { SITE } from '@/content/site'
import { ThemeControl } from '@/components/system/theme-control'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/cn'

/**
 * Mobile navigation, on Radix Dialog by way of shadcn's Sheet.
 *
 * This is the single highest-value component the library brings to this site.
 * The focus trap, the escape handling, the scroll lock, the aria wiring and the
 * return of focus to the trigger on close are all things a hand-rolled drawer
 * gets subtly wrong, and a drawer is exactly where portfolios fail
 * accessibility. Not worth rebuilding.
 */
export function MobileNav() {
  const pathname = usePathname()
  const active = stationIndex(pathname)
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex size-11 items-center justify-center rounded-ctl border border-border text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <List className="size-5" weight="regular" />
      </SheetTrigger>

      <SheetContent side="right" className="w-[min(20rem,88vw)] bg-card">
        <SheetHeader>
          <SheetTitle className="text-left text-base font-medium">
            {SITE.shortName}
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Primary" className="px-4">
          <ul className="flex flex-col">
            {STATIONS.map((station, i) => (
              <li key={station.href}>
                <Link
                  href={station.href}
                  onClick={() => setOpen(false)}
                  aria-current={i === active ? 'page' : undefined}
                  className={cn(
                    // 44px minimum tap target.
                    'flex min-h-11 items-center border-b border-border text-base',
                    i === active
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {station.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 px-4">
          <p className="mb-2 text-xs text-muted-foreground">Colour theme</p>
          <ThemeControl />
        </div>
      </SheetContent>
    </Sheet>
  )
}
