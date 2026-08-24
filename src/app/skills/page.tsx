import type { Metadata } from 'next'

import { BrandMark } from '@/components/brand/BrandMark'
import { Section, StationContent } from '@/components/layout/StationContent'
import { ScrollCue } from '@/components/layout/ScrollCue'
import { StationHero } from '@/components/layout/StationHero'
import { Reveal } from '@/components/system/reveal'
import { SKILLS, WALL_GROUPS, skillsIn } from '@/content/skills'

export const metadata: Metadata = {
  title: 'Skills',
  description:
    'Languages, AWS services, frameworks and infrastructure worked with in production and in research.',
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
