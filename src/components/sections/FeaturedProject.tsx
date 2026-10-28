import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { Reveal } from '@/components/system/reveal'
import { HOME_FEATURE } from '@/content/projects'
import { SKILL_BY_ID } from '@/content/skills'
import { CHIP, META, PROSE, TAG } from '@/lib/type'

/**
 * One project, given the room to be looked at.
 *
 * A media-led split: the lead screenshot takes the wider column with the rest
 * of the gallery in a row of three beneath it, and the copy sits alongside. The
 * projects page shows one image per project on a stage, so this is the only
 * place the gallery appears and the only place on the home page with this
 * shape, which keeps it from reading as a second copy of the About split.
 *
 * Server-rendered and static. The gallery is to be seen, not driven: no
 * lightbox, no carousel, so nothing here competes with station-swipe for
 * horizontal drags.
 */
export function FeaturedProject() {
  const project = HOME_FEATURE
  const gallery = project.gallery ?? []

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        {project.image ? (
          <Reveal>
            <div className="overflow-hidden rounded-card border border-border bg-muted">
              <Image
                src={project.image.src}
                alt={project.image.alt}
                width={project.image.width}
                height={project.image.height}
                sizes="(min-width: 1400px) 780px, (min-width: 1024px) 56vw, 100vw"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </Reveal>
        ) : null}

        {gallery.length > 0 ? (
          <ul className="mt-4 grid grid-cols-3 gap-4">
            {gallery.map((shot, i) => (
              <Reveal as="li" key={shot.src} index={i + 1}>
                <figure>
                  <div className="overflow-hidden rounded-card border border-border bg-muted">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      sizes="(min-width: 1400px) 250px, (min-width: 1024px) 18vw, 33vw"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </div>
                  {shot.caption ? (
                    <figcaption
                      className={`mt-2 hidden ${META} text-muted-foreground sm:block`}
                    >
                      {shot.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </Reveal>
            ))}
          </ul>
        ) : null}
      </div>

      <Reveal index={1} className="flex flex-col">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            {project.name}
          </h3>
          <span className={`tabular ${CHIP} text-muted-foreground`}>{project.year}</span>
        </div>

        <p className={`mt-4 ${PROSE} text-foreground/90`}>{project.summary}</p>
        <p className={`mt-4 ${META} text-muted-foreground`}>{project.detail}</p>

        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Built with">
          {project.stack.map((id) => (
            <li key={id} className={`${TAG} text-muted-foreground`}>
              {SKILL_BY_ID.get(id as never)?.name ?? id}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          {project.live ? (
            <a
              href={project.live}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-ctl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
            >
              Play the town
              <ArrowUpRight className="size-3.5" weight="regular" aria-hidden />
            </a>
          ) : null}
          <Link
            href={`/projects/#${project.slug}`}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            All projects
            <ArrowRight
              className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              weight="regular"
              aria-hidden
            />
          </Link>
        </div>
      </Reveal>
    </div>
  )
}
