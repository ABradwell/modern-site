import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { Grain } from '@/components/landscape/Grain'
import { Landscape } from '@/components/landscape/Landscape'
import { LandscapeStatic } from '@/components/landscape/LandscapeStatic'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { ClientBoundary } from '@/components/system/error-boundary'
import { JsonLd } from '@/components/system/json-ld'
import { StationSwipe, StationSwipeContent } from '@/components/system/station-swipe'
import { ThemeProvider } from '@/components/system/theme-provider'
import { SITE } from '@/content/site'
import { CSP_META } from '@/lib/csp'
import { siteGraph } from '@/lib/schema'
import { Z } from '@/lib/z'

import './globals.css'

/**
 * metadataBase is not optional under `output: 'export'`. Without it Next cannot
 * resolve Open Graph image paths to absolute URLs, and every social scraper
 * receives a relative path it cannot fetch.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}, ${SITE.title}`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.shortName,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  /**
   * NO `alternates.canonical` HERE, and no `openGraph.url`.
   *
   * Metadata merges shallowly per field down the route tree, so a canonical set
   * in the root layout is INHERITED VERBATIM by every page that does not set
   * its own. This file used to declare `canonical: '/'`, which meant /skills/,
   * /projects/ and /articles/ each shipped a canonical pointing at the
   * homepage: an instruction to every crawler to treat three of the site's four
   * pages as duplicates of a fourth and drop them from the index, while
   * sitemap.xml went on submitting them. Same trap for `openGraph.url`, which
   * made every shared subpage link resolve and preview as the homepage.
   *
   * Both now live per page, next to the title and description they belong with.
   */
  openGraph: {
    type: 'website',
    siteName: SITE.shortName,
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image' },
  /**
   * NO `robots` HERE either. `index, follow` is already the default for any
   * page that says nothing, so declaring it bought nothing and cost something:
   * Next injects `noindex` into not-found.tsx on its own, and this then emitted
   * a second, contradictory `robots` meta into out/404.html on the same
   * document. Leaving it off means the 404 carries one unambiguous directive.
   */
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ede0d4' },
    { media: '(prefers-color-scheme: dark)', color: '#202417' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      // next-themes writes data-theme before paint. Without this the server
      // markup and the client's first pass disagree on that attribute and React
      // logs a hydration error on every single load.
      suppressHydrationWarning
      // Next 16 dropped the automatic smooth scroll, so anchor navigation needs
      // this declared explicitly.
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-[100svh] antialiased">
        {/*
          React hoists this into <head>, which is where a meta CSP has to be to
          be enforced at all. It is the only copy of the policy that reaches
          DigitalOcean App Platform and GitHub Pages, neither of which can set a
          response header. See src/lib/csp.ts for what it can and cannot cover.
        */}
        <meta httpEquiv="Content-Security-Policy" content={CSP_META} />

        {/*
          Person and WebSite, declared once for the whole site. Each route adds
          its own page-level node that references the Person by @id rather than
          restating it. See src/lib/schema.ts.
        */}
        <JsonLd data={siteGraph} />
        <ThemeProvider>
          <SkipLink />

          {/*
            StationSwipe owns the landscape's pan and the touch gesture that
            drags it, so it has to sit ABOVE both the landscape and the page
            content. It renders no markup of its own.
          */}
          <StationSwipe>
            {/*
            The landscape sits HERE, in the layout, not in any page. That is
            what makes route changes read as travel: App Router preserves layout
            state across navigation, so the component never unmounts and the pan
            is continuous. If it throws, the boundary swaps in a still frame
            rather than letting one animation failure blank the page.
          */}
            <ClientBoundary label="landscape" fallback={<LandscapeStatic />}>
              <Landscape />
            </ClientBoundary>

            <SiteHeader />

            <main
              id="content"
              tabIndex={-1}
              className="relative"
              style={{ zIndex: Z.content }}
            >
              <StationSwipeContent>{children}</StationSwipeContent>
            </main>

            <div className="relative bg-background" style={{ zIndex: Z.content }}>
              <SiteFooter />
            </div>
          </StationSwipe>

          <Grain />
        </ThemeProvider>
      </body>
    </html>
  )
}
