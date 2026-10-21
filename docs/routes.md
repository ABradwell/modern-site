# Routes and pages

The site has four **stations** in the landscape plus one off-trail CV page and a
generated 404. A station is a route that participates in the travel model: it
appears in the nav, owns a biome, receives a pan target and is listed in the
sitemap. `/cv` deliberately does none of those things.

## Route inventory

| Route       | Source                      | Nav label  | Biome            | Canonical    | Main sections                                                |
| ----------- | --------------------------- | ---------- | ---------------- | ------------ | ------------------------------------------------------------ |
| `/`         | `src/app/page.tsx`          | Home       | forest           | `/`          | Hero, About, Get in touch, Core competencies                 |
| `/skills`   | `src/app/skills/page.tsx`   | Experience | plains           | `/skills/`   | Hero, Core competencies, Roles, Also worked with, Education  |
| `/projects` | `src/app/projects/page.tsx` | Projects   | mountains        | `/projects/` | Hero, Built                                                  |
| `/articles` | `src/app/articles/page.tsx` | Writing    | above cloud line | `/articles/` | Hero, Published, What is coming                              |
| `/cv`       | `src/app/cv/page.tsx`       | none       | forest fallback  | `/cv/`       | Hero, Introduction, Experience, Core competencies, Education |
| 404         | `src/app/not-found.tsx`     | none       | forest fallback  | none         | Static landscape, trail links                                |

The station order in `src/content/stations.ts` is the order of travel:

```ts
Home -> Experience -> Projects -> Writing
```

`/skills` is the URL, but **Experience** is the label everywhere a reader sees
it. Keep that distinction: links, metadata, JSON-LD and `llms.txt` use
"Experience", while routes and build assertions use `/skills`.

## Page details

### `/` — Home (forest)

The landing page is three layout families below the hero, intentionally not
repeated:

1. **About**: single measured column (65ch) plus a portrait.
2. **Get in touch**: two-column close with the contact routes.
3. **Core competencies**: tier-1 skills grouped by `WALL_GROUPS`, each as a
   `BrandMark` pill, from the shared `CoreCompetencies` component.

Order is deliberate. Contact comes before the competencies because the page's
job is to prompt contact; the competency wall is supporting evidence a reader
can go on to explore in full on the Experience page. The hero's primary button
goes to `/skills`, and its secondary button jumps to `#contact` rather than
opening a mail client.

Metadata: canonical `/`, `openGraph.url` is `SITE.url`. JSON-LD is
`homeGraph` (`ProfilePage` with `mainEntity` pointing at the site-wide Person).

### `/skills` — Experience (plains)

One page carries roles, competencies and education. It replaced the former
`/experience` and `/skills` split.

Rendered order in the current code:

1. **Core competencies**: tier-1 skills grouped by `WALL_GROUPS`, each skill as a
   `BrandMark` pill.
2. **Roles**: a multi-open Radix Accordion. The current zally role is open by
   default. Each panel can contain a progression rail, deliveries, highlights
   and the stack tags.
3. **Previous employment**: the `MINOR_ROLES` list inside the Roles section.
4. **Also worked with**: all tier-2 skills as a plain inline list, not pills.
5. **Education**: degrees and honours in one column, eligibility from
   `CREDENTIALS` in the other.

Metadata: title `Experience`, canonical `/skills/`. JSON-LD is
`experienceGraph` (`ProfilePage`, breadcrumb, and `hasOccupation` entries).

The hero links to `CV_PDF` in `public/`. The PDF is also linked from `/cv`.

### `/projects` — Projects (mountains)

A single section, **Built**, rendered by `ProjectShowcase` from
`PROJECT_SHELVES`. A tab per project group (Modern work, University work); each
tab has a stage that shows one project at a time with previous and next arrows,
then an index of every project in the group, newest first.

A stage project shows its image, year, name, `summary`, `detail`, `credit`,
stack names and links. Index rows show year, name, `summary` and links.

`/projects/#<slug>` opens the matching tab and stage project; `#modern-work` and
`#university-work` open a tab.

Metadata: title `Projects`, canonical `/projects/`. JSON-LD is `projectsGraph`
(`CollectionPage`, breadcrumb, `ItemList` of `SoftwareSourceCode`).

### `/articles` — Writing (above cloud line)

Two externally published opinion pieces in a numbered, hairline-divided list,
not cards. The page also carries a short "What is coming" note from
`ARTICLES_NOTE`.

The articles are hosted on LinkedIn, not on this site. The links open externally
and JSON-LD declares the LinkedIn URLs rather than inventing local pages.

Metadata: title `Writing`, canonical `/articles/`. JSON-LD is `writingGraph`
(`CollectionPage`, breadcrumb, `ItemList` of `Article`).

### `/cv` — off-trail CV

`/cv` renders the same tenure in a different register:

- one column, no disclosures, everything open;
- `responsibilities` by discipline rather than `deliveries` by programme;
- roles newest-first, unlike the Experience progression rail;
- links to the PDF and back to `/skills`.

It is not in `STATIONS`, so it does not appear in the header nav, trail marker,
sitemap or swipe order. `stationIndex('/cv')` falls through to the forest, which
also means the header has no current station. That is intentional.

The page has its own canonical `/cv/` and `openGraph.url`, but no page-level
JSON-LD; the site-wide Person and WebSite graph still comes from the layout.
`llms.txt` links to it manually.

### 404

`src/app/not-found.tsx` is a Server Component. It renders `LandscapeStatic` and
a short trail list, not the attempted URL, because a static 404 cannot read the
request path.

Under `output: 'export'` and `trailingSlash: true`, Next 16 writes both
`out/404.html` and `out/404/index.html`. `scripts/verify-export.mjs` requires the
flat `out/404.html`, which is the filename static hosts look for. The source
comment in `not-found.tsx` about `trailingSlash` being at its default is stale.

## Metadata and canonical rules

- Declare `alternates.canonical` in each page's `metadata`, never in the root
  layout.
- Declare `openGraph.url` per page for the same reason.
- Use the trailing-slash form for every station except `/`, because that is what
  the static host actually serves and what `sitemap.xml` submits.
- The root layout supplies `metadataBase`, title template, description, authors,
  Open Graph site metadata and Twitter card type.
- Do not add a root `robots` metadata field. Next injects `noindex` into the 404
  itself; a second directive would contradict it.

The title template is `%s · Aiden Bradwell`, so page titles read:

- default: `Aiden Stevenson Bradwell, Engineering Team Lead`
- `Experience · Aiden Bradwell`
- `Projects · Aiden Bradwell`
- `Writing · Aiden Bradwell`
- `CV · Aiden Bradwell`

## Static output paths

With `trailingSlash: true`:

| Public path             | File                                      |
| ----------------------- | ----------------------------------------- |
| `/`                     | `out/index.html`                          |
| `/skills/`              | `out/skills/index.html`                   |
| `/projects/`            | `out/projects/index.html`                 |
| `/articles/`            | `out/articles/index.html`                 |
| `/cv/`                  | `out/cv/index.html`                       |
| unmatched path          | `out/404.html` (and `out/404/index.html`) |
| `/sitemap.xml`          | `out/sitemap.xml`                         |
| `/robots.txt`           | `out/robots.txt`                          |
| `/manifest.webmanifest` | `out/manifest.webmanifest`                |
| `/llms.txt`             | `out/llms.txt`                            |

Do not add a flat `out/skills.html` expectation or a host rewrite to compensate
for a `trailingSlash` change. The deployment target does not resolve the flat
form, and the build gate exists to catch that.

## Adding or removing a station

A station affects more than a page. Use the full checklist in
[`playbooks.md`](playbooks.md#add-a-station), and account for:

1. `src/content/stations.ts` — order, label, short label, biome.
2. `scripts/lib/stations.mjs` — the plain-Node route list.
3. `src/app/<route>/page.tsx` — page, metadata and canonical.
4. `src/lib/schema.ts` — a page graph and breadcrumb if the route is indexed.
5. `src/app/llms.txt/route.ts` — the station list is automatic, but any new
   content section may need a new block.
6. `src/app/sitemap.ts` — automatic from `STATIONS`.
7. `scripts/verify-export.mjs` — automatic for stations; add an entry for an
   off-trail page.
8. `README.md` and these docs — update the route table.
9. `scripts/lib/terrain-config.mjs` — only if the station introduces a new biome.

Adding a station increases the strip width and therefore the felt travel
distance. `PAN_SPRING` was tuned after the gutter change; re-evaluate it if the
number of stations changes substantially.

## Adding an off-trail page

Use `/cv` as the pattern:

- create the page under `src/app/<route>/page.tsx`;
- give it a unique title, description, canonical and `openGraph.url`;
- do not add it to `STATIONS` unless it should be a station;
- decide explicitly whether it belongs in the sitemap (the current sitemap is
  station-only);
- add it to `scripts/verify-export.mjs` if its absence would be silent;
- link it from an existing page and/or `llms.txt`;
- if it needs a station's biome, pass the desired pathname to `LandscapeStatic`
  or rely on the documented forest fallback.
