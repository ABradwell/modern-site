import { ArrowUpRight, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import { ABOUT, CV_PDF, SITE } from '@/content/site'
import { WALL_GROUPS, skillsIn } from '@/content/skills'
import { range } from '@/lib/dates'
import { CHIP, META, PROSE, PROSE_TIGHT } from '@/lib/type'

export const metadata: Metadata = {
  title: 'CV',
  description: `Curriculum vitae for ${SITE.name}, ${SITE.title} at ${SITE.company}. Roles, education and eligibility on one page, with the PDF alongside.`,
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
 * badly. So this page is the same content the PDF carries, read from the typed
 * modules the rest of the site renders from, and the PDF is one click away.
 * Nothing here is a second copy to maintain.
 *
 * ONE COLUMN, NO DISCLOSURES. The Experience page hides roles behind an
 * accordion because it is a place to explore. A CV is a place to scan, so
 * everything is open and in reading order: summary, roles, competencies,
 * education, eligibility.
 */
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
            Download PDF
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

        <ScrollCue href="#summary" />
      </StationHero>

      <StationContent>
        <Section id="summary" title="Summary">
          <Reveal>
            <p className={`max-w-[64ch] ${PROSE} text-foreground`}>{ABOUT[0]}</p>
            <ul
              className={`mt-6 flex flex-wrap gap-x-6 gap-y-1 ${META} text-muted-foreground`}
            >
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-foreground">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE.linkedin}
                  target="_blank"
                  rel="me noreferrer"
                  className="hover:text-foreground"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={SITE.github}
                  target="_blank"
                  rel="me noreferrer"
                  className="hover:text-foreground"
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
                <Reveal index={i} className="block py-9">
                  <div className="grid gap-1.5 md:grid-cols-[1fr_auto] md:items-baseline md:gap-6">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                        {role.title}
                      </h3>
                      <p className={`mt-1 ${META} text-muted-foreground`}>
                        <span className="text-foreground/75">{role.company}</span>
                        <span aria-hidden className="px-1.5 opacity-50">
                          /
                        </span>
                        {role.location}
                      </p>
                    </div>
                    <p
                      className={`tabular ${CHIP} whitespace-nowrap text-muted-foreground`}
                    >
                      {range(role.start, role.end)}
                    </p>
                  </div>

                  <p className={`mt-5 max-w-[64ch] ${PROSE_TIGHT} text-foreground`}>
                    {role.summary}
                  </p>

                  {/*
                    Deliveries flatten to one line each here: the name carries
                    the programme and the summary carries the takeaway. The
                    detail paragraphs stay on the Experience page, where a
                    reader has chosen to open the role.
                  */}
                  <ul className="mt-5 max-w-[64ch] space-y-2.5">
                    {(role.deliveries ?? []).map((d) => (
                      <li
                        key={d.id}
                        className={`grid grid-cols-[0.5rem_1fr] gap-x-4 ${PROSE_TIGHT} text-muted-foreground`}
                      >
                        <span
                          aria-hidden
                          className="mt-[0.6em] size-1.5 rounded-full bg-foreground/40"
                        />
                        <span>
                          <span className="text-foreground/90">{d.name}.</span>{' '}
                          {d.summary}
                        </span>
                      </li>
                    ))}
                    {(role.highlights ?? []).map((h) => (
                      <li
                        key={h}
                        className={`grid grid-cols-[0.5rem_1fr] gap-x-4 ${PROSE_TIGHT} text-muted-foreground`}
                      >
                        <span
                          aria-hidden
                          className="mt-[0.6em] size-1.5 rounded-full bg-foreground/40"
                        />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
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

        <Section id="competencies" title="Core competencies">
          <dl className="divide-y divide-border">
            {WALL_GROUPS.map((group, gi) => {
              const items = skillsIn(group.key, 1)
              if (items.length === 0) return null
              return (
                <Reveal key={group.key} index={gi} className="block">
                  <div className="grid gap-2 py-5 md:grid-cols-[10rem_1fr] md:gap-8">
                    <dt className="text-base font-medium text-foreground">
                      {group.label}
                    </dt>
                    <dd className={`${PROSE_TIGHT} text-muted-foreground`}>
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
