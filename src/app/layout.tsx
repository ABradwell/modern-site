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
import { StationSwipe, StationSwipeContent } from '@/components/system/station-swipe'
import { ThemeProvider } from '@/components/system/theme-provider'
import { SITE } from '@/content/site'
import { SKILLS } from '@/content/skills'
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
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.shortName,
    title: `${SITE.name}, ${SITE.title}`,
    description: SITE.description,
    url: SITE.url,
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ede0d4' },
    { media: '(prefers-color-scheme: dark)', color: '#202417' },
  ],
}

/** Person schema. knowsAbout falls out of the typed skills module for free. */
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.name,
  url: SITE.url,
  jobTitle: SITE.title,
  worksFor: { '@type': 'Organization', name: SITE.company },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Manchester',
    addressCountry: 'GB',
  },
  sameAs: [SITE.github, SITE.linkedin],
  knowsAbout: SKILLS.filter((s) => s.tier === 1).map((s) => s.name),
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
        <script
          type="application/ld+json"
          // Static, author-controlled JSON. No user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
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
