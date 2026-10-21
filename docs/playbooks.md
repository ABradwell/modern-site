# Playbooks

Recipes for the changes an agent is most likely to make. Each one names the
files and the checks that catch the common mistakes.

## Edit copy or content data

1. Find the owning module in `src/content/` using [`content.md`](content.md).
2. Edit the value in place. Keep ids, dates and structures stable.
3. Run `pnpm typecheck`.
4. If the change affects a page, run `pnpm build` and inspect the relevant
   `out/` HTML if the wording or markup matters.
5. If the change affects roles, skills or projects, check the derived surfaces:
   Experience, CV, JSON-LD and `llms.txt`.

Do not duplicate a datum into a page file if it already exists in content.

## Add a project

1. Add a `Project` object to `PROJECTS` in `src/content/projects.ts`.
2. Give it a unique `slug`, honest `year`, short `summary`, card `detail`,
   `stack` ids, optional links/credit, and `featured` as appropriate.
3. If it has an image, place it under `public/images/projects/` and include
   `src`, `alt`, `width` and `height`.
4. If `featured: true`, confirm the home page's featured grid still reads well
   with the new count. The home layout expects `FEATURED_PROJECTS`, not all
   projects.
5. Run `pnpm typecheck` and `pnpm build`.
6. Check `out/projects/index.html` and the JSON-LD `ItemList` in
   `src/lib/schema.ts` — the list is derived from `PROJECTS`.

Do not invent a sixth project to balance a grid. The project page layout is
authored for the existing five and uses explicit column spans.

## Add or edit a skill

1. Add a `Skill` to `SKILLS` in `src/content/skills.ts`:
   - unique `id`;
   - display `name`;
   - `category`;
   - `tier: 1` for the wall or `tier: 2` for "Also worked with";
   - `icon: null` unless a lawful Simple Icons mark exists.
2. If `icon` is non-null, add the same id to `BRAND_MARKS` in
   `src/components/brand/registry.ts`, importing the matching component from
   `@icons-pack/react-simple-icons`.
3. Reference the id in role/project `stack` arrays where relevant.
4. Run `pnpm typecheck`; the registry is a `Record<IconSkillId, …>` so a missing
   mark fails.
5. Run `pnpm build` and check the Experience wall and the JSON-LD `knowsAbout`.

Rules:

- Do not add a fabricated AWS/Microsoft/Google mark. `icon: null` is correct.
- Do not use brand colours. Marks inherit `currentColor` / `--logo-ink`.
- Use `opticalScale` only for a mark that visually sits wrong in the 16px box.
- A stack id that has no matching skill is not a compile error; it renders as
  the raw id. Verify ids by eye or add a lookup assertion if this becomes a
  recurring problem.

## Edit a role or the CV

1. Edit `ROLES` in `src/content/experience.ts`.
2. Decide which view(s) the content belongs to:
   - `deliveries` — Experience page programmes;
   - `responsibilities` — CV areas;
   - `highlights` — short placements;
   - `progression` — title changes within one employer.
3. Do not give one role both `highlights` and `deliveries`.
4. Keep `end: null` for the current role.
5. Keep progression oldest to newest; the CV derives newest-first steps.
6. Run `pnpm typecheck` and `pnpm build`.
7. Inspect both `/skills` and `/cv`, plus `llms.txt`.

Do not split a promotion into sibling role cards. One employer stays one card;
the arc lives inside it.

## Add a station

A station is a route in the journey. This touches the navigation, landscape,
sitemap, export gate and machine-readable surfaces.

1. **Choose the position.** Insert the station in
   `src/content/stations.ts` at the correct west-to-east index. The order is
   geography, not alphabetical.
2. **Choose a biome.** Reuse an existing `BiomeKey` or add a new biome (below).
3. **Create the page** at `src/app/<route>/page.tsx`:
   - import `StationHero`, `StationContent`, `Section`, `ScrollCue`;
   - one `<h1 id="station-title">`;
   - metadata with a unique title, description, `alternates.canonical` and
     `openGraph.url`;
   - a page-level `JsonLd` graph if the route should be indexed;
   - `ScrollCue` to its first section.
4. **Update the plain-Node route list** in `scripts/lib/stations.mjs`.
5. **Update the sitemap** only if the new route should be indexed. It derives
   automatically from `STATIONS`, so a station needs no edit to `sitemap.ts`.
6. **Update schema**, if indexed: add a page graph and breadcrumb to
   `src/lib/schema.ts` and render it on the page.
7. **Update `llms.txt`**, if the page has content not already covered by a
   section. The station list is automatic; the content sections are hand-built.
8. **Update docs and README** route tables.
9. **Run** `pnpm verify`, `pnpm terrain` if terrain changed, and `pnpm build`.
10. Check:
    - the nav has equal-width stations and the marker lands correctly;
    - the footer lists the new station;
    - mobile nav lists it;
    - a swipe in both directions lands on it;
    - the landscape at rest shows only its biome;
    - `/sitemap.xml` contains the trailing-slashed URL;
    - `out/<route>/index.html` exists.

Adding a station changes the strip width (`STATIONS.length * 116`). `panTarget`
and the strip width derive from the list, so no component needs a hardcoded
count. Recheck the felt pan speed if the station count changes a lot.

### Adding a new biome for a station

1. Add a `BIOMES` entry in `scripts/lib/terrain-config.mjs` with four layers
   (unless reusing a shape), a `nearCrest`, and the required grammar options.
2. Run `pnpm terrain`.
3. Review `.terrain-preview/` if needed and the generated diff.
4. Reference the new `BiomeKey` in `STATIONS`.
5. Check `Landscape` and `LandscapeStatic` render it in both themes.

`foothills` already exists generated and unreferenced; prefer reusing it over
creating a near-duplicate.

## Remove a station

1. Remove the entry from `STATIONS`.
2. Remove the matching route string from `scripts/lib/stations.mjs`.
3. Delete or repurpose the page directory.
4. Remove/adjust its schema graph and any `llms.txt` section.
5. Update README and docs tables.
6. Check all links to the old route. `/experience` is the precedent: after the
   merge, `/skills` carries the content and the old route is gone; no redirect is
   generated by static export unless the host provides one.
7. Run `pnpm build` and check the strip still has the expected number of slots.

If the route must keep resolving, add an explicit off-trail page or a host
redirect. Do not leave a station entry with no page: the export gate will fail.

## Add an off-trail page

1. Create `src/app/<route>/page.tsx`.
2. Give it a title, description, canonical and `openGraph.url`.
3. Do not add it to `STATIONS` unless it should be part of the journey.
4. Add it to `required` in `scripts/verify-export.mjs` if a missing output would
   otherwise be silent.
5. Decide whether it should appear in `sitemap.xml`; the current sitemap is
   station-only.
6. Link it from a page, the footer, or `llms.txt`.
7. Run `pnpm build`.

Off-trail pages resolve to the forest in `stationIndex()`, which means the header
has no current station and the landscape shows the forest. That is acceptable
for `/cv`; if an off-trail page needs a different biome, pass an explicit
pathname to `LandscapeStatic` or add a station—do not special-case the header.

## Change the palette

1. Edit the raw and semantic values in `src/app/globals.css`:
   - `:root` raw ramp;
   - light semantic block;
   - dark semantic block;
   - the `@media (prefers-color-scheme: dark)` system block (it duplicates the
     dark values);
   - `@theme inline` only if a new semantic token is introduced.
2. Keep body text on measured pairs. Never use `#656d4a` or `#a68a64` as text.
3. Mirror changed foreground/background values in
   `scripts/check-contrast.mjs`. It is a transcription, not a live parser.
4. Run `node scripts/check-contrast.mjs`.
5. Run `pnpm build` and check both themes with the theme control and with the OS
   setting. Check the terrain ramp still recedes in both.
6. Check `--logo-ink` against its background and every `BrandMark`.

The raw palette has a chroma ceiling of `0.070`. Do not introduce a saturated
accent; the existing warm red is the deliberate exception.

## Change terrain

1. Edit `scripts/lib/terrain-config.mjs` (camera, bands, biome layers/river) or
   `scripts/lib/terrain-grammars.mjs` (shape generation).
2. Run `pnpm terrain`.
3. Review the generated diff and, if needed, `pnpm terrain -- --preview` in
   `.terrain-preview/`.
4. Confirm:
   - the generator's validation passes;
   - row ground lines recede;
   - the near row stays within `CAMERA.nearBase`;
   - conifer element aspect is near `2.4`;
   - tile repeat count stays below the cap;
   - the river sits between depth 2 and content.
5. Run `pnpm build`.
6. If you changed the camera or body height, re-check the page content offset:
   `BODY_DVH`, `nearBase` and `CONTENT_OFFSET_DVH` are a three-way constraint.
7. Commit the generated file with the config/grammar change.

Never hand-edit `src/content/terrain.generated.ts`. If you need a one-off visual
experiment, use `--preview` rather than committing a hand-tweaked path.

## Change motion

1. Reveal timing/offset/stagger: `src/lib/motion.ts` and
   `src/components/system/reveal.tsx`.
2. Pan spring: `PAN_SPRING` in `src/lib/motion.ts`; also read the comments about
   damping and station span.
3. Vertical depth: `SPEED` in `src/lib/motion.ts`; keep content at `1.0`, depth 1
   above it, and terrain 2-4 below it.
4. Geometry: `src/lib/station-geometry.ts`.
5. Hero fade: `StationHero`.
6. Add reduced-motion handling for any new motion.
7. Check desktop, touch, keyboard and reduced-motion settings. Do not add
   per-depth horizontal parallax; that decision is recorded in the source and in
   [`landscape.md`](landscape.md).

## Change metadata or structured data

1. Page titles/descriptions/canonicals: the page's `metadata` export.
2. Global defaults: `src/app/layout.tsx`.
3. JSON-LD: `src/lib/schema.ts`; render the relevant graph from the page with
   `JsonLd`.
4. Sitemap: `src/app/sitemap.ts` (station-derived).
5. Robots policy: `src/app/robots.ts`.
6. Manifest: `src/app/manifest.ts`.
7. LLM digest: `src/app/llms.txt/route.ts`.
8. Social card: `node scripts/generate-og.mjs`, then commit the PNG.
9. Run `pnpm build`. Inspect `out/`, the meta tags in `out/index.html`, and the
   JSON-LD script tags.

Never put a canonical or `openGraph.url` in the root layout. See
[`architecture.md`](architecture.md#content-and-metadata-flow).

## Change the CSP or security headers

1. Update `SHARED` in `src/lib/csp.ts` for directives that can live in meta.
2. Update the literal policy in `public/_headers` (Cloudflare).
3. Update the literal policy in `vercel.json` (Vercel).
4. Do not add `frame-ancestors`, `report-uri` or `sandbox` to the meta policy;
   browsers ignore them and the build gate rejects `frame-ancestors` in meta.
5. Run `pnpm build`. The export gate compares all three copies and checks the
   meta is in `<head>`.

## Release

1. `pnpm verify`.
2. `node scripts/check-contrast.mjs` if colour changed.
3. `pnpm terrain` and commit if terrain inputs changed.
4. `pnpm build`.
5. Review the diff and generated files.
6. Commit as the owner; push to a branch.
7. Open a PR. CI must pass `verify` and `identity`.
8. Merge to `main`; DigitalOcean deploys on push.
9. Check the apex, `www`, a station URL and a bad URL in production.

## Debug a visual regression

1. Reproduce with `pnpm dev` and, separately, `pnpm build && pnpm preview`. The
   static export can differ from dev because of trailing slashes and missing
   assets.
2. Check the z-index scale first. A missing `Z` token or an arbitrary `z-*` is
   the most common cause of something disappearing behind the landscape.
3. Check whether the element is inside a transformed ancestor. A transform
   creates a containing block for fixed children and a new stacking context.
4. Check `pointer-events-none` on both landscape bands. If a link in the top
   strip is dead, this is usually why.
5. Check the scene units. A `dvh` value mixed into a `--vu` composition will
   drift on mobile rotation.
6. Toggle both themes and reduced motion.
7. Check the content offset against the near terrain cap:
   `nearBase + BODY_DVH` must clear `CONTENT_OFFSET_DVH`.
8. Run the export gate; a broken route or asset often presents as a visual
   failure on only one page.
