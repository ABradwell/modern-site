import Link from 'next/link'

import { LandscapeStatic } from '@/components/landscape/LandscapeStatic'
import { STATIONS } from '@/content/stations'
import { Z } from '@/lib/z'

/**
 * Renders to out/404.html at build time, which is the filename Vercel,
 * Cloudflare Pages and GitHub Pages all serve for unmatched paths. That is why
 * trailingSlash stays at its default: turning it on can relocate this to
 * out/404/index.html and silently break 404 handling on two of those three.
 *
 * A Server Component that takes no props, so it cannot read the attempted
 * pathname. Rather than adding a client island purely to echo a URL back at
 * someone, it offers the trail instead, which is more use.
 *
 * The animated landscape lives in the layout and covers this page too. This
 * static copy is the no-JS floor, so the scene is present even if nothing
 * hydrates.
 */
export default function NotFound() {
  return (
    <>
      <div className="hidden [html:has(&)_&]:block">
        <LandscapeStatic />
      </div>

      <section
        className="relative flex min-h-[100dvh] items-center pt-28"
        style={{ zIndex: Z.content }}
      >
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
          <p className="font-mono text-sm text-muted-foreground">404</p>
          <h1
            className="mt-4 max-w-[24ch] text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
            style={{ lineHeight: 1.08 }}
          >
            Off the trail
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
            There is nothing at this address. The five places that do exist are below.
          </p>

          <ul className="mt-10 flex flex-wrap gap-3">
            {STATIONS.map((station) => (
              <li key={station.href}>
                <Link
                  href={station.href}
                  className="inline-flex min-h-11 items-center rounded-ctl border border-border-strong px-5 text-sm font-medium text-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
                >
                  {station.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
