import { ArrowUpRight, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import { CV_INTRO, CV_PDF, SITE } from '@/content/site'
import { WALL_GROUPS, skillsIn } from '@/content/skills'
import type { Role } from '@/content/types'
import { range } from '@/lib/dates'
import { CHIP, META, PROSE, PROSE_TIGHT } from '@/lib/type'

export const metadata: Metadata = {
  title: 'CV',
  description: `Curriculum vitae for ${SITE.name}, ${SITE.title} at ${SITE.company}. Roles and responsibilities, education and eligibility on one page, with the PDF alongside.`,
  alternates: { canonical: '/cv/' },
  openGraph: { url: new URL('/cv/', SITE.url).toString() },
}

/**
 * The CV, as a page.
 *
 * NOT A STATION. It is deliberately absent from STATIONS, so it appears in no
 * nav, no trail, no sitemap and no swipe order. It answers at /cv for anyone
 * handed the link, and the Experience hero points at the PDF it accompanies.
 * Off the trail, the landscape and header resolve to the forest, which is the
 * documented behaviour for any unknown path and is fine here.
 *
 * WHY HTML AND NOT AN EMBEDDED PDF. The CSP ships `frame-src 'none'` and
 * `object-src 'none'` in three places, so an iframe or object over the PDF
 * would be blocked on every host. Mobile browsers also render embedded PDFs
 * badly. So this page is the same ground the PDF covers, read from the typed
 * modules, and the PDF is one click away.
 *
 * RESPONSIBILITIES, NOT PROGRAMMES. The Experience page renders the long role
 * as `deliveries`: named programmes, each argued in a paragraph, for a reader
 * who has chosen to explore. This page renders `responsibilities` instead: the
 * same tenure cut by discipline, in the compressed register a CV is actually
 * read in. Neither is a lossy render of the other, which is why both are
 * authored. See ResponsibilityArea in content/types.ts.
 *
 * ONE COLUMN, NO DISCLOSURES. Everything is open and in reading order, because
 * a CV is scanned rather than navigated, and a collapsed section on a CV is a
 * section that does not get read.
 */

/** One title held, with the span it was held for. */
interface Step {
  readonly title: string
  readonly start: string
  readonly end: string | null
}

/**
 * A role's titles, newest first.
 *
 * The end of each step is the start of the next one, so the spans are derived
 * from the progression rather than authored twice and left to disagree. The
 * newest step inherits the role's own end, which is null while the job is held.
 *
 * Newest first, unlike the Experience page's rail, which runs oldest to newest
 * to show an arc. A CV reader wants the current title first and the history
 * under it, so this list is the arc read from the other end.
 */
function steps(role: Role): readonly Step[] {
  if (!role.progression) {
    return [{ title: role.title, start: role.start, end: role.end }]
  }

  return role.progression
    .map((milestone, i) => ({
      title: milestone.title,
      start: milestone.date,
      end: role.progression![i + 1]?.date ?? role.end,
    }))
    .reverse()
}

export default function CvPage() {
  return (
    <>
      <StationHero>
        <p className={`${CHIP} text-muted-foreground`}>Curriculum vitae</p>
        <h1
          id="station-title"
          className="mt-4 text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          {SITE.name}
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          {SITE.title} at {SITE.company}, {SITE.location}.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={CV_PDF}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-ctl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
          >
            Download resume
            <DownloadSimple className="size-4" weight="regular" aria-hidden />
          </a>
          <Link
            href="/skills"
            className="inline-flex items-center gap-1.5 rounded-ctl border border-border-strong px-6 py-3 text-sm font-medium text-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none dark:bg-background"
          >
            Full experience
            <ArrowUpRight className="size-4" weight="regular" aria-hidden />
          </Link>
        </div>

        <ScrollCue href="#introduction" />
      </StationHero>

      <StationContent>
        <Section id="introduction" title="Introduction">
          <Reveal>
            <p className={`max-w-[64ch] ${PROSE} text-foreground`}>{CV_INTRO}</p>
            {/*
              The contact routes as one line rather than the homepage's list.
              A CV reader is looking for the address, not choosing between four
              ways to make contact, so this is a row of links and not a section.
            */}
            <ul
              className={`mt-7 flex flex-wrap gap-x-6 gap-y-1 ${META} text-muted-foreground`}
            >
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="rounded-ctl hover:text-foreground"
                >
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE.linkedin}
                  target="_blank"
                  rel="me noreferrer"
                  className="rounded-ctl hover:text-foreground"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={SITE.github}
                  target="_blank"
                  rel="me noreferrer"
                  className="rounded-ctl hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </Reveal>
        </Section>

        <Section id="experience" title="Experience">
          <ol className="divide-y divide-border border-y border-border">
            {ROLES.map((role, i) => (
              <li key={role.company}>
                <Reveal index={i} className="block py-10">
                  {/*
                    THE EMPLOYER IS THE HEADING, and the titles are the list
                    under it. Heading the card with the current title instead
                    means the long role prints "Engineering Team Lead" twice,
                    once as the heading and once as the newest step, and it
                    makes a three-title tenure look like a one-title one until
                    the reader gets to the small print.
                  */}
                  <div className="grid gap-1 md:grid-cols-[1fr_auto] md:items-baseline md:gap-6">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                      {role.company}
                    </h3>
                    <p className={`${META} text-muted-foreground`}>{role.location}</p>
                  </div>

                  <ul className="mt-4 space-y-1">
                    {steps(role).map((step) => (
                      <li
                        key={step.title}
                        className={`grid gap-x-6 md:grid-cols-[1fr_auto] md:items-baseline ${META}`}
                      >
                        <span className="text-foreground/90">{step.title}</span>
                        <span
                          className={`tabular ${CHIP} whitespace-nowrap text-muted-foreground`}
                        >
                          {range(step.start, step.end)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className={`mt-6 max-w-[64ch] ${PROSE_TIGHT} text-foreground`}>
                    {role.summary}
                  </p>

                  {/*
                    Responsibilities by discipline for the long tenure, the same
                    label-rail idiom as the competencies list below, so the page
                    does not introduce a second layout family for what is also a
                    term-and-detail structure.
                  */}
                  {role.responsibilities ? (
                    <dl className="mt-8 divide-y divide-border border-t border-border">
                      {role.responsibilities.map((group) => (
                        <div
                          key={group.area}
                          className="grid gap-2 py-6 md:grid-cols-[13rem_1fr] md:gap-8"
                        >
                          <dt className="text-base font-medium text-foreground">
                            {group.area}
                          </dt>
                          <dd>
                            <ul className="max-w-[68ch] space-y-2.5">
                              {group.items.map((item) => (
                                <li
                                  key={item}
                                  className={`grid grid-cols-[0.5rem_1fr] gap-x-4 ${PROSE_TIGHT} text-muted-foreground`}
                                >
                                  <span
                                    aria-hidden
                                    className="mt-[0.6em] size-1.5 rounded-full bg-foreground/40"
                                  />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {/* The short placements, which carry highlights and no areas. */}
                  {!role.responsibilities && role.highlights ? (
                    <ul className="mt-6 max-w-[68ch] space-y-2.5">
                      {role.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className={`grid grid-cols-[0.5rem_1fr] gap-x-4 ${PROSE_TIGHT} text-muted-foreground`}
                        >
                          <span
                            aria-hidden
                            className="mt-[0.6em] size-1.5 rounded-full bg-foreground/40"
                          />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal className="mt-12 block">
            <h3 className="text-base font-medium text-foreground">Previous employment</h3>
            <ul className="mt-4 max-w-[62ch] space-y-3">
              {MINOR_ROLES.map((role) => (
                <li key={role.company} className={`${META} text-muted-foreground`}>
                  <span className="text-foreground/90">{role.title}</span>
                  {', '}
                  {role.company}
                  {'. '}
                  <span className={`tabular ${CHIP}`}>{range(role.start, role.end)}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </Section>

        {/* Set in type, not brand marks. The wall of logos is the Experience
            page's job; a CV wants the names in a form that can be read down. */}
        <Section id="competencies" title="Core competencies">
          <dl className="divide-y divide-border border-y border-border">
            {WALL_GROUPS.map((group, gi) => {
              const items = skillsIn(group.key, 1)
              if (items.length === 0) return null
              return (
                <Reveal key={group.key} index={gi} className="block">
                  <div className="grid gap-2 py-5 md:grid-cols-[13rem_1fr] md:gap-8">
                    <dt className="text-base font-medium text-foreground">
                      {group.label}
                    </dt>
                    <dd className={`max-w-[68ch] ${PROSE_TIGHT} text-muted-foreground`}>
                      {items.map((s) => s.name).join(', ')}
                    </dd>
                  </div>
                </Reveal>
              )
            })}
          </dl>
        </Section>

        <Section id="education" title="Education">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              {EDUCATION.map((entry) => (
                <Reveal key={entry.institution}>
                  <p className="text-base font-medium text-foreground">
                    {entry.qualification}
                  </p>
                  <p className={`mt-1 ${META} text-muted-foreground`}>
                    {entry.institution}, {entry.location}
                  </p>
                  <p className={`tabular mt-1 ${CHIP} text-muted-foreground`}>
                    {range(entry.start, entry.end)}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {entry.honours.map((honour) => (
                      <li key={honour} className={`${PROSE_TIGHT} text-foreground/90`}>
                        {honour}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <dl>
                <dt className="text-base font-medium text-foreground">Eligibility</dt>
                <dd className="mt-3 space-y-1">
                  {CREDENTIALS.map((item) => (
                    <p key={item} className={`${META} text-muted-foreground`}>
                      {item}
                    </p>
                  ))}
                </dd>
              </dl>
            </Reveal>
          </div>
        </Section>
      </StationContent>
    </>
  )
}
