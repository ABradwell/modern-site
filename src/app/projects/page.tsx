import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { JsonLd } from '@/components/system/json-ld'
import { Reveal } from '@/components/system/reveal'
import { PROJECTS } from '@/content/projects'
import { SITE } from '@/content/site'
import { SKILL_BY_ID } from '@/content/skills'
import { projectsGraph } from '@/lib/schema'
import { CHIP, META, PROSE_TIGHT } from '@/lib/type'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Five projects, from a music player built in 2025 back through convolutional networks, webcam processing and a clinic simulation.',
  // See the note in skills/page.tsx. Inherited canonicals pointed every station
  // at the homepage.
  alternates: { canonical: '/projects/' },
  openGraph: { url: new URL('/projects/', SITE.url).toString() },
}

/**
 * Five projects, five cells, no empty tiles.
 *
 * A grid with exactly as many cells as there is content for. The two rows are
 * weighted differently, 3fr/2fr against 2fr/3fr, so the arrangement is
 * asymmetric without needing a sixth item invented to balance it.
 *
 * The dates are honest. Four of these are undergraduate coursework and are
 * labelled with the year they were done, because a 2022 project presented as
 * timeless reads worse than one presented as 2022.
 */
export default function ProjectsPage() {
  return (
    <>
      <JsonLd data={projectsGraph} />

      <StationHero>
        <h1
          id="station-title"
          className="text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          Projects
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          Nothing excites people like three-year-old projects with accompanying videos of
          me as a younger lad, eh? Enjoy some archives from pre-industry, and pre-24/7
          startup coding.
        </p>

        <ScrollCue href="#projects" />
      </StationHero>

      <StationContent>
        <Section id="projects" title="Built">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {PROJECTS.map((project, i) => (
              <Reveal
                key={project.slug}
                index={i}
                className={
                  // Row one: 3/2. Row two: 2/3. Row three: full width.
                  [
                    'lg:col-span-3',
                    'lg:col-span-2',
                    'lg:col-span-2',
                    'lg:col-span-3',
                    'lg:col-span-5',
                  ][i]
                }
              >
                <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card">
                  {project.image ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <Image
                        src={project.image.src}
                        alt={project.image.alt}
                        width={project.image.width}
                        height={project.image.height}
                        priority={i === 0}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg font-semibold tracking-tight md:text-xl">
                        {project.name}
                      </h3>
                      <span className={`tabular ${CHIP} text-muted-foreground`}>
                        {project.year}
                      </span>
                    </div>

                    <p className={`mt-4 max-w-[62ch] ${PROSE_TIGHT} text-foreground/90`}>
                      {project.detail}
                    </p>

                    {project.credit ? (
                      // Attribution stays on the card, not in a footnote. The
                      // original tutorial credited no author, which is worth
                      // saying rather than quietly omitting.
                      <p
                        className={`mt-4 max-w-[62ch] border-l border-border-strong pl-4 ${META} text-muted-foreground`}
                      >
                        {project.credit}
                      </p>
                    ) : null}

                    <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
                      {project.stack.map((id) => (
                        <li key={id} className={`${CHIP} text-muted-foreground`}>
                          {SKILL_BY_ID.get(id as never)?.name ?? id}
                        </li>
                      ))}
                    </ul>

                    {/* Pinned to the bottom so links form one line across the
                        row whatever the copy above does. */}
                    <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-6">
                      {project.repo ? (
                        <a
                          href={project.repo}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                        >
                          Repository
                          <ArrowUpRight
                            className="size-3.5"
                            weight="regular"
                            aria-hidden
                          />
                        </a>
                      ) : null}
                      {project.live ? (
                        <a
                          href={project.live}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                        >
                          Live
                          <ArrowUpRight
                            className="size-3.5"
                            weight="regular"
                            aria-hidden
                          />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>
      </StationContent>
    </>
  )
}
