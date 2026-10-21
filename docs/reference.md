# Reference

Quick constants, file locations, terminology and the record of deliberate design
decisions.

## Stack

| Dependency                                      | Version   |
| ----------------------------------------------- | --------- |
| Next.js                                         | `16.3.2`  |
| React / React DOM                               | `19.2.8`  |
| TypeScript                                      | `5.9.3`   |
| Tailwind CSS                                    | `4.3.3`   |
| Motion                                          | `13.1.1`  |
| next-themes                                     | `0.4.6`   |
| Radix UI                                        | `1.6.7`   |
| Simple Icons (`@icons-pack/react-simple-icons`) | `13.15.1` |
| Phosphor icons                                  | `2.1.10`  |
| Geist fonts                                     | `1.7.2`   |
| pnpm                                            | `10.32.1` |

The package versions are pinned exactly in `package.json`; the lockfile is
`pnpm-lock.yaml`. `engines.node` is `>=20.9.0`; CI uses Node 22.

## Station geometry

| Constant           | Value                                            |
| ------------------ | ------------------------------------------------ |
| `GUTTER_VW`        | `16`                                             |
| `SPAN_VW`          | `116`                                            |
| `STRIP_VW`         | `STATIONS.length * 116`; `464` for four stations |
| `panTarget(index)` | `-stripPct(index * 116)`                         |

With four stations, each `panTarget` step is `25%` of the strip. At rest,
station `i` shows the window `[116i, 116i + 100]` in strip viewport widths. See
`src/lib/station-geometry.ts` and [`landscape.md`](landscape.md).
`scripts/lib/terrain-config.mjs` mirrors `SPAN_VW` and `STRIP_VW`, and
`Landscape.tsx` throws if the generated `PANORAMA.stripVw` disagrees.

## Scene constants

| Constant               | Value                | Owner                               |
| ---------------------- | -------------------- | ----------------------------------- |
| `--scene`              | `max(100svh, 48rem)` | `globals.css`                       |
| `--vu`                 | `var(--scene) / 100` | `globals.css`                       |
| `CAMERA.horizon`       | `58`                 | `terrain-config.mjs`                |
| `CAMERA.nearBase`      | `106`                | `terrain-config.mjs`                |
| `CAMERA.recession`     | `0.74`               | `terrain-config.mjs`                |
| `BODY_VU`              | `24`                 | `terrain-config.mjs`                |
| `SOLID_TO`             | `0.4`                | `terrain-config.mjs`                |
| `GROUND`               | `0.12`               | `terrain-config.mjs`                |
| `NEAR_TOP`             | `76`                 | `terrain-config.mjs`                |
| `DESIGN_ASPECT`        | `1.75`               | `terrain-config.mjs`                |
| `REFERENCE`            | `1440 x 900`         | `terrain-config.mjs`                |
| `boxFit`               | `2.6`                | `generate-terrain.mjs`              |
| `PANORAMA.bandVu`      | `130`                | generated export                    |
| LOD cut-off (`lod-1`)  | aspect `7/5`         | `globals.css`, `terrain-render.mjs` |
| `CONTENT_OFFSET_DVH`   | `20`                 | `motion.ts`                         |
| Absolute content start | `120` scene units    | hero + offset                       |
| Near terrain floor     | `106 + 24 = 130`     | `nearBase + BODY_VU`                |
| `HAZE_DVH`             | `52`                 | `atmosphere.ts`                     |
| `HORIZON_DVH`          | `58`                 | generated export                    |

## Motion constants

| Constant            | Value                                     |
| ------------------- | ----------------------------------------- |
| `EASE_OUT_EXPO`     | `[0.16, 1, 0.3, 1]`                       |
| `REVEAL_DURATION`   | `0.6s`                                    |
| `REVEAL_OFFSET`     | `12px`                                    |
| `REVEAL_STAGGER`    | `0.08s`                                   |
| `REVEAL_VIEWPORT`   | `{ once: true, amount: 0.3 }`             |
| `PAN_SPRING`        | `{ stiffness: 72, damping: 26, mass: 1 }` |
| `SPEED.sky` / `orb` | `0.40`                                    |
| `SPEED.haze`        | `0.52`                                    |
| `SPEED.terrain4`    | `0.66`                                    |
| `SPEED.terrain3`    | `0.76`                                    |
| `SPEED.terrain2`    | `0.92`                                    |
| `SPEED.water`       | `0.96`                                    |
| `SPEED.terrain1`    | `1.08`                                    |
| Content             | `1.00`                                    |

## z-index scale

| Token             | Value                |
| ----------------- | -------------------- |
| `Z.landscapeFar`  | `0`                  |
| `Z.content`       | `10`                 |
| `Z.landscapeNear` | `30`                 |
| `Z.header`        | `40`                 |
| `Z.overlay`       | `50`                 |
| `Z.grain`         | `60`                 |
| skip link focus   | `70` (local utility) |

`SCENE_Z` is a separate local scale for elements inside the landscape. Use it
there, not on the page.

## Type scale

| Token         | Classes                     |
| ------------- | --------------------------- |
| `PROSE`       | `text-lg leading-relaxed`   |
| `PROSE_TIGHT` | `text-base leading-relaxed` |
| `META`        | `text-sm leading-relaxed`   |
| `CHIP`        | `font-mono text-xs`         |
| `TAG`         | bordered mono tag; no pill  |

## Route reference

Regions per depth in `ROWS`, in strip viewport widths. Regions overlap, and each
row changes at a different place. Station windows: Home `[0, 100]`, Experience
`[116, 216]`, Projects `[232, 332]`, Writing `[348, 448]`.

| Depth | Regions                                                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1`   | forest `-24` to `134`, thinning from `90`; meadow `98` to `214`; massif (the hill) at `222`; lake shore meadow `210` to `344`; range `334` to `490` |
| `2`   | forest `-24` to `164`; meadow `124` to `222`; low range `198` to `256`; ranges `240` to `346` and `338` to `490`                                    |
| `3`   | forest `-24` to `216`; low range `186` to `244`; range `226` to `352`; cloud sea `340` to `490` (`fill: 4`)                                         |
| `4`   | forest `-24` to `178`; distant hills `138` to `216`; ranges `196` to `354` and `342` to `490` (`fill: 3`)                                           |
| water | river `100` to `254`; lake `246` to `324`; painted after row 2, before row 1                                                                        |

Depth `1` is nearest. Ground lines and crests derive from `CAMERA`, not from
each region. `fill` overrides the terrain ramp rung; the cloud sea uses it to
read paler than the rock behind it.

## Key symbols

| Symbol                                                             | Location                                | Meaning                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `STATIONS`                                                         | `src/content/stations.ts`               | Ordered route geography                                                                                      |
| `stationIndex` / `stationFor`                                      | same                                    | Pathname to station, Home fallback                                                                           |
| `EXTERNAL_LINKS`                                                   | same                                    | Off-trail nav links, not stations                                                                            |
| `PAN_SPRING` / `SPEED`                                             | `src/lib/motion.ts`                     | Horizontal and vertical motion                                                                               |
| `CONTENT_OFFSET_DVH`                                               | same                                    | Content start below a full hero                                                                              |
| `GUTTER_VW` / `SPAN_VW` / `STRIP_VW` / `panTarget`                 | `src/lib/station-geometry.ts`           | Strip layout                                                                                                 |
| `Z` / `SCENE_Z`                                                    | `src/lib/z.ts`                          | Stacking scales                                                                                              |
| `PROSE` / `META` / `CHIP` / `TAG`                                  | `src/lib/type.ts`                       | Body and meta type                                                                                           |
| `siteGraph`                                                        | `src/lib/schema.ts`                     | Person + WebSite                                                                                             |
| `homeGraph` / `experienceGraph` / `projectsGraph` / `writingGraph` | same                                    | Page graphs                                                                                                  |
| `CSP_META` / `CSP_HEADER`                                          | `src/lib/csp.ts`                        | Meta and header policies                                                                                     |
| `PANORAMA` / `HORIZON_DVH`                                         | `src/content/terrain.generated.ts`      | Generated panorama                                                                                           |
| `PanoramaRowSvg` / `PanoramaWaterSvg` / `panoramaRow`              | `src/components/landscape/panorama.tsx` | Inline-SVG row and water render                                                                              |
| `renderWindow` / `maxLod`                                          | `scripts/lib/terrain-render.mjs`        | Flattened window for preview and OG card                                                                     |
| `BRAND_MARKS`                                                      | `src/components/brand/registry.ts`      | Skill id to Simple Icons mark                                                                                |
| `verify-export.mjs`                                                | `scripts/`                              | Post-build gate                                                                                              |
| `terrain-config.mjs`                                               | `scripts/lib/`                          | Camera, strip, body, `ROWS`, `WATER`                                                                         |
| `terrain-grammars.mjs`                                             | `scripts/lib/`                          | Shape generation: `conifer`, `snag`, `poplar`, `massif`, `waves`, `envelope`, `profile`, `cloudSea`, `water` |

## Glossary

**Station**: a route in the landscape. Stations have a nav label, a window on
the panorama, a pan target and a sitemap entry. `/cv` is not a station.

**Panorama**: the one generated landscape for the whole trail, `STRIP_VW` wide,
in four rows plus water. Exported as `PANORAMA`.

**Region**: a stretch of one row in `ROWS`: forest, meadow, massif, range or
cloud. Regions overlap, so an edge is a change of density rather than a seam.

**Symbol**: a shape with its own proportion (conifer, snag, poplar, hill,
mountain), placed by `<use>` at a centre in viewport widths and a height in scene
units. It stands only on its row's base.

**Level of detail**: every other placed shape has class `lod-1` and is hidden
below aspect ratio 7:5.

**Depth**: a terrain row, `1` (nearest) to `4` (furthest). Depth controls the
vertical speed and the paint band; it is not an array index.

**Gutter**: the 16vw of world after each station that is only seen in passing.
It gives a change of scene room to happen off-screen.

**Span**: the distance travelled per station: 100vw plus its gutter.

**Scene unit (`--vu`)**: one percent of `--scene`, which is `max(100svh, 48rem)`.

**Near band**: depth 1, painted in front of content, clipped to the top overlap
and `pointer-events-none`.

**Off-trail**: a page not in `STATIONS`; it resolves to Home and has no
marker or sitemap entry.

**Store**: not a thing here. No database, CMS or server state.

## Deliberate omissions and asymmetries

- **No phone number.** `SITE.phone` is `null` until the owner supplies one.
- **No AWS logo.** Trademark requests removed the Simple Icons marks; the wall
  uses type.
- **No local article pages.** Both pieces are hosted on LinkedIn.
- **No `/experience`.** It was merged into `/skills`; keep the old URL out unless
  a real redirect is added.
- **No redirects in the static export.** Host-level redirects are required if a
  retired URL must keep resolving.
- **No test suite.** The build gate and CI checks are the verification strategy.
- **No server headers on DigitalOcean.** The meta CSP is the surviving policy.
- **No per-depth horizontal parallax.** One spring moves the whole landscape.
- **No hand-authored taxonomies.** Skills, roles, projects, articles, nav,
  sitemap, JSON-LD and `llms.txt` derive from typed content.

## Decision log

| Decision                               | Why                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Static export                          | Small personal site with no runtime work; cheap, cacheable, portable                                                                            |
| Typed content modules                  | Compile-time checking without a CMS; one source for pages and metadata                                                                          |
| Landscape in root layout               | App Router preserves layout state, so panning is continuous travel                                                                              |
| One horizontal spring                  | Per-depth horizontal parallax read as the world coming apart                                                                                    |
| Depth on the vertical axis             | Reader controls the rate; stable and comfortable                                                                                                |
| Scene units with a floor               | Keeps the composition and type aligned on landscape phones                                                                                      |
| 16vw gutters                           | A change of scene happens off-screen, so each station shows one place at rest                                                                   |
| One continuous panorama                | Per-station repeating tiles read as wallpaper and could not carry a feature, such as the river, from one station into the next                  |
| Positioned in vw, sized in scene units | Stations are spaced in viewport widths, but a shape drawn in them squeezes on a phone and splays on an ultrawide; symbols keep their proportion |
| `boxFit` plus one LOD cut-off          | On narrow screens shapes scale down uniformly instead of crowding; below 7:5 every other shape drops, holding density within a factor of two    |
| Static fallback as a client module     | As a Server Component the fallback panorama was serialised into every RSC payload, about 300KB per navigation                                   |
| Generated, committed terrain           | Deterministic, reviewable, zero runtime generation, no hydration risk                                                                           |
| One-page Experience                    | Roles and competencies belong together; retired `/experience`                                                                                   |
| Off-trail CV                           | A CV is scanned, not navigated; no trail marker or sitemap entry                                                                                |
| `trailingSlash: true`                  | DigitalOcean serves a plain file tree; directory indexes are required                                                                           |
| Meta CSP plus headers                  | Static hosts cannot all set headers; meta travels with the page                                                                                 |
| `data-theme` attribute                 | The token layer and theme control need a writable theme state                                                                                   |
| One-pill skill wall                    | Two visual registers read as two kinds of object; one pill plus optional mark                                                                   |
| No ambient motion                      | The landscape is the deliberate gesture; reveals establish reading order                                                                        |

## Where to look first

| Question                          | File                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| Why does the site move like this? | [`landscape.md`](landscape.md)                                |
| How do I add a page?              | [`playbooks.md`](playbooks.md)                                |
| What breaks if I change this?     | [`architecture.md`](architecture.md), `components.md`         |
| Why is this constant here?        | `src/lib/motion.ts`, `src/lib/station-geometry.ts`            |
| What does the build check?        | `scripts/verify-export.mjs`, [`operations.md`](operations.md) |
| What is stale?                    | [`README.md`](README.md#known-drift)                          |
