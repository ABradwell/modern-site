import type { Metadata } from 'next'
import Image from 'next/image'

import { BrandMark } from '@/components/brand/BrandMark'
import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import { SKILLS, SKILL_BY_ID, WALL_GROUPS, skillsIn } from '@/content/skills'
import { CHIP, META, PROSE, PROSE_TIGHT } from '@/lib/type'

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Engineering roles from a semiconductor test lab and a computer vision placement through to leading a team on biometric authentication, and the technologies behind them.',
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "Jan 2021", from an ISO YYYY-MM, without pulling in a date library. */
function formatMonth(iso: string): string {
  const [year, month] = iso.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

/** A plain hyphen between dates. Not an en dash, and certainly not an em dash. */
function range(start: string, end: string | null): string {
  return `${formatMonth(start)} - ${end ? formatMonth(end) : 'present'}`
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
      <StationHero>
        <h1
          id="station-title"
          className="text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          Experience
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          Where I have worked, what I built there, and the tools it was built with.
          Everything here has been used in anger, not just read about.
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
                  <div className="grid flex-1 gap-1 pr-4 text-left md:grid-cols-[1fr_auto] md:items-baseline md:gap-6">
                    <div>
                      <span className="block text-base font-medium text-foreground md:text-lg">
                        {role.title}
                      </span>
                      <span className={`mt-0.5 block ${META} text-muted-foreground`}>
                        {role.company}
                      </span>
                    </div>
                    <span
                      className={`tabular ${CHIP} whitespace-nowrap text-muted-foreground`}
                    >
                      {range(role.start, role.end)}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-9">
                  <div className="grid gap-8 md:grid-cols-[1fr_12rem] md:gap-12">
                    <div>
                      <p className={`max-w-[62ch] ${PROSE} text-foreground/90`}>
                        {role.summary}
                      </p>
                      <ul className="mt-5 max-w-[62ch] space-y-3">
                        {role.highlights.map((highlight) => (
                          <li
                            key={highlight}
                            className={`border-l border-border-strong pl-4 ${PROSE_TIGHT} text-muted-foreground`}
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
                        {role.stack.map((id) => (
                          <li key={id} className={`${CHIP} text-muted-foreground`}>
                            {SKILL_BY_ID.get(id as never)?.name ?? id}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                      {role.logo ? (
                        <Image
                          src={role.logo.src}
                          alt={`${role.logo.alt} logo`}
                          width={160}
                          height={80}
                          className="h-10 w-auto max-w-[9rem] object-contain object-left opacity-80 dark:opacity-70"
                        />
                      ) : null}
                      <p className={`${META} text-muted-foreground`}>{role.location}</p>
                    </div>
                  </div>
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
            Less current, or used on a single project, but real. Kept separate rather than
            padding the list above.
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
