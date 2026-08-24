import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { AllProjectsLink, FeaturedWork } from '@/components/sections/FeaturedWork'
import { Section, StationContent } from '@/components/layout/StationContent'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { ABOUT, HERO_SUBTEXT, SITE } from '@/content/site'

/**
 * The landing page. Four layout families, none repeated: the layered hero, an
 * asymmetric project split, a single-column read, and a minimal close.
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
          <a
            href={`mailto:${SITE.email}`}
            className="rounded-ctl border border-border-strong px-6 py-3 text-sm font-medium text-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
          >
            {SITE.contactLabel}
          </a>
        </div>
      </StationHero>

      <StationContent>
        <Section id="work" title="Selected work">
          <FeaturedWork />
          <div className="mt-10">
            <AllProjectsLink />
          </div>
        </Section>

        {/* Single column, measured to 65ch. A different family from the split
            above, which is what keeps the page from reading as one idea twice. */}
        <Section id="about" title="About">
          <div className="grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-20">
            <div className="max-w-[65ch]">
              {ABOUT.map((paragraph, i) => (
                <Reveal key={i} index={i}>
                  <p className="mb-6 text-base leading-relaxed text-foreground/90">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
              <Reveal index={ABOUT.length}>
                <Link
                  href="/experience"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
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

        {/* Minimal close, high negative space. One CTA, and the same label the
            hero and footer use. */}
        <Section id="contact" title={SITE.contactLabel}>
          <div className="max-w-[46ch]">
            <p className="text-lg leading-relaxed text-foreground/90 md:text-xl">
              If you are hiring, building something in authentication, or just want to
              argue about object orientation, write to me.
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-8 inline-flex items-center gap-2 text-base font-medium text-primary"
            >
              {SITE.email}
              <ArrowUpRight className="size-4" weight="regular" aria-hidden />
            </a>
          </div>
        </Section>
      </StationContent>
    </>
  )
}
