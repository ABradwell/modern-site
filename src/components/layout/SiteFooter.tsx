import Link from 'next/link'

import { SITE } from '@/content/site'
import { STATIONS } from '@/content/stations'

/**
 * Grouped with a hairline rather than boxed, since nothing here needs elevation.
 * The contact link uses SITE.contactLabel, the same string as the hero, because
 * two differently worded routes to one inbox is one route too many.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-sm font-medium text-foreground">{SITE.name}</p>
            <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              {SITE.title} at {SITE.company}. {SITE.location}.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xs font-medium text-muted-foreground">Pages</h2>
            <ul className="mt-3 space-y-2">
              {STATIONS.map((station) => (
                <li key={station.href}>
                  <Link
                    href={station.href}
                    className="text-sm text-foreground/85 hover:text-foreground"
                  >
                    {station.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-medium text-muted-foreground">Elsewhere</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-sm text-foreground/85 hover:text-foreground"
                >
                  {SITE.contactLabel}
                </a>
              </li>
              <li>
                <a
                  href={SITE.github}
                  className="text-sm text-foreground/85 hover:text-foreground"
                  rel="me noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={SITE.linkedin}
                  className="text-sm text-foreground/85 hover:text-foreground"
                  rel="me noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-14 text-xs text-muted-foreground">
          Built with Next.js and hand-drawn terrain. Source on{' '}
          <a href={SITE.github} className="underline hover:text-foreground">
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
