'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ProjectShelf } from '@/content/projects'
import type { Project, ProjectGroupId } from '@/content/types'
import { SKILL_BY_ID } from '@/content/skills'
import { EASE_OUT_EXPO, REVEAL_OFFSET } from '@/lib/motion'
import { CHIP, META, PROSE_TIGHT } from '@/lib/type'

/** Which stage project is showing, and which way the reader last travelled. */
interface Position {
  readonly index: number
  readonly dir: 1 | -1
}

/**
 * The projects page: one tab per group, each with a stage and a full index.
 *
 * WHY TABS. The work comes from two lives, university and now, and the two
 * should not compete on one surface. A tab per group keeps the page the same
 * length however many projects land, and the index under each stage is the
 * complete list, so nothing in a group hangs on the stage to be found.
 *
 * Both panels are force-mounted and the inactive one hidden, so every project is
 * in the exported HTML for crawlers and for the in-page anchors below.
 *
 * STATE LIVES HERE, not in the stage, because three things move it: the arrows,
 * the index links, and the URL hash on arrival. Each group keeps its own place,
 * so switching tabs and back returns to the project the reader left.
 */
export function ProjectShowcase({ shelves }: { shelves: readonly ProjectShelf[] }) {
  const [tab, setTab] = useState<ProjectGroupId>(shelves[0]?.group.id ?? 'modern-work')
  const [positions, setPositions] = useState<Record<string, Position>>({})
  const [announcement, setAnnouncement] = useState('')
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const tabsRef = useRef<HTMLDivElement>(null)

  const show = (shelf: ProjectShelf, index: number, dir: 1 | -1, announce = true) => {
    const count = shelf.stage.length
    const next = (index + count) % count
    const project = shelf.stage[next]
    if (!project) return
    setPositions((p) => ({ ...p, [shelf.group.id]: { index: next, dir } }))
    // replaceState, not a hash assignment: the link follows the stage without
    // scrolling the page or filling the back button with every arrow press.
    window.history.replaceState(null, '', `#${project.slug}`)
    if (announce) setAnnouncement(`${next + 1} of ${count}: ${project.name}`)
  }

  // /projects/#hand-tracker opens the right tab on the right project, whether it
  // is the address the reader arrived on or a link followed from elsewhere on
  // the page. replaceState above never fires hashchange, so the arrows do not
  // loop back through here.
  useEffect(() => {
    const follow = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1))
      if (!slug) return
      for (const shelf of shelves) {
        const index = shelf.stage.findIndex((p) => p.slug === slug)
        if (shelf.group.id !== slug && index < 0) continue
        setTab(shelf.group.id)
        if (index >= 0) {
          setPositions((p) => ({ ...p, [shelf.group.id]: { index, dir: 1 } }))
        }
        // To the tabs rather than the stage, so the reader lands knowing which
        // group they are in. A frame later, once the panel has laid out.
        requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ block: 'start' }))
        return
      }
    }
    const frame = requestAnimationFrame(follow)
    window.addEventListener('hashchange', follow)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', follow)
    }
  }, [shelves])

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as ProjectGroupId)}
      className="gap-10"
    >
      <TabsList
        ref={tabsRef}
        aria-label="Project groups"
        className="h-11 scroll-mt-24 self-start"
      >
        {shelves.map(({ group }) => (
          <TabsTrigger key={group.id} value={group.id} className="px-4">
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {shelves.map((shelf) => {
        const at = positions[shelf.group.id] ?? { index: 0, dir: 1 }
        return (
          <TabsContent
            key={shelf.group.id}
            value={shelf.group.id}
            forceMount
            className="grid gap-16 data-[state=inactive]:hidden"
          >
            {shelf.stage.length > 0 ? (
              <ProjectStage
                ref={(el) => {
                  stageRefs.current[shelf.group.id] = el
                }}
                label={`${shelf.group.label} projects`}
                projects={shelf.stage}
                position={at}
                priority={shelf === shelves[0]}
                onStep={(dir) => show(shelf, at.index + dir, dir)}
              />
            ) : null}

            <ProjectIndex
              shelf={shelf}
              current={shelf.stage[at.index]?.slug}
              onSelect={(index) => {
                show(shelf, index, index >= at.index ? 1 : -1)
                stageRefs.current[shelf.group.id]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
            />
          </TabsContent>
        )
      })}

      {/* One polite region for the page, filled only by a reader's own action. */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </Tabs>
  )
}

/**
 * One group's stage. Every project is rendered into the same grid cell, so the
 * stage is as tall as its tallest project and nothing below it moves when the
 * arrows are pressed. The inactive ones are `inert` and invisible rather than
 * unmounted, which is what keeps that height.
 *
 * No swipe. A horizontal drag anywhere on the page already travels between
 * stations (see station-swipe.tsx), and a second sideways gesture here would
 * fight it. The arrows are the control.
 */
function ProjectStage({
  ref,
  label,
  projects,
  position,
  priority,
  onStep,
}: {
  ref: (el: HTMLDivElement | null) => void
  label: string
  projects: readonly Project[]
  position: Position
  priority: boolean
  onStep: (dir: 1 | -1) => void
}) {
  const reduce = useReducedMotion()
  const many = projects.length > 1

  // Keys only while focus is inside the stage. A page-level listener would take
  // left and right away from everything else, and the landscape already gives
  // sideways movement a meaning across the site.
  const onKeyDown = (e: KeyboardEvent) => {
    if (!many) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onStep(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onStep(1)
    }
  }

  return (
    // The WAI-ARIA carousel pattern puts arrow keys on the region itself. The
    // handler only listens; every control inside is a real button or link.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={ref}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="grid scroll-mt-24 gap-6"
    >
      <div className="grid">
        {projects.map((project, i) => {
          const active = i === position.index
          return (
            <motion.article
              key={project.slug}
              id={project.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${projects.length}: ${project.name}`}
              aria-hidden={!active}
              inert={!active}
              initial={false}
              // Keyframes rather than a from/to pair, so the project that arrives
              // always comes in from the side the reader is travelling toward.
              animate={
                active && !reduce
                  ? { opacity: [0, 1], x: [position.dir * REVEAL_OFFSET, 0] }
                  : { opacity: active ? 1 : 0, x: 0 }
              }
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className={[
                'col-start-1 row-start-1 grid scroll-mt-24 gap-6 lg:grid-cols-[5fr_7fr] lg:gap-10',
                active ? '' : 'invisible',
              ].join(' ')}
            >
              {project.image ? (
                <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-muted lg:aspect-[4/3]">
                  <Image
                    src={project.image.src}
                    alt={project.image.alt}
                    width={project.image.width}
                    height={project.image.height}
                    priority={priority && i === 0}
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="size-full object-cover"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-5">
                <span className={`tabular ${CHIP} text-muted-foreground`}>
                  {project.year}
                </span>
                <h3
                  className="text-3xl font-semibold tracking-tighter text-foreground md:text-4xl"
                  style={{ lineHeight: 1.08 }}
                >
                  {project.name}
                </h3>
                <p className="max-w-[46ch] text-lg leading-relaxed text-foreground">
                  {project.summary}
                </p>
                <p className={`max-w-[58ch] ${PROSE_TIGHT} text-muted-foreground`}>
                  {project.detail}
                </p>
                {project.credit ? (
                  <p
                    className={`max-w-[58ch] border-l border-border-strong pl-4 ${META} text-muted-foreground`}
                  >
                    {project.credit}
                  </p>
                ) : null}
                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                  {project.stack.map((id) => (
                    <li key={id} className={`${CHIP} text-muted-foreground`}>
                      {SKILL_BY_ID.get(id as never)?.name ?? id}
                    </li>
                  ))}
                </ul>
                <ProjectLinks project={project} />
              </div>
            </motion.article>
          )
        })}
      </div>

      {/* A single project is a feature block, not a carousel of one. */}
      {many ? (
        <div className="flex items-center justify-end gap-3">
          <StepButton dir={-1} onClick={() => onStep(-1)} />
          <span
            className={`tabular ${CHIP} min-w-12 text-center text-muted-foreground`}
            aria-hidden
          >
            {position.index + 1} / {projects.length}
          </span>
          <StepButton dir={1} onClick={() => onStep(1)} />
        </div>
      ) : null}
    </div>
  )
}

function StepButton({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  const Icon = dir < 0 ? ArrowLeft : ArrowRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? 'Previous project' : 'Next project'}
      className="inline-flex size-11 items-center justify-center rounded-ctl border border-border-strong text-foreground transition-colors hover:bg-muted motion-reduce:transition-none"
    >
      <Icon className="size-4" weight="regular" aria-hidden />
    </button>
  )
}

/**
 * Every project in the group, newest first, as rows rather than tiles so a
 * project without an image reads as complete. Staged projects are listed here
 * too: this is the one full list, and its names link to the stage.
 */
function ProjectIndex({
  shelf,
  current,
  onSelect,
}: {
  shelf: ProjectShelf
  current: string | undefined
  onSelect: (stageIndex: number) => void
}) {
  const { group } = shelf
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border-strong pb-3">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          All {group.label.toLowerCase()}
        </h3>
        <span className={`${META} text-muted-foreground`}>{group.period}</span>
      </div>

      {/* One grid for the list, rows on its subgrid, so the columns line up
          whether or not a row carries a stage marker. */}
      <ul className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,2fr)_auto]">
        {shelf.projects.map((project) => {
          const stageIndex = shelf.stage.findIndex((p) => p.slug === project.slug)
          const staged = stageIndex >= 0
          const showing = project.slug === current
          return (
            <li
              key={project.slug}
              className="col-span-full grid grid-cols-subgrid items-baseline gap-y-1 border-b border-border py-4"
            >
              <span className={`tabular ${CHIP} text-muted-foreground`}>
                {project.year}
              </span>
              {staged ? (
                <a
                  href={`#${project.slug}`}
                  onClick={(e: MouseEvent) => {
                    e.preventDefault()
                    onSelect(stageIndex)
                  }}
                  aria-current={showing ? 'true' : undefined}
                  className="font-semibold text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-current"
                >
                  {project.name}
                </a>
              ) : (
                <span className="font-semibold text-foreground">{project.name}</span>
              )}
              <p
                className={`col-start-2 md:col-start-auto ${META} text-muted-foreground`}
              >
                {project.summary}
              </p>
              <div className="col-start-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 md:col-start-auto md:justify-end">
                {staged ? (
                  <span
                    className={[
                      `rounded-sm border border-primary px-1.5 ${CHIP}`,
                      showing ? 'bg-primary text-primary-foreground' : 'text-primary',
                    ].join(' ')}
                  >
                    {showing ? 'Showing' : 'On stage'}
                  </span>
                ) : null}
                <ProjectLinks project={project} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ProjectLinks({ project }: { project: Project }) {
  if (!project.repo && !project.live) return null
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {project.live ? <OutLink href={project.live}>Live</OutLink> : null}
      {project.repo ? <OutLink href={project.repo}>Repository</OutLink> : null}
    </div>
  )
}

function OutLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
    >
      {children}
      <ArrowUpRight className="size-3.5" weight="regular" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
