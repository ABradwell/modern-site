import { BrandMark } from '@/components/brand/BrandMark'
import { Reveal } from '@/components/system/reveal'
import { WALL_GROUPS, skillsIn } from '@/content/skills'

/**
 * The technology wall: every tier-1 skill as a BrandMark pill, grouped into
 * category rows of differing length rather than a grid of equal cards.
 *
 * A three-column equal-card feature row is the most generic layout there is.
 * Rows let each category be honestly as long or short as it actually is, and a
 * horizontal band sits with the plains horizon behind it rather than fighting
 * it.
 *
 * ONE COMPONENT, TWO PAGES. The home page closes with this wall and the
 * Experience page opens with it, so the markup lives here rather than being
 * copied between the two. The tier-1 filter and the wall order stay in
 * src/content/skills.ts; this file only presents them.
 *
 * Headed "Core competencies" by the page, never "Trusted by" or "Partners".
 * These are tools this person has used, not customers, so the accurate heading
 * is also the one that implies no endorsement by any trademark holder.
 */
export function CoreCompetencies() {
  return (
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
  )
}
