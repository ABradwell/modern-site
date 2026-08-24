import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { Reveal } from '@/components/system/reveal'
import { FEATURED_PROJECTS } from '@/content/projects'
import { SKILL_BY_ID } from '@/content/skills'

/**
 * Three featured projects as an asymmetric split, the lead item wide and the
 * other two stacked beside it.
 *
 * CSS Grid with fractional columns rather than flexbox percentage arithmetic.
 * The layout appears exactly once on the site: the projects page uses a
 * different arrangement so this family is not repeated.
 */
export function FeaturedWork() {
  const [lead, ...rest] = FEATURED_PROJECTS

  if (!lead) return null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Reveal>
        <ProjectPanel project={lead} priority large />
      </Reveal>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
        {rest.map((project, i) => (
          <Reveal key={project.slug} index={i + 1}>
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
          className={`relative overflow-hidden bg-muted ${large ? 'aspect-[16/10]' : 'aspect-[16/11]'}`}
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
          <h3
            className={`font-semibold tracking-tight ${large ? 'text-xl md:text-2xl' : 'text-lg'}`}
          >
            {project.name}
          </h3>
          <span className="tabular font-mono text-xs text-muted-foreground">
            {project.year}
          </span>
        </div>

        <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          {project.summary}
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
          {project.stack.slice(0, 4).map((id) => (
            <li key={id} className="font-mono text-[0.6875rem] text-muted-foreground">
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

export function AllProjectsLink() {
  return (
    <Link
      href="/projects"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
    >
      All projects
      <ArrowUpRight className="size-3.5" weight="regular" aria-hidden />
    </Link>
  )
}
