# Content

All site content is TypeScript in `src/content/`. There is no CMS, database,
Markdown collection or content API. Pages are presentation over these modules,
and the metadata routes read the same values.

## Files

| File                               | Exports                                                                        | Used by                                             |
| ---------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `src/content/site.ts`              | `SITE`, `HERO_SUBTEXT`, `ABOUT`, `CV_PDF`, `CV_INTRO`                          | Layout, home, CV, JSON-LD, `llms.txt`               |
| `src/content/stations.ts`          | `STATIONS`, `EXTERNAL_LINKS`, `stationIndex()`, `stationFor()`                 | Nav, pan, sitemap, `llms.txt`, landscape            |
| `src/content/experience.ts`        | `ROLES`, `MINOR_ROLES`, `EDUCATION`, `CREDENTIALS`                             | Experience, CV, JSON-LD, `llms.txt`                 |
| `src/content/skills.ts`            | `SKILLS`, `SkillId`, `IconSkillId`, `SKILL_BY_ID`, `WALL_GROUPS`, `skillsIn()` | Experience, projects, registry, JSON-LD, `llms.txt` |
| `src/content/projects.ts`          | `PROJECTS`, `FEATURED_PROJECTS`, `PROJECT_GROUPS`, `PROJECT_SHELVES`           | Projects, home, JSON-LD, `llms.txt`                 |
| `src/content/articles.ts`          | `ARTICLES`, `ARTICLES_NOTE`                                                    | Writing, JSON-LD, `llms.txt`                        |
| `src/content/types.ts`             | All content interfaces and types                                               | Every content module                                |
| `src/content/terrain.generated.ts` | `TERRAIN`, `BiomeKey`, `HORIZON_DVH`, terrain interfaces                       | Landscape, static landscape                         |

`terrain.generated.ts` is generated. Never edit it by hand. See
[`landscape.md`](landscape.md#generation-and-validation).

## Site configuration

`SITE` is the canonical identity used by metadata, the header, footer, contact
rows, PDF links and structured data:

```ts
{
  ;(name,
    shortName,
    title,
    company,
    location,
    url,
    description,
    email,
    phone,
    github,
    linkedin,
    contactLabel)
}
```

Rules:

- `company` is always lowercase. It is house style, not a typo.
- `url` is the apex, `https://aidenbradwell.com`. Canonicals, sitemap and robots
  all derive from it.
- `contactLabel` is shared by the nav, hero, footer and section heading. Do not
  introduce a second wording for the same destination.
- `phone` is `null` on purpose. A plausible-looking placeholder is somebody
  else's real number. The contact section renders a phone row only when it is
  set. Fill both `e164` and `display` to enable it.
- `CV_PDF` is `/aiden-stevenson-bradwell-cv.pdf`, a real file in `public/`. The
  Experience hero, CV page and export gate all use this constant.

`CV_INTRO` is intentionally not `ABOUT[0]`. The homepage copy addresses a
visitor; the CV intro addresses someone already holding a CV.

## Stations

`STATIONS` is both navigation and geography. Each entry is:

```ts
{
  href: string // route, no trailing slash in source
  label: string // full nav label
  short: string // marker label
  biome: BiomeKey
}
```

The array order is west to east. Reordering it reorders the world. `EXTERNAL_LINKS`
is separate and currently contains only the external music site; it is not a
station and never receives the trail marker.

`stationIndex(pathname)`:

1. exact match;
2. nested match under a station path;
3. forest (`0`) for anything else, including `/cv` and 404s.

This fallback is deliberate: an unknown path should land somewhere recognisable.

## Skills

`SKILLS` is declared with `as const satisfies readonly Skill[]`, which preserves
each literal `id`. `SkillId` is the union of those ids. `IconSkillId` is the
subset whose `icon` is non-null.

```ts
{
  id: string
  name: string
  icon: string | null
  category: 'languages' | 'cloud' | 'data' | 'infrastructure' | 'frameworks' | 'practice'
  tier: 1 | 2
  opticalScale?: number
}
```

- `tier: 1` appears as a pill on the Experience competencies wall.
- `tier: 2` appears in "Also worked with" as plain text.
- `WALL_GROUPS` controls the order and labels of the wall. `cloud` is labelled
  `AWS` in the UI.
- `SKILL_BY_ID` resolves ids to names for role and project stacks.
- A non-null `icon` must have a matching entry in
  `src/components/brand/registry.ts`; that file is typed
  `Record<IconSkillId, BrandIcon>`, so a missing mark is a compile error.
- `icon: null` is a real choice. AWS, Microsoft and Google marks were removed
  from Simple Icons on trademark request; do not draw or import a replacement.
- `opticalScale` is only for per-mark visual correction inside the one-pill
  treatment. It is not a size system.

The "brand registry covers every icon-backed skill" guard is enforced. The older
claim that a typo in `Role.stack` or `Project.stack` is a compile error is not:
both fields are typed `readonly string[]`, and the UI falls back to the raw id
when lookup fails. Treat stack ids as a content convention and verify them when
editing.

## Roles and the Experience page

The `Role` model supports three different views of one tenure:

| Field              | Page       | Shape                                                                        |
| ------------------ | ---------- | ---------------------------------------------------------------------------- |
| `summary`          | Both       | One paragraph                                                                |
| `progression`      | Experience | Milestones oldest to newest, with month and title                            |
| `deliveries`       | Experience | Named programmes, each with a unique `discipline`, summary, detail and tools |
| `responsibilities` | CV         | Areas of accountability, each with short items                               |
| `highlights`       | Experience | Three-or-so bullets for short placements                                     |
| `stack`            | Both       | Skill ids, rendered as tags/names                                            |

Rules:

- A role carries `highlights` or `deliveries`, never both. A short placement gets
  bullets; a long tenure gets programmes.
- `responsibilities` is additional to `deliveries`, not a replacement. It is the
  CV's cut of the same work.
- `progression` only belongs on a role whose title actually changed. Do not give
  a two-month placement a one-node timeline.
- Order in `ROLES` is authored. The current order puts the current role first and
  is not simply reverse-chronological by start date.
- `deliveries[].tools` are display names, not skill ids. They are specific
  tooling that should not pollute the core competency wall.
- `stack` values are skill ids and are resolved through `SKILL_BY_ID`.

`MINOR_ROLES` is the compact "Previous employment" list inside the Roles
section. `EDUCATION` is the degree and honours block. `CREDENTIALS` is the
eligibility text rendered beside it and in `llms.txt`.

## Projects

```ts
{
  slug, name, year,
  group: 'modern-work' | 'university-work',
  summary, detail,
  stack: string[],
  repo?, live?,
  image?: { src, alt, width, height },
  credit?,
  featured: boolean
}
```

- `group` places the project on a tab of `/projects`. Groups and their tab order
  are `PROJECT_GROUPS`. A group with no projects is not rendered.
- `STAGE` is the ordered list of slugs shown large on each group's stage. Order
  is arrow order. An unknown slug throws during the build.
- `PROJECT_SHELVES` joins the two: per group, its stage projects and all its
  projects newest first. The projects page, JSON-LD and `llms.txt` read it.
- `summary` is the index line and stage lede; `detail` is the stage paragraph.
- `FEATURED_PROJECTS` drives the home page and is independent of `STAGE`.
- `image` must include `width` and `height` because images are unoptimized under
  static export. Use `public/images/projects/…`.
- `credit` is preserved attribution where a project leans on someone else's
  model, tutorial or library. It stays on the stage, not in a footnote.
- `repo` and `live` are optional external links. If both are absent, the
  project simply has no link row.
- Dates are honest. University work keeps its year.

## Articles

`ARTICLES` are externally published opinion pieces. Each has a `slug`, title,
summary, external `href`, `venue` and `year`. There are no local article pages.
`ARTICLES_NOTE` is the "What is coming" copy.

Do not turn these into a publication record. The comments in the module explain
why older coursework PDFs are deliberately absent.

## Dates

All authored dates use ISO `YYYY-MM`. A current role has `end: null`. The sentinel
`PRESENT` exists for internal formatting but content should use `null` for a role
that is still held.

`src/lib/dates.ts` provides:

- `formatMonth('2023-07')` -> `Jul 2023`
- `range(start, end)` -> `Jul 2023 - present`
- `monthsSince()` / `formatSpan()` for progression durations

Do not hand-format dates in a page. One helper keeps the Experience, CV and
`llms.txt` output consistent.

## Derived surfaces

When content changes, these update automatically:

| Surface            | Derivation                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| Experience page    | `ROLES`, `SKILLS`, `EDUCATION`, `CREDENTIALS`                                |
| CV page            | `ROLES.responsibilities`, `EDUCATION`, `CREDENTIALS`                         |
| Projects page      | `PROJECT_SHELVES`                                                            |
| Writing page       | `ARTICLES`                                                                   |
| Home featured work | `FEATURED_PROJECTS`                                                          |
| JSON-LD            | `siteGraph`, `homeGraph`, `experienceGraph`, `projectsGraph`, `writingGraph` |
| `sitemap.xml`      | `STATIONS`                                                                   |
| `llms.txt`         | all content modules plus `STATIONS`                                          |

Surfaces that do **not** update automatically:

- the nav and footer (from `STATIONS`, so a station does; an off-trail page does
  not);
- the export gate's explicit off-trail list (`/cv`, the PDF);
- README tables and these docs;
- `/cv` if it is not linked from a page or `llms.txt`.

## Editing conventions

1. Read the surrounding content module first; most fields have a comment
   explaining what they are for and what not to do.
2. Keep ids stable. Changing an id breaks role/project stacks and the brand
   registry.
3. Add a skill before referencing it in a stack. Add the brand mark if it has an
   icon.
4. Keep prose in the owner's voice. Do not add corporate claims, invented
   metrics, unverified credentials or placeholder contact details.
5. External links open in a new tab only where the existing pattern does; use
   `rel="noreferrer"` or `rel="noopener"` as appropriate.
6. If a datum appears in more than one view (Experience and CV), edit the shared
   module rather than each page.
7. Run `pnpm typecheck`, then `pnpm build` if the change affects a page that the
   export gate checks. Content mistakes usually surface as type errors or a
   visibly odd card, not as a failed build.
