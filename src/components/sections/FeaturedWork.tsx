import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { Reveal } from '@/components/system/reveal'
import { FEATURED_PROJECTS, PROJECTS } from '@/content/projects'
import { SKILL_BY_ID } from '@/content/skills'
import { CHIP, PROSE_TIGHT } from '@/lib/type'

/**
 * The featured projects, as an asymmetric split.
 *
 * The lead project sits in the wider column with the project index directly
 * beneath it, and the two remaining projects stack in the narrower column
 * alongside.
 *
 * WHY THE SECOND CELL EXISTS. With the lead alone in that column, the column
 * still had to match the height of the two cards stacked beside it, and a grid
 * column stretches its auto-sized rows to fill: the lead card was being grown
 * from a natural 658px to 881px, so a single screenshot ended up dominating the
 * section out of all proportion to its importance. The row template below is
 * what fixes that. `auto` gives the lead exactly its natural height and `1fr`
 * hands every remaining pixel to the index, which turns the slack the lead used
 * to absorb into something worth reading.
 *
 * min-h on the index is the guard for the other direction: if the lead ever grew
 * taller than the two cards beside it, the 1fr row would collapse to nothing.
 *
 * CSS Grid with fractional columns rather than flexbox percentage arithmetic.
 * The arrangement appears exactly once on the site: the projects page uses a
 * different one, so this family is not repeated.
 */
export function FeaturedWork() {
  const [lead, ...rest] = FEATURED_PROJECTS

  if (!lead) return null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid grid-cols-1 gap-6 lg:grid-rows-[auto_1fr]">
        <Reveal>
          <ProjectPanel project={lead} priority large />
        </Reveal>
        <Reveal index={1} className="block">
          <ProjectIndex />
        </Reveal>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
        {rest.map((project, i) => (
          <Reveal key={project.slug} index={i + 2}>
            <ProjectPanel project={project} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

function ProjectPanel({
  project,
  large = false,
  priority = false,
}: {
  project: (typeof FEATURED_PROJECTS)[number]
  large?: boolean
  priority?: boolean
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card">
      {project.image ? (
        <div
          className={`relative overflow-hidden bg-muted ${large ? 'aspect-[16/9]' : 'aspect-[16/11]'}`}
        >
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            // The lead image is the largest thing above the fold once the reader
            // reaches this section, so it is the LCP candidate on the landing
            // page and is fetched eagerly. The rest are not.
            priority={priority}
            sizes={
              large ? '(min-width: 1024px) 55vw, 100vw' : '(min-width: 1024px) 28vw, 50vw'
            }
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className={`font-semibold tracking-tight ${large ? 'text-xl' : 'text-lg'}`}>
            {project.name}
          </h3>
          <span className={`tabular ${CHIP} text-muted-foreground`}>{project.year}</span>
        </div>

        <p className={`mt-3 max-w-[52ch] ${PROSE_TIGHT} text-muted-foreground`}>
          {project.summary}
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
          {project.stack.slice(0, 4).map((id) => (
            <li key={id} className={`${CHIP} text-muted-foreground`}>
              {SKILL_BY_ID.get(id as never)?.name ?? id}
            </li>
          ))}
        </ul>

        {/* Pinned to the bottom so the links form one clean line across the
            group regardless of how much copy sits above them. */}
        <div className="mt-auto pt-6">
          {project.repo ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              Repository
              <ArrowUpRight className="size-3.5" weight="regular" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/**
 * The rest of the work, listed by name, with one way through to the full page.
 *
 * NOT one big link. Wrapping a heading, five rows and a call to action in a
 * single anchor gives that anchor an accessible name forty words long, and the
 * usual fix for that, an aria-label, throws the list away for anyone reading by
 * name. A plain container with one unambiguous link at the bottom says the same
 * thing with none of that.
 *
 * The list is drawn from PROJECTS, so it cannot fall out of step with the page it
 * points at, and the count and the earliest year are computed rather than written
 * into the copy for the same reason. It reads as an index rather than a teaser,
 * which is the honest description of what it is: the names are here so a reader
 * can decide whether the full page is worth a click.
 *
 * No image. It is a door, not an exhibit, and giving it one would put it in
 * competition with the three real cards around it.
 */
const EARLIEST_YEAR = Math.min(...PROJECTS.map((p) => p.year))

function ProjectIndex() {
  return (
    <div className="flex h-full min-h-56 flex-col rounded-card border border-border bg-card p-6 md:p-8">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        All projects
      </h3>
      <p className={`mt-1 ${PROSE_TIGHT} text-muted-foreground`}>
        {PROJECTS.length} in total, back to {EARLIEST_YEAR}
      </p>

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {PROJECTS.map((project) => (
          <li
            key={project.slug}
            className="flex items-baseline justify-between gap-4 py-2.5"
          >
            <span className={`${PROSE_TIGHT} text-foreground/90`}>{project.name}</span>
            <span className={`tabular ${CHIP} shrink-0 text-muted-foreground`}>
              {project.year}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/projects"
        className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary"
      >
        See all {PROJECTS.length}
        <ArrowRight
          className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          weight="regular"
          aria-hidden
        />
      </Link>
    </div>
  )
}
