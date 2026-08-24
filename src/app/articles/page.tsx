import type { Metadata } from 'next'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { ARTICLES, ARTICLES_NOTE } from '@/content/articles'
import { CHIP, PROSE, PROSE_TIGHT } from '@/lib/type'

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Two opinion pieces on the state of the software job market and on the reflex to reach for object orientation.',
}

/**
 * Two pieces, presented as two pieces.
 *
 * Nothing here implies a publication record, because there isn't one: these are
 * opinion posts, and the page says where they were published. Four
 * undergraduate coursework PDFs from the old site are deliberately absent, one
 * of which had a student number embedded in its filename.
 *
 * A numbered list rather than cards. The page has two items, and two cards in a
 * grid would look like a grid with four cells missing.
 */
export default function ArticlesPage() {
  return (
    <>
      <StationHero>
        <h1
          id="station-title"
          className="text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          Writing
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          If this page is on the site, it will force me to write more Medium articles on
          topics I know.
        </p>

        <ScrollCue href="#articles" />
      </StationHero>

      <StationContent>
        <Section id="articles" title="Published">
          <ol className="divide-y divide-border border-y border-border">
            {ARTICLES.map((article, i) => (
              <Reveal as="li" key={article.slug} index={i} className="block">
                <a
                  href={article.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid gap-3 py-9 md:grid-cols-[3rem_1fr_auto] md:items-baseline md:gap-8"
                >
                  <span className={`tabular ${CHIP} text-muted-foreground`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block text-lg font-medium text-foreground md:text-xl">
                      {article.title}
                    </span>
                    <span
                      className={`mt-2 block max-w-[62ch] ${PROSE_TIGHT} text-muted-foreground`}
                    >
                      {article.summary}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-primary">
                    {article.venue} {article.year}
                    <ArrowUpRight className="size-3.5" weight="regular" aria-hidden />
                  </span>
                </a>
              </Reveal>
            ))}
          </ol>
        </Section>

        <Section id="next" title="What is coming">
          <p className={`max-w-[62ch] ${PROSE} text-foreground/90`}>{ARTICLES_NOTE}</p>
        </Section>
      </StationContent>
    </>
  )
}
