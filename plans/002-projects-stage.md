# Projects page: stage and grouped index

Status: proposed. Pick a layout choice and answer the open questions before
building.

Date: 2026-10-21

## Summary

Rebuild `/projects` around option C from the layout study ("Feature and
archive"), with two additions:

1. **A stage with left and right arrows.** One project is shown large at a time.
   Arrows move between a short, ordered list of stage projects.
2. **Groups.** Every project belongs to a named group, starting with
   `modern-work` and `university-work`. More modern projects are on the way, so
   the page must handle groups that grow at different rates, and a group with
   only one project.

This replaces the current 3/2, 2/3, full-width grid, which is written for
exactly five projects and breaks as soon as a sixth arrives.

## Goals

- Recent work leads. Older work stays visible and honestly dated.
- Adding a project means editing content only, never column spans.
- A group can have one project or twenty without the layout changing.
- Same accessibility floor as the rest of the site: keyboard, screen reader,
  reduced motion, both themes, 400px width.

## Non-goals

- Per-project detail pages. Possible later; not part of this change.
- Autoplay. The stage never moves on its own.
- Swipe on the stage. See [Gestures](#gestures).
- Changing the home page. `FeaturedWork` keeps reading the `featured` flag.

## Layout choices

All four share the same stage component and content model (see
[Shared spec](#shared-spec)). They differ in how the stage relates to the
groups.

### Choice 1: one stage, grouped index below

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────┐   MODERN WORK · 2025                   │
│  │              │   Bradwell Music                       │
│  │    image     │   A player for ten original tracks…    │
│  │              │   Story paragraph…                     │
│  │              │   TypeScript  React  Vite              │
│  └──────────────┘   [Listen]  Repository ↗               │
│                                                          │
│                              ‹    1 / 3    ›             │
└──────────────────────────────────────────────────────────┘

Modern work · 2025 to now
  2025  Bradwell Music          A player for ten original…   ● on stage

University work · 2021 to 2022
  2022  Number Recognition      A convolutional network…     ● on stage
  2022  Hand Tracker            Live hand detection…         ● on stage
  2022  Walk-In Clinic Sim…     A statistical model…
  2021  Live-Feed Image Proc…   A webcam processor…
```

The stage cycles through every stage project regardless of group. The eyebrow
names the group, so moving from Bradwell Music to Number Recognition reads as
crossing from one era to the other. Below the stage, each group gets a heading
and a complete index of its projects.

- **Good:** works today with one modern project. One set of arrows, one place to
  look. The index under it is a full, scannable list.
- **Watch:** the stage mixes eras, so ordering matters. Put modern first.

### Choice 2: a stage per group

```
Modern work · 2025 to now
┌───────────────────────── stage ──────────────────────────┐
│  image  │ Bradwell Music …                    (no arrows) │
└──────────────────────────────────────────────────────────┘
  index: Bradwell Music

University work · 2021 to 2022
┌───────────────────────── stage ──────────────────────────┐
│  image  │ Number Recognition …          ‹   1 / 2   ›     │
└──────────────────────────────────────────────────────────┘
  index: Number Recognition, Hand Tracker, Clinic, Image Processor
```

Each group is its own section with its own stage and index.

- **Good:** groups are fully independent. Strongest structure once both groups
  have several projects.
- **Watch:** two large stages on one page is heavy. Today the modern stage has a
  single project, so its arrows are hidden and it looks like a different
  component from the one below it. Section permalinks and the trail nav already
  handle multiple sections, so the cost is visual, not technical.

### Choice 3: group switch above one stage

```
          [ Modern work ]  [ University work ]

┌──────────────────────────────────────────────────────────┐
│  image  │ Bradwell Music …                ‹   1 / 1   ›   │
└──────────────────────────────────────────────────────────┘
  index for the selected group only
```

A segmented control picks the group. The stage and index below show only that
group.

- **Good:** compact. Scales to three or four groups without getting longer.
- **Watch:** hides a whole group behind a control, which is the opposite of
  "older work stays visible". Needs a tabs pattern (Radix `Tabs` is already in
  `src/components/ui/tabs.tsx`) and a no-JS fallback that shows every group.
  Weakest choice while there are only two groups.

### Choice 4: stage with a jump rail

```
┌──────────────────────────────────────────────────────────┐
│  image  │ Number Recognition …                            │
│                                         ‹   2 / 3   ›     │
├──────────────────────────────────────────────────────────┤
│  2025 Bradwell Music · 2022 Number Recognition · 2022 Hand │
│                      ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                 │
└──────────────────────────────────────────────────────────┘
Grouped index below, as in choice 1.
```

Choice 1 plus a row of stage project names under the stage. Each name jumps
straight to its project. The arrows still step one at a time.

- **Good:** every stage project is visible without pressing anything, which
  fixes the main weakness of any carousel.
- **Watch:** with the index right below, the rail repeats information. Only
  worth it if the stage list grows past three or four.

### Recommendation

**Choice 1 now.** It is the only one that looks deliberate with a single modern
project, and it keeps every project visible without a click. When the modern
group reaches two or three stage-worthy projects, revisit choice 2. Because both
use the same stage component, moving from 1 to 2 is a page-level change, not a
rewrite.

## Shared spec

Applies whichever choice is picked.

### Content model

`src/content/types.ts`:

```ts
export type ProjectGroupId = 'modern-work' | 'university-work'

export interface ProjectGroup {
  readonly id: ProjectGroupId
  /** Section heading, e.g. "Modern work". */
  readonly label: string
  /** Shown beside the heading, e.g. "2021 to 2022". */
  readonly period: string
  /** Optional one-line framing under the heading. */
  readonly blurb?: string
}

export interface Project {
  // …existing fields
  readonly group: ProjectGroupId
  /** Longer copy for the stage. Falls back to `detail` when absent. */
  readonly story?: string
}
```

`group` is required, so the compiler refuses a project with no home.

`src/content/projects.ts`:

```ts
/** Page order. The first group is shown first in the index. */
export const PROJECT_GROUPS: readonly ProjectGroup[] = [
  { id: 'modern-work', label: 'Modern work', period: '2025 to now' },
  { id: 'university-work', label: 'University work', period: '2021 to 2022' },
]

/** Stage order. Arrows follow this list exactly. */
export const STAGE: readonly string[] = [
  'bradwell-music',
  'number-recognition',
  'hand-tracker',
]

export const STAGE_PROJECTS = STAGE.map((slug) => {
  const project = PROJECTS.find((p) => p.slug === slug)
  // Throws during the static build, so a typo never ships.
  if (!project) throw new Error(`STAGE references unknown project "${slug}"`)
  return project
})

export const PROJECTS_BY_GROUP = PROJECT_GROUPS.map((group) => ({
  group,
  projects: PROJECTS.filter((p) => p.group === group.id).sort((a, b) => b.year - a.year),
}))
```

Why an ordered list instead of a `stage: boolean` flag: arrow order is part of
the design, and a flag scattered across objects cannot express it. One list in
one place is easier to review.

`featured` is unchanged and still means "shown on the home page". The two lists
are independent and may overlap.

For choice 2, stage membership is per group: `STAGE` becomes
`Record<ProjectGroupId, readonly string[]>`. Everything else stays the same.

### Stage behaviour

**Layout.** Image on the left, copy on the right at `lg`, roughly 5fr/7fr as in
the study. Stacked on narrow screens with the image first. Copy order: group
eyebrow and year (`CHIP`), name (heading), `summary` (lede), `story ?? detail`
(`PROSE_TIGHT`), `credit` if present, stack, links.

**Arrows.** Two buttons, Phosphor `ArrowLeft` and `ArrowRight`, matching the
icons already used on the site. `rounded-ctl`, `border-border-strong`, at least
44px square on touch, visible `--ring` focus. Accessible names "Previous
project" and "Next project". A counter between them in `CHIP` with tabular
figures: `2 / 3`.

**Ends.** Arrows wrap from the last project to the first and back. With two or
three items, a dead button at each end costs more than it explains. Open
question below if you prefer hard stops.

**One item.** When a stage has a single project, the arrows and counter are not
rendered. The stage is just a feature block.

**Keyboard.** Left and Right arrow keys change project only while focus is
inside the stage. Never a page-level listener; the landscape already owns
horizontal meaning across the site.

**Deep links.** Each stage project gets the slug as its anchor id. Loading
`/projects/#hand-tracker` opens the stage on Hand Tracker and scrolls to it.
Changing project calls `history.replaceState` with the new hash, so a copied
link points at what is on screen without filling the back stack. Group sections
use `modern-work` and `university-work` as their ids, which cannot collide with
a slug as long as no project is named after a group.

**No layout shift.** Every stage project is rendered into the same grid cell
(`grid-area: 1 / 1`). The container is as tall as the tallest project, so
pressing an arrow never moves the content below. Inactive projects get `inert`
and `visibility: hidden`. The image frame has one fixed aspect ratio (`4/3` at
`lg`, `16/10` below) with `object-cover`, because the current images range from
portrait (Bradwell Music, 640×800) to wide (Number Recognition, 1170×425). Add
an optional `image.position` for `object-position` where a crop lands badly.

**Motion.** The incoming project fades in from a 12px offset in the direction
of travel (next arrives from the right), using the reveal timings in
`src/lib/motion.ts`. The outgoing project fades without moving. With
`useReducedMotion()`, the swap is instant.

**Screen readers.** The WAI-ARIA carousel pattern, minus rotation controls:

- stage wrapper: `role="region"`, `aria-roledescription="carousel"`,
  `aria-label="Featured projects"`;
- each project: `role="group"`, `aria-roledescription="slide"`,
  `aria-label="2 of 3: Number Recognition"`;
- a polite live region announces the new project after an arrow press. Nothing
  is announced on first load.

**Without JavaScript.** The page is a static export and the stage is a client
island. The server HTML shows the first stage project with arrows hidden. Every
project, staged or not, is still reachable because the index lists all of them
with repository links. No content depends on the stage.

### Gestures

No swipe on the stage in this version. `src/components/system/station-swipe.tsx`
already turns a horizontal drag anywhere on the page into travel between
stations, and a second horizontal gesture inside the page would fight it. The
arrows are the control.

If stage swipe is wanted later, add a `[data-swipe-ignore]` check beside the
existing `[role="dialog"]` check in `station-swipe.tsx`, put the attribute on
the stage, and document it in `components.md`.

### Grouped index

One section per group, in `PROJECT_GROUPS` order, using the existing `Section`
component so headings get permalinks and `scroll-mt-24`.

- Heading: group `label`, with `period` beside it in `META`.
- Rows, newest first: year, name, summary, repository link. Text rows in the
  style of option B rather than tiles, so projects without images look complete.
- Every project in the group is listed, including those on the stage. A staged
  row shows a small "On stage" marker and its name links to `#<slug>`, which
  brings it onto the stage. Listing staged projects twice is deliberate: the
  index is the one complete list, and it is what no-JS readers and crawlers
  rely on.
- An empty group is not rendered. Adding the group to `PROJECT_GROUPS` before
  its first project lands is safe.

### Components

| File                                       | Kind   | Owns                                                            |
| ------------------------------------------ | ------ | --------------------------------------------------------------- |
| `src/components/sections/ProjectStage.tsx` | client | Stage, arrows, counter, keyboard, hash sync, live region        |
| `src/components/sections/ProjectIndex.tsx` | server | Group sections and rows                                         |
| `src/app/projects/page.tsx`                | server | Hero, then `ProjectStage`, then `ProjectIndex`. No layout maths |

The stage takes `projects: readonly Project[]` and knows nothing about groups
beyond reading `project.group` for the eyebrow, so choice 2 is the same component
rendered once per group.

### Derived surfaces to update

- `src/lib/schema.ts`: the projects `ItemList` should follow group order, then
  year, instead of array order.
- `src/app/llms.txt/route.ts`: list projects under their group headings.
- `src/app/projects/page.tsx` metadata: the description says "Five projects".
  Make it count-free.
- Hero copy on `/projects`: it frames the whole page as pre-industry archives,
  which stops being true once modern work lands. See open questions.
- The page comment ("Five projects, five cells, no empty tiles") goes away with
  the grid.

### Docs to update

- `docs/content.md`: `group`, `story`, `PROJECT_GROUPS`, `STAGE`.
- `docs/components.md`: `ProjectStage`, `ProjectIndex`.
- `docs/playbooks.md`, "Add a project": add the group step and the optional
  stage step. Remove "Do not invent a sixth project to balance a grid. The
  project page layout is authored for the existing five", which no longer
  applies.
- `docs/routes.md`: `/projects` sections.

### Verification

- `pnpm verify` and `pnpm build`.
- `node scripts/check-contrast.mjs` only if a new colour token is added. None is
  expected.
- By hand, in both themes via the theme control:
  - arrows by mouse, by keyboard (Tab to a button, then Left and Right);
  - VoiceOver announces "2 of 3" and the project name after an arrow press;
  - reduced motion swaps instantly;
  - `/projects/#hand-tracker` opens on Hand Tracker;
  - nothing below the stage moves when switching projects;
  - 400px width: no horizontal scroll, arrows are 44px;
  - JavaScript disabled: first project shows, index lists everything;
  - a horizontal swipe on the stage on a phone still travels between stations,
    as it does everywhere else.

## Open questions

1. **Layout choice.** 1 (recommended), 2, 3 or 4?
2. **What goes on the stage today?** Proposed: Bradwell Music, Number
   Recognition, Hand Tracker. These are the three with the strongest images.
3. **Group names.** `Modern work` and `University work` as written, or something
   like `Recent` and `Undergraduate`? The ids stay `modern-work` and
   `university-work` either way.
4. **Wrap or stop** at the ends of the stage?
5. **Story copy.** The stage has room for a longer "why I built it" paragraph.
   Write `story` for each stage project, or fall back to `detail` for now?
6. **Bradwell Music live link.** The stage reads best with a primary action
   ("Listen"). Is there a public URL to put in `live`?
7. **Hero copy.** Keep the archive joke until modern work lands, or rewrite now
   to cover both groups?
