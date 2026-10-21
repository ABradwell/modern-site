import type { Metadata } from 'next'

import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { ProjectShowcase } from '@/components/sections/ProjectShowcase'
import { JsonLd } from '@/components/system/json-ld'
import { PROJECT_SHELVES } from '@/content/projects'
import { SITE } from '@/content/site'
import { projectsGraph } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Personal and university projects, from a music player built in 2025 back through convolutional networks, webcam processing and a clinic simulation.',
  // See the note in skills/page.tsx. Inherited canonicals pointed every station
  // at the homepage.
  alternates: { canonical: '/projects/' },
  openGraph: { url: new URL('/projects/', SITE.url).toString() },
}

/**
 * Projects, shelved by group.
 *
 * Each group is a tab with a stage and a full index; see ProjectShowcase. This
 * replaced a 3/2, 2/3, full-width grid that was authored for exactly five
 * projects and had no room for the sixth that was coming.
 *
 * The dates are honest. The university work is labelled with the year it was
 * done, because a 2022 project presented as timeless reads worse than one
 * presented as 2022.
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
          <ProjectShowcase shelves={PROJECT_SHELVES} />
        </Section>
      </StationContent>
    </>
  )
}
