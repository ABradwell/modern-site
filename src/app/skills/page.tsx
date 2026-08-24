import type { Metadata } from 'next'

import { BrandMark } from '@/components/brand/BrandMark'
import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { SKILLS, WALL_GROUPS, SKILL_BY_ID, skillsIn } from '@/content/skills'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import Image from 'next/image'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Engineering roles from a semiconductor test lab and a computer vision placement through to leading a team on biometric authentication. Languages, AWS services, frameworks and infrastructure worked with in production and in research.',
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
 * The technology wall.
 *
 * Category rows of differing length, not a grid of equal cards. Three reasons.
 * A three-column equal-card feature row is the most generic layout there is.
 * Rows let each category be honestly as long or short as it actually is. And a
 * horizontal band sits with the plains horizon behind it rather than fighting it.
 *
 * Two registers interleave down the page: brand marks where a lawful one exists
 * and set type where it does not. That is a licensing constraint turned into the
 * thing that stops the wall being fifty identical cells. See BrandMark.
 *
 * Headed "Technologies", never "Trusted by" or "Partners". These are tools this
 * person has used, not customers, so the accurate heading is also the one that
 * implies no endorsement by any trademark holder.
 */
export default function SkillsPage() {
  const tierTwo = SKILLS.filter((s) => s.tier === 2)

  return (
    <>
      <StationHero>
        <h1
          id="station-title"
          className="text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          Technologies
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          What I reach for, grouped by where it sits in the stack. Everything here has
          been used in anger, not just read about.
        </p>

        <ScrollCue href="#wall" />
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
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {role.company}
                      </span>
                    </div>
                    <span className="tabular font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {range(role.start, role.end)}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-9">
                  <div className="grid gap-8 md:grid-cols-[1fr_12rem] md:gap-12">
                    <div>
                      <p className="max-w-[62ch] text-sm leading-relaxed text-foreground/90">
                        {role.summary}
                      </p>
                      <ul className="mt-5 max-w-[62ch] space-y-3">
                        {role.highlights.map((highlight) => (
                          <li
                            key={highlight}
                            className="border-l border-border-strong pl-4 text-sm leading-relaxed text-muted-foreground"
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
                        {role.stack.map((id) => (
                          <li
                            key={id}
                            className="font-mono text-[0.6875rem] text-muted-foreground"
                          >
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
                      <p className="text-xs text-muted-foreground">{role.location}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        <Section id="education" title="Education">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              {EDUCATION.map((entry) => (
                <Reveal key={entry.institution}>
                  <p className="text-base font-medium text-foreground">
                    {entry.qualification}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.institution}, {entry.location}
                  </p>
                  <p className="tabular mt-1 font-mono text-xs text-muted-foreground">
                    {range(entry.start, entry.end)}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {entry.honours.map((honour) => (
                      <li key={honour} className="text-sm text-foreground/90">
                        {honour}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-foreground">Eligibility</dt>
                  <dd className="mt-2 space-y-1">
                    {CREDENTIALS.map((item) => (
                      <p key={item} className="text-sm text-muted-foreground">
                        {item}
                      </p>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground">Also</dt>
                  <dd className="mt-2 space-y-3">
                    {MINOR_ROLES.map((role) => (
                      <p key={role.company} className="text-sm text-muted-foreground">
                        <span className="text-foreground/90">{role.title}</span>
                        {', '}
                        {role.company}
                        {'. '}
                        <span className="tabular font-mono text-xs">
                          {range(role.start, role.end)}
                        </span>
                      </p>
                    ))}
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </Section>
        <Section id="wall" title="By layer">
          <div className="divide-y divide-border">
            {WALL_GROUPS.map((group, gi) => {
              const items = skillsIn(group.key, 1)
              if (items.length === 0) return null
              return (
                <Reveal key={group.key} index={gi} className="block">
                  <div className="grid gap-4 py-8 md:grid-cols-[10rem_1fr] md:gap-8 md:py-10">
                    <h3 className="pt-2 text-sm font-medium text-foreground">
                      {group.label}
                    </h3>
                    <ul className="flex flex-wrap items-center gap-x-4 gap-y-3">
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

        {/* A measured list rather than more rows, so the page does not present
            the same shape twice. */}
        <Section id="also" title="Also worked with">
          <p className="mb-8 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
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
      </StationContent>
    </>
  )
}
