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
2. Give it a unique `slug`, honest `year`, a `group`, short `summary`,
   `detail`, `stack` ids, optional links/credit, and `featured` as appropriate.
   `group` is required; a new group also needs an entry in `PROJECT_GROUPS` and
   its id added to `ProjectGroupId` in `src/content/types.ts`.
3. If it has an image, place it under `public/images/projects/` and include
   `src`, `alt`, `width` and `height`.
4. To put it on its group's stage, add the slug to `STAGE` in
   `src/content/projects.ts`. Position in that list is arrow order. A slug that
   matches no project throws during the build.
5. `featured` only affects `FEATURED_PROJECTS`, which no page currently mounts,
   and is independent of `STAGE`. If a featured grid is reintroduced, check
   that it reads well with the new count.
6. Run `pnpm typecheck` and `pnpm build`.
7. Check `out/projects/index.html`, `out/llms.txt` and the JSON-LD `ItemList`
   in `src/lib/schema.ts`. All three read `PROJECT_SHELVES`, so they follow
   group order, newest first within each group.

The projects page has no fixed slot count. Groups, stages and indexes all grow
with the content.

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
2. **Extend the route.** The panorama is generated for a strip exactly
   `STRIP_VW` wide, so the new window needs terrain (below).
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
9. **Run** `pnpm verify`, `pnpm terrain` and `pnpm build`.
10. Check:
    - the nav has equal-width stations and the marker lands correctly;
    - the footer lists the new station;
    - mobile nav lists it;
    - a swipe in both directions lands on it;
    - the landscape at rest shows one place, with the change of scene inside the
      gutters;
    - `/sitemap.xml` contains the trailing-slashed URL;
    - `out/<route>/index.html` exists.

Adding a station changes the strip width (`STATIONS.length * 116`). `panTarget`
and the strip width derive from the list, so no component needs a hardcoded
count. Recheck the felt pan speed if the station count changes a lot.

### Extending the route for a station

1. In `ROWS` in `scripts/lib/terrain-config.mjs`, extend or add regions in every
   depth so they cover the new window, `[116i, 116i + 100]` in strip viewport
   widths. Regions overlap on purpose: an edge is a change of density, not a
   seam. Let rows change at different places, so the near row changes first and
   the far rows follow.
2. Extend `WATER` if the river or lake should reach the new window.
3. Check that `SPAN_VW` in `terrain-config.mjs` still matches `SPAN_VW` in
   `src/lib/station-geometry.ts`. `STRIP_VW` derives from the station list in
   `scripts/lib/stations.mjs` on one side and `STATIONS` on the other.
4. Run `pnpm terrain -- --preview` and review
   `.terrain-preview/panorama.svg` and the laptop and phone window for every
   station, not only the new one.
5. Check `Landscape` and `LandscapeStatic` render the new window in both themes.
   `Landscape.tsx` throws if `PANORAMA.stripVw !== STRIP_VW`, which means
   `pnpm terrain` was not run after the station list changed.

## Remove a station

1. Remove the entry from `STATIONS`.
2. Remove the matching route string from `scripts/lib/stations.mjs`.
3. Delete or repurpose the page directory.
4. Remove/adjust its schema graph and any `llms.txt` section.
5. Update README and docs tables.
6. Check all links to the old route. `/experience` is the precedent: after the
   merge, `/skills` carries the content and the old route is gone; no redirect is
   generated by static export unless the host provides one.
7. Trim the regions in `ROWS` (and `WATER`) in `scripts/lib/terrain-config.mjs`
   so the route fits the shorter strip, then run `pnpm terrain`.
8. Run `pnpm build` and check every station still lands on its own window.

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

Off-trail pages resolve to Home in `stationIndex()`, which means the header has
no current station and the landscape shows the woods. That is acceptable for
`/cv`; if an off-trail page needs a different window on the panorama, pass an
explicit pathname to `LandscapeStatic` or add a station. Do not special-case
the header.

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

1. Edit `scripts/lib/terrain-config.mjs` (camera, body, `ROWS` regions,
   `WATER`) or `scripts/lib/terrain-grammars.mjs` (shape generation).
2. Run `pnpm terrain`.
3. Review the generated diff and, if needed, `pnpm terrain -- --preview` in
   `.terrain-preview/`: the whole panorama plus a laptop and phone window per
   station.
4. Confirm:
   - the generator's validation passes;
   - row ground lines recede, with at least 3.5 scene units of floor between
     consecutive rows;
   - the near ground line stays within `CAMERA.nearBase`;
   - the tallest near-row shape tops out at or below `NEAR_TOP` (`76`);
   - the water sits between row 2's ground line and the near ground line;
   - symbols stand only on their row's base, never on another symbol. Trees on
     a hill belong in the hill's symbol;
   - the phone windows read as the same composition with lower shapes.
5. Run `pnpm build`.
6. If you changed the camera or body depth, re-check the page content offset:
   `BODY_VU`, `CAMERA.nearBase` and `CONTENT_OFFSET_DVH` are a three-way
   constraint.
7. If the Home window changed, run `node scripts/generate-og.mjs`; the social
   card is drawn from it.
8. Commit the generated file with the config/grammar change.

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
7. Check the content offset against the near terrain: `CAMERA.nearBase +
BODY_VU` is `130`, content starts at `100 + CONTENT_OFFSET_DVH` (`120`), and
   nothing in the near row stands above `NEAR_TOP`.
8. Below an aspect ratio of 7:5, every other placed shape (`lod-1`) is hidden by
   `globals.css`. A shape missing only on narrow screens is usually that.
9. Run the export gate; a broken route or asset often presents as a visual
   failure on only one page.
