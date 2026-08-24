import type { Metadata } from 'next'
import Image from 'next/image'

import { BrandMark } from '@/components/brand/BrandMark'
import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { JsonLd } from '@/components/system/json-ld'
import { Reveal } from '@/components/system/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RoleProgression } from '@/components/sections/RoleProgression'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import { SITE } from '@/content/site'
import { SKILLS, SKILL_BY_ID, WALL_GROUPS, skillsIn } from '@/content/skills'
import { range } from '@/lib/dates'
import { experienceGraph } from '@/lib/schema'
import { CHIP, META, PROSE, PROSE_TIGHT, TAG } from '@/lib/type'

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Engineering roles from a semiconductor test lab and a computer vision placement through to leading a team on biometric authentication, and the technologies behind them.',
  // Its own canonical and og:url. Inherited from the layout, both pointed here
  // at the homepage, which told crawlers this page was a duplicate of it. The
  // trailing slash matches sitemap.xml and the path the host actually serves.
  alternates: { canonical: '/skills/' },
  openGraph: { url: new URL('/skills/', SITE.url).toString() },
}

/**
 * Experience: roles, competencies, education.
 *
 * ONE PAGE, not two. Skills and experience were separate routes, which meant a
 * reader had to hold the roles in their head while looking at a wall of
 * technologies on a different page to see how the two related. Merging them
 * removed a station from the journey and gave this page enough length to justify
 * the reading order below. `/experience` is gone; this route still answers to
 * /skills and is labelled Experience everywhere a reader sees it.
 *
 * READING ORDER. Roles first, because the roles are the evidence and the
 * technologies are what the evidence was built with. Competencies second, so a
 * reader who has just read what was built can see the toolset behind it.
 * Education last: it is the least current thing on the page, and putting it
 * above the competencies pushed the toolset below the fold for no gain.
 *
 * The technology wall is category rows of differing length rather than a grid of
 * equal cards. A three-column equal-card feature row is the most generic layout
 * there is, rows let each category be honestly as long or short as it actually
 * is, and a horizontal band sits with the plains horizon behind it rather than
 * fighting it.
 *
 * Headed "Core competencies", never "Trusted by" or "Partners". These are tools
 * this person has used, not customers, so the accurate heading is also the one
 * that implies no endorsement by any trademark holder.
 */
export default function ExperiencePage() {
  const tierTwo = SKILLS.filter((s) => s.tier === 2)

  return (
    <>
      <JsonLd data={experienceGraph} />

      <StationHero>
        <h1
          id="station-title"
          className="text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          Experience
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          Moving to the UK in 2023, my initial stomping ground was working at the spoons
          in Burton upon Trent. Funnily enough, that job didn&apos;t make the list below.
        </p>

        <ScrollCue href="#roles" />
      </StationHero>

      <StationContent>
        <Section id="roles" title="Roles">
          {/* Radix Accordion by way of shadcn. The keyboard handling, the
              aria-expanded wiring and the height animation are all worth not
              rebuilding by hand. */}
          <Accordion
            type="multiple"
            defaultValue={[ROLES[0]!.company]}
            className="divide-y divide-border border-y border-border"
          >
            {ROLES.map((role) => (
              <AccordionItem key={role.company} value={role.company} className="border-0">
                <AccordionTrigger className="py-7 hover:no-underline">
                  {/*
                    The logo sits in the trigger, so a collapsed row still says
                    who the employer was. It used to live in the open panel only,
                    which meant three of the four rows identified their employer
                    in small grey type and nothing else. The mark is the fastest
                    thing on the row to recognise, so it belongs where the row is
                    scanned rather than where it is read.

                    A fixed 2.75rem box, object-left, whatever the mark's aspect
                    ratio. Wordmark and square glyph then start at the same x and
                    the titles line up down the list, which is the whole point of
                    a rail.
                  */}
                  <div className="flex flex-1 items-start gap-5 pr-4 text-left">
                    <span className="flex h-7 w-11 shrink-0 items-center md:mt-0.5">
                      {role.logo ? (
                        <Image
                          src={role.logo.src}
                          alt={`${role.logo.alt} logo`}
                          width={160}
                          height={80}
                          className="max-h-6 w-auto max-w-full object-contain object-left opacity-90 dark:opacity-80"
                        />
                      ) : null}
                    </span>

                    <div className="grid flex-1 gap-1.5 md:grid-cols-[1fr_auto] md:items-baseline md:gap-6">
                      <div>
                        {/*
                          Two full steps above the summary in the panel below,
                          not the half step it was. Title and summary were both
                          text-lg, one at font-medium, which is not enough
                          difference to tell a reader which of the two is the
                          heading.
                        */}
                        <span className="block text-lg font-semibold tracking-tight text-foreground md:text-xl">
                          {role.title}
                        </span>
                        <span className={`mt-1 block ${META} text-muted-foreground`}>
                          <span className="text-foreground/75">{role.company}</span>
                          <span aria-hidden className="px-1.5 opacity-50">
                            /
                          </span>
                          {role.location}
                        </span>
                      </div>
                      <span
                        className={`tabular ${CHIP} whitespace-nowrap text-muted-foreground`}
                      >
                        {range(role.start, role.end)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                {/*
                  The panel indents to 4rem on md, which is exactly the logo box
                  plus its gap, so the open content starts on the same x as the
                  title above it rather than under the mark.
                */}
                <AccordionContent className="pb-10 md:pl-16">
                  <p className={`max-w-[58ch] ${PROSE} text-foreground`}>
                    {role.summary}
                  </p>

                  {role.progression ? (
                    <RoleProgression
                      items={role.progression}
                      employer={role.company}
                      current={role.end === null}
                      className="mt-9"
                    />
                  ) : null}

                  {/*
                    A marked list, because an unmarked one is not read as a list.
                    These were three blocks each carrying a left hairline, which
                    is the pull-quote pattern: it said "three separate asides",
                    not "three items of one set". A dot per item and a tighter
                    gap between them says the opposite.
                  */}
                  <ul className="mt-9 max-w-[64ch] space-y-2.5">
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

                  {/*
                    Ruled off, so the stack reads as the card's metadata rather
                    than as a fourth highlight without a bullet.
                  */}
                  <ul className="mt-9 flex flex-wrap gap-1.5 border-t border-border pt-7">
                    {role.stack.map((id) => (
                      <li key={id} className={`${TAG} text-muted-foreground`}>
                        {SKILL_BY_ID.get(id as never)?.name ?? id}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/*
            Previous employment sits with the employment, which is where it
            always belonged. It spent a while filed under Education behind a
            label reading "Also", which described its position on the page rather
            than what it was. These are real jobs, just short ones, and giving
            each a full accordion card would flatten the difference between them
            and the four above.
          */}
          <Reveal className="mt-14 block">
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
          <div className="divide-y divide-border">
            {WALL_GROUPS.map((group, gi) => {
              const items = skillsIn(group.key, 1)
              if (items.length === 0) return null
              return (
                <Reveal key={group.key} index={gi} className="block">
                  <div className="grid gap-4 py-8 md:grid-cols-[10rem_1fr] md:gap-8 md:py-10">
                    <h3 className="pt-2 text-base font-medium text-foreground">
                      {group.label}
                    </h3>
                    <ul className="flex flex-wrap items-center gap-2">
                      {items.map((skill) => (
                        <li key={skill.id}>
                          <BrandMark skill={skill} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Section>

        {/* A measured list rather than more pills, so the page does not present
            the same shape twice and tier two stays visibly tier two. */}
        <Section id="also" title="Also worked with">
          <p className={`mb-8 max-w-[60ch] ${PROSE_TIGHT} text-muted-foreground`}>
            Some freebies and packages I&apos;ve had the chance to learn in passing.
          </p>
          <ul className="flex max-w-[70ch] flex-wrap gap-x-6 gap-y-2">
            {tierTwo.map((skill) => (
              <li key={skill.id} className="font-mono text-sm text-foreground/85">
                {skill.name}
              </li>
            ))}
          </ul>
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
