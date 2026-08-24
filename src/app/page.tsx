import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { FeaturedWork } from '@/components/sections/FeaturedWork'
import { ContactRoutes } from '@/components/sections/ContactRoutes'
import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { ABOUT, HERO_SUBTEXT, SITE } from '@/content/site'
import { PROSE } from '@/lib/type'

/**
 * The landing page. Three layout families below the hero, none repeated: a
 * single-column read against a portrait, a two-column close, and an asymmetric
 * project grid.
 *
 * Section order is About, then Get in touch, then Selected work. Contact sitting
 * above the work rather than closing the page is deliberate on the owner's part:
 * the page's job is to get someone to make contact, and the projects are
 * supporting evidence a reader can go on to browse.
 */
export default function HomePage() {
  return (
    <>
      <StationHero>
        <h1
          id="station-title"
          className="text-4xl font-semibold tracking-tighter text-foreground md:text-5xl lg:text-6xl"
          // leading-[1.1] rather than leading-none: anything tighter clips the
          // descender on the g in Stevenson Bradwell at display sizes.
          style={{ lineHeight: 1.08 }}
        >
          Aiden Stevenson
          <br />
          Bradwell
        </h1>

        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          {HERO_SUBTEXT}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/projects"
            className="rounded-ctl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
          >
            View projects
          </Link>
          {/*
            An in-page jump, not a mailto. Firing the reader's mail client at
            them from a hero button is abrupt, does nothing at all if they have
            no client configured, and offers no alternative. This scrolls to the
            contact block instead, where every route is on show.
          */}
          <a
            href="#contact"
            className="rounded-ctl border border-border-strong px-6 py-3 text-sm font-medium text-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
          >
            {SITE.contactLabel}
          </a>
        </div>

        <ScrollCue href="#about" />
      </StationHero>

      <StationContent>
        {/* Single column, measured to 65ch. A different family from the split
            above, which is what keeps the page from reading as one idea twice. */}
        <Section id="about" title="About">
          <div className="grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-20">
            <div className="max-w-[65ch]">
              {ABOUT.map((paragraph, i) => (
                <Reveal key={i} index={i}>
                  <p className={`mb-6 ${PROSE} text-foreground/90`}>{paragraph}</p>
                </Reveal>
              ))}
              <Reveal index={ABOUT.length}>
                {/* inline-flex, not an inline `display: flex` override. A flex
                    box stretches to the width of its container, which made this
                    a full-measure bar rather than a button, and the inline style
                    also dropped the alignment and gap the arrow needs. */}
                <Link
                  href="/skills"
                  className="inline-flex items-center gap-1.5 rounded-ctl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
                >
                  Full experience
                  <ArrowUpRight className="size-3.5" weight="regular" aria-hidden />
                </Link>
              </Reveal>
            </div>

            <Reveal className="lg:pt-2">
              <Image
                src="/images/people/headshot.jpeg"
                alt={`${SITE.name}, photographed against a plain background`}
                width={800}
                height={800}
                sizes="(min-width: 1024px) 18rem, 60vw"
                className="w-full max-w-[18rem] rounded-card border border-border object-cover"
              />
            </Reveal>
          </div>
        </Section>

        {/* The close, and the destination of both the hero button and the
            footer link. Still high negative space: one line of copy and a list
            of routes, nothing else. */}
        <Section id="contact" title={SITE.contactLabel}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <p className={`max-w-[46ch] ${PROSE} text-foreground/90`}>
              Whether you&apos;re looking to work together, start something new, or extend
              your network, please do not hesitate to reach out!
            </p>
            <ContactRoutes />
          </div>
        </Section>

        <Section id="work" title="Selected work">
          {/* The all-projects card lives inside the grid now, under the lead
              project, so there is no trailing link to append here. */}
          <FeaturedWork />
        </Section>
      </StationContent>
    </>
  )
}
