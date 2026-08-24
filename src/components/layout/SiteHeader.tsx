import Link from 'next/link'

import { SITE } from '@/content/site'
import { ThemeControl } from '@/components/system/theme-control'
import { Z } from '@/lib/z'

import { MobileNav } from './MobileNav'
import { TrailNav } from './TrailNav'

/**
 * Sticky, 64px tall, one line at every breakpoint.
 *
 * backdrop-blur is safe here specifically because the element is fixed: a blur
 * filter on a scrolling container forces continuous GPU repaints, and this one
 * composites once.
 */
export function SiteHeader() {
  return (
    <header
      className="fixed inset-x-0 top-0 border-b border-border bg-[color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur-md"
      style={{ zIndex: Z.header }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 md:px-8">
        <Link
          href="/"
          className="shrink-0 text-sm font-medium tracking-tight text-foreground"
        >
          {SITE.shortName}
        </Link>

        <div className="flex-1" />

        <div className="hidden self-end md:block md:min-w-[26rem] lg:min-w-[32rem]">
          <TrailNav />
        </div>

        <ThemeControl className="hidden md:flex" />
        <MobileNav />
      </div>
    </header>
  )
}
