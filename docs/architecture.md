# Architecture

The site is a statically exported Next.js App Router application with one large
client-side scene and a small number of motion islands. This document describes
the moving parts and the boundaries between them.

## System shape

```text
src/content/*.ts          typed source of truth
        |
        +--> src/app/**   Server Components -> HTML
        +--> src/lib/schema.ts -> JSON-LD
        +--> src/app/llms.txt/route.ts -> /llms.txt
        +--> src/app/sitemap.ts -> /sitemap.xml

src/app/layout.tsx
  ThemeProvider
    SkipLink
    StationSwipe (client; owns pan + touch gesture)
      ClientBoundary
        Landscape (client; fixed scene)
      SiteHeader
      main
        StationSwipeContent -> page
      footer
    Grain

next build (output: 'export')
  -> out/
  -> scripts/verify-export.mjs
  -> static host
```

At runtime there is no application server. The browser receives HTML, CSS and
JavaScript bundles. Client islands hydrate; there are no API routes, server
actions, databases, cookies, sessions or authenticated operations.

## Rendering and export

Key configuration:

| Setting                    | Location                                                      | Consequence                                                    |
| -------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| `output: 'export'`         | `next.config.ts`                                              | `next build` writes static files to `out/`                     |
| `images.unoptimized: true` | `next.config.ts`                                              | No image server; every `Image` needs explicit dimensions       |
| `trailingSlash: true`      | `next.config.ts`                                              | Routes emit `out/<route>/index.html`; required by DigitalOcean |
| `reactStrictMode: true`    | `next.config.ts`                                              | Development checks for accidental side effects                 |
| `dynamic = 'force-static'` | `sitemap.ts`, `robots.ts`, `manifest.ts`, `llms.txt/route.ts` | Static export can collect metadata routes                      |
| `metadataBase`             | `src/app/layout.tsx`                                          | Resolves Open Graph asset paths to absolute URLs               |

The export gate is part of the build:

```json
"build": "next build && node scripts/verify-export.mjs"
```

`scripts/verify-export.mjs` is not a smoke test. It asserts the artefacts whose
absence would be silent: the flat 404, directory-index station pages, the CV
directory index, the CV PDF, `llms.txt`, the manifest, `sitemap.xml`,
`robots.txt`, `_headers`, `.nojekyll`, an Open Graph image, the CSP being in
`<head>`, agreement between the three CSP copies, and a 3 MB per-asset limit.

## Server and client boundaries

Pages are Server Components by default. They read typed content, build metadata
and render HTML. Interactivity is isolated:

| Client island                          | Why it is client-side                              |
| -------------------------------------- | -------------------------------------------------- |
| `Landscape`                            | Scroll-linked transforms and the shared pan spring |
| `Orb`                                  | Same scroll-linked vertical motion                 |
| `StationSwipe` / `StationSwipeContent` | Touch gesture, router, motion values               |
| `StationHero`                          | Fades the hero as it scrolls                       |
| `TrailNav`                             | Reads pathname and animates the marker             |
| `MobileNav`                            | Opens a Radix dialog and reads pathname            |
| `ThemeControl`                         | Reads and writes `next-themes`                     |
| `ThemeProvider`                        | Wraps the app in `next-themes`                     |
| `Reveal`                               | Motion `whileInView`                               |
| `error.tsx`, `global-error.tsx`        | React error boundaries require client components   |

`JsonLd` is a server-renderable helper. `LandscapeStatic` is used by the 404 and
by the local error boundary fallback; it has no hooks and nothing that can throw
while handling an earlier failure. It is a `'use client'` module even so: the
layout passes it as the error boundary's fallback, and as a Server Component its
whole panorama would be serialised into every page's RSC payload (about 300KB per
navigation). As a client module the payload carries a reference, the panorama
data comes from the bundle the animated landscape already loads, and it still
server-renders to HTML for the 404's no-JS floor.

### Root composition order

`src/app/layout.tsx` is the only place the persistent chrome is assembled:

1. `<meta httpEquiv="Content-Security-Policy">` (React hoists it into `<head>`).
2. `JsonLd` with the site-wide `Person` and `WebSite` graph.
3. `ThemeProvider`.
4. `SkipLink`.
5. `StationSwipe`, which provides the pan spring and drag motion values.
6. `ClientBoundary` around `Landscape`; its fallback is `LandscapeStatic`.
7. `SiteHeader`.
8. `<main id="content" tabIndex={-1}>` containing `StationSwipeContent` and the
   route page.
9. Footer, outside `main` but inside the same content stacking layer.
10. `Grain`, fixed above everything and `pointer-events-none`.

The layout is intentionally not remounted on navigation. That is what keeps the
landscape state continuous.

## Navigation and motion data flow

`STATIONS` in `src/content/stations.ts` defines the order of the world. For a
pathname, `stationIndex()` returns the matching station, a nested route's parent,
or Home's woods for anything off-trail. `stationFor()` returns the station object.

`StationSwipe` derives a pan target from the current index and owns a Motion
spring:

```text
pathname -> stationIndex -> panTarget -> spring -> pan string -> Landscape
                              ^
                              |
                     swipe release / router.push
```

- Tapping a nav link changes the pathname. The spring animates the strip to the
  new station target; the old page is replaced by the new route's content.
- A horizontal touch drag updates the spring directly with `jump()`. On release,
  the gesture either commits (spring to the neighbour then `router.push`) or
  returns to the current station.
- The current station's neighbours are prefetched, so the route payload is
  usually ready before the release.
- Reduced motion uses `spring.jump(target)` and ignores drag travel; there is no
  cross-station animation.

`StationSwipeContent` translates page content by at most a quarter of the drag
distance. It resolves to `transform: none` at rest, so no permanent containing
block or stacking context wraps the page.

The vertical landscape is independent of the pan: each depth is one `Travel`
layer inside a fixed band, moved by `-scrollY * SPEED[depth]`, and inside it one
`PanStrip` carries that depth's row of the panorama, the whole trail long. See
[`landscape.md`](landscape.md) for the full model.

## Theme flow

`next-themes` is configured with `attribute="data-theme"`, `defaultTheme="system"`
and `enableSystem`. Before paint it writes `data-theme` on `<html>`;
`suppressHydrationWarning` on `<html>` prevents React from reporting that
pre-paint mutation as a mismatch.

`globals.css` has three theme paths:

1. `:root` / `[data-theme='light']`.
2. `[data-theme='dark']`.
3. `@media (prefers-color-scheme: dark) :root:not([data-theme])` for a reader with
   JavaScript disabled, where no attribute exists.

The custom `dark` Tailwind variant follows `[data-theme='dark']` and keeps a
media-query fallback only while the root has no `data-theme`. This is why the
theme control can override the OS setting.

## Content and metadata flow

`src/content` is plain TypeScript with no React imports. Pages import content
directly; metadata routes and JSON-LD read the same modules.

| Surface                | Source                                | Output                                                |
| ---------------------- | ------------------------------------- | ----------------------------------------------------- |
| Page body              | `src/app/**/page.tsx` + `src/content` | Static HTML                                           |
| Canonical / Open Graph | Each page's `metadata` export         | `<link rel="canonical">`, OG tags                     |
| JSON-LD                | `src/lib/schema.ts`                   | One `@graph` per page, Person referenced by `@id`     |
| Sitemap                | `STATIONS`                            | `out/sitemap.xml`, trailing-slashed station URLs only |
| Robots                 | `src/app/robots.ts`                   | `out/robots.txt`, all agents allowed                  |
| Manifest               | `src/app/manifest.ts`                 | `out/manifest.webmanifest`                            |
| LLM digest             | `src/app/llms.txt/route.ts`           | `out/llms.txt`, prose in reading order                |
| Social card            | `scripts/generate-og.mjs`             | committed `src/app/opengraph-image.png`               |

`/cv` is intentionally absent from `STATIONS`, so it is absent from the nav,
trail marker, sitemap and swipe order. It is still linked from `llms.txt` and
checked by the export gate.

## Dependency boundaries

| Layer            | May import                                             | Must not import                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `src/content`    | `src/content/types`, local helpers such as `lib/dates` | React, Next, components                                          |
| `src/lib`        | Content, other pure helpers                            | Components, browser-only APIs unless a client component calls it |
| `src/components` | Content, lib, UI primitives                            | Another feature's page-level assumptions                         |
| `src/app`        | Everything above                                       | Build scripts                                                    |
| `scripts/**`     | Plain Node and JS modules                              | TypeScript source directly                                       |

`scripts/lib/stations.mjs` duplicates the four route strings because build
scripts run outside the TypeScript toolchain. `verify-export.mjs` fails if a
route in that list has no HTML output, which catches most drift. Any route
addition or removal must update both lists.

The only file allowed to import `@icons-pack/react-simple-icons` is
`src/components/brand/registry.ts`. That keeps the "Phosphor for UI icons, brand
marks only through the registry" rule enforceable by grep. The Simple Icons
version is pinned deliberately; marks have been removed from that package on
trademark request.

## Build and hosting boundary

`out/` is the complete deployable unit. The primary target is DigitalOcean App
Platform, which serves a static file tree and does not resolve extension-less
paths to `.html` files. That is the reason for `trailingSlash: true` and for the
directory-index assertions in the export gate.

Other hosts work from the same `out/`:

- Vercel: automatic detection, headers from `vercel.json`.
- Cloudflare Pages: build `pnpm build`, output `out/`, headers from
  `public/_headers`.
- GitHub Pages: `public/.nojekyll` is required; a project page would need
  `basePath` and `assetPrefix`.

DigitalOcean cannot set response headers for a static site. The meta CSP is the
policy that survives there; `frame-ancestors` and the other header-only
protections do not. See [`operations.md`](operations.md#security-headers-and-the-csp).

## What to change where

| Intent                       | Start here                                                   | Also check                                                                      |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Copy, dates, roles, projects | `src/content`                                                | `docs/content.md`                                                               |
| A page's sections or layout  | `src/app/**/page.tsx`                                        | `templates` in `components/layout`                                              |
| The route order or nav       | `src/content/stations.ts`                                    | `scripts/lib/stations.mjs`, `src/lib/schema.ts`, `ROWS` in `terrain-config.mjs` |
| Terrain shapes or depth      | `scripts/lib/terrain-config.mjs`, `terrain-grammars.mjs`     | `pnpm terrain -- --preview`, `docs/landscape.md`                                |
| Motion constants             | `src/lib/motion.ts`, `src/lib/station-geometry.ts`           | `docs/landscape.md`, reduced motion                                             |
| Colour, type, radii, z       | `src/app/globals.css`, `src/lib/type.ts`, `src/lib/z.ts`     | `scripts/check-contrast.mjs`, `docs/design-system.md`                           |
| Headers or CSP               | `src/lib/csp.ts`, `public/_headers`, `vercel.json`           | `scripts/verify-export.mjs`                                                     |
| Build or deploy              | `next.config.ts`, `.do/app.yaml`, `.github/workflows/ci.yml` | `docs/operations.md`                                                            |
