import type { Metadata } from 'next'
import Image from 'next/image'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Section, StationContent } from '@/components/layout/StationContent'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import { SKILL_BY_ID } from '@/content/skills'

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Engineering roles from a semiconductor test lab and a computer vision placement through to leading a team on biometric authentication.',
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

export default function ExperiencePage() {
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
          Four roles that mattered, from a semiconductor test lab to leading a team on
          biometric authentication.
        </p>
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
      </StationContent>
    </>
  )
}
