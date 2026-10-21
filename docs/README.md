# aidenbradwell.com: agent documentation

This folder is the working manual for the repository. The root
[`README.md`](../README.md) explains the design rationale and deployment history;
this folder records how the site is actually put together, what is safe to
change, and what will break if a nearby assumption is missed.

Read this page first, then the document that matches the task.

## What this repository is

A static personal portfolio for Aiden Stevenson Bradwell, built as a single
landscape read west to east. Four routes are stations on that landscape. A fifth
page, `/cv`, is deliberately off the trail. Every page is exported as static
HTML; there is no server, database, CMS, authentication or runtime API.

| Item               | Current value                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js `16.3.2`, App Router, React `19.2.8`                                                            |
| Rendering          | `output: 'export'`, static HTML in `out/`                                                               |
| Styling            | Tailwind CSS v4 with custom properties in `src/app/globals.css`                                         |
| Motion             | Motion (`motion/react`) client islands                                                                  |
| UI primitives      | Radix UI via the local shadcn-style files in `src/components/ui`                                        |
| Package manager    | pnpm `10.32.1`                                                                                          |
| Node               | `>=20.9.0`; CI uses Node 22                                                                             |
| Primary deployment | DigitalOcean App Platform, declared in `.do/app.yaml`                                                   |
| Tests              | None; verification is typecheck, lint, format, contrast, terrain determinism, build and the export gate |

## Current route shape

| Route       | Nav label  | Biome                       | Role                                          |
| ----------- | ---------- | --------------------------- | --------------------------------------------- |
| `/`         | Home       | forest                      | Landing page and contact                      |
| `/skills`   | Experience | plains                      | Roles, competencies and education in one page |
| `/projects` | Projects   | mountains                   | Five project cards                            |
| `/articles` | Writing    | above cloud line            | Two externally published pieces               |
| `/cv`       | none       | forest (off-trail fallback) | CV as HTML; not a station                     |

`/experience` no longer exists. It was merged into `/skills`. The `foothills`
terrain biome remains generated but is not referenced by any station; see
[`landscape.md`](landscape.md#biomes-and-the-unused-foothills).

The generated 404 is also a real page in the export. Unknown paths resolve to the
forest station visually, while the 404 document offers the trail as links.

## Quick start

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm typecheck                 # tsc --noEmit
pnpm lint                      # eslint .
pnpm format:check              # prettier --check .
pnpm verify                    # typecheck + lint + format check
pnpm build                     # next build, then scripts/verify-export.mjs
pnpm preview                   # build, then serve out/
pnpm terrain                   # regenerate src/content/terrain.generated.ts
pnpm terrain -- --preview      # also write .terrain-preview/
node scripts/check-contrast.mjs
```

`pnpm build` is the meaningful local gate. A development server can look
perfectly healthy while the static export is missing the 404, the CV directory
index, `llms.txt`, the PDF or the social card.

## Documentation map

| Document                               | Use it when                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`architecture.md`](architecture.md)   | You need the runtime shape, rendering model, data flow or dependency boundaries                  |
| [`routes.md`](routes.md)               | You are adding, removing or changing a page, its metadata, its sections or its station behaviour |
| [`landscape.md`](landscape.md)         | You are touching the terrain, pan, parallax, scene units or generated silhouettes                |
| [`design-system.md`](design-system.md) | You are changing colour, type, spacing, radii, z-index, motion or accessibility defaults         |
| [`content.md`](content.md)             | You are editing copy, roles, projects, skills, dates or structured data                          |
| [`components.md`](components.md)       | You need to know what a component owns before changing or reusing it                             |
| [`operations.md`](operations.md)       | You are running checks, working with hooks, debugging the export or deploying                    |
| [`playbooks.md`](playbooks.md)         | You want a step-by-step recipe for a common change                                               |
| [`reference.md`](reference.md)         | You need constants, file locations, terminology or the decision log                              |

## Invariants

These are load-bearing. Several are enforced by the compiler, the build gate or
CI; the rest are enforced by review.

1. **The landscape is mounted in the root layout, never in a page.** App Router
   preserves layout state across navigation. Moving the scene into a page turns
   continuous travel into a remount and a flicker on every route change.
2. **`STATIONS` is the route geography.** Its order controls the nav, sitemap,
   pan targets and `llms.txt` page list. The plain-Node copy in
   `scripts/lib/stations.mjs` must be updated by hand at the same time.
3. **Station geometry has one owner.** `src/lib/station-geometry.ts` defines the
   gutter, span, slot, strip and target maths for both the landscape and the
   swipe gesture. Do not duplicate those calculations in a component.
4. **One horizontal spring.** Every depth band pans at the same rate from the
   same spring. Per-depth horizontal parallax was explicitly rejected; depth is
   expressed vertically.
5. **The content offset and the near terrain are a pair.** `BODY_DVH = 24` in
   `src/components/landscape/terrain-mask.ts`, the depth-1 ground line cap of
   `106`, and `CONTENT_OFFSET_DVH = 20` put content at an absolute `120` scene
   units. Changing one without the others puts terrain over headings.
6. **Use scene units for the composition.** Terrain, hero, haze, orb and content
   offset read from `--vu` (`1%` of `--scene`), not from `dvh` or `h-screen`.
   `--scene` has a `48rem` floor for short landscape viewports.
7. **z-index comes from `src/lib/z.ts`.** There is one global scale and a separate
   local scene scale. Do not add arbitrary `z-50` classes.
8. **Canonicals and `openGraph.url` are per page.** They must not be declared in
   the root layout. Metadata merges down the route tree, so a layout-level
   canonical tells crawlers every station is a duplicate of the homepage.
9. **Content is typed and derived surfaces read it directly.** Do not hand-edit
   `src/content/terrain.generated.ts`; edit `scripts/lib/terrain-config.mjs` or
   `scripts/lib/terrain-grammars.mjs` and run `pnpm terrain`.
10. **`trailingSlash: true` is required by the deployment target.** The export
    must contain directory-index pages such as `out/skills/index.html`.
    `scripts/verify-export.mjs` fails the build otherwise.
11. **The CSP has three copies.** `src/lib/csp.ts` (meta), `public/_headers`
    (Cloudflare) and `vercel.json` (Vercel) must agree. The build gate compares
    them semantically.
12. **Commits are authored by the owner and scanned for secrets.** The identity
    guard and gitleaks hook fail closed. See [`operations.md`](operations.md).

## Working agreement for agents

1. Read the relevant document before editing. The source comments are detailed
   and usually explain _why_ a shape exists; treat a change that ignores them as
   suspect until you have checked the constraint they describe.
2. Prefer the smallest change that satisfies the request. Do not reformat
   unrelated files. Do not "clean up" generated terrain, the shadcn primitives or
   the historical plan unless the task explicitly asks for it.
3. Keep content in `src/content`. Page files should remain presentation.
4. If you add a skill, project, route or token, follow the matching playbook and
   update every derived surface.
5. Run `pnpm verify`, `node scripts/check-contrast.mjs` when colour changes,
   `pnpm terrain` when terrain inputs change, and `pnpm build` when anything
   about routing, metadata, assets or the export changes.
6. Review the diff for accidental generated files, build output, `.next/`,
   `.terrain-preview/` or secrets before committing.
7. Commit with `Aiden Stevenson Bradwell <Aidenbradwell@gmail.com>`. The hooks
   enforce this, but check `git log -1 --format='%an <%ae>'` anyway.

## Known drift

These are stale claims in the repository, not instructions. They are recorded so
an agent does not "fix" working code to match an old comment. This documentation
PR intentionally changes no source; correct these opportunistically when the
surrounding file is next edited.

| Location                                                                                  | It says                                                    | Current implementation                                                                                                        |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `README.md`, landscape section                                                            | The foreground body is `12dvh` and ends by `118dvh`        | `BODY_DVH = 24` in `src/components/landscape/terrain-mask.ts`; the depth-1 body starts at ground line `106` and reaches `130` |
| `README.md`, colour section                                                               | `scripts/check-contrast.mjs` asserts `26` shipped pairs    | The `PAIRS` array has `25` entries, plus two terrain-ramp checks and one dark-near-layer check                                |
| `README.md`, landscape section                                                            | "All three fixed bands" are `pointer-events: none`         | There are two fixed landscape bands: `Z.landscapeFar` and `Z.landscapeNear`                                                   |
| `README.md`, content section; `src/content/types.ts` `Skill.icon` comment                 | The technology wall runs two visual registers              | `BrandMark` renders one bordered pill for every skill, with an optional mark prefix                                           |
| `README.md`, content section; `src/content/types.ts` and `src/content/skills.ts` comments | A typo in `Role.stack` or `Project.stack` is a build error | Both fields are `readonly string[]`; the UI falls back to the raw id when lookup fails                                        |
| `README.md`, opening line                                                                 | "Four pages"                                               | Four stations plus `/cv` and the generated 404; "four pages" is accurate only if it means stations                            |
| `src/app/not-found.tsx` header comment                                                    | `trailingSlash` stays at its default                       | `next.config.ts` sets `trailingSlash: true`; Next 16 emits both `out/404.html` and `out/404/index.html`                       |
| `src/components/layout/StationHero.tsx` comment                                           | The foreground band is capped at `118`                     | The near band reaches `130` scene units; content begins at `120`                                                              |
| `src/app/skills/page.tsx` page comment                                                    | Roles are first, then competencies                         | Rendered order is Core competencies, Roles (with Previous employment), Also worked with, Education                            |
| `package.json` description                                                                | "A five-stage landscape portfolio"                         | Four stations and one off-trail CV page                                                                                       |
| `plans/001-core-design.md`                                                                | Five stages, `/experience`, and `trailingSlash: false`     | Historical pre-build plan; superseded by the current four-station implementation                                              |

### Documentation maintenance

- State current behaviour, not the original plan.
- Use file paths and symbol names rather than line numbers; line numbers drift.
- If a detail is enforced by code, name the enforcing file.
- If you discover drift, add it to this table rather than quietly relying on the
  stale claim. When the source is fixed, remove the row.
