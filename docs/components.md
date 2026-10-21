# Component catalogue

This is an ownership map, not an API reference. Read the component before
changing it; most files carry a comment explaining the constraint they encode.

## Directory layout

```text
src/app/                 routes, metadata routes, global error/404, CSS
src/components/
  brand/                 skill pills and the Simple Icons registry
  landscape/             the scene, static scene, terrain masks, orb, grain
  layout/                header, navs, footer, hero and section shells
  sections/              page-level content blocks reused by pages
  system/                motion, theme, JSON-LD, errors, swipe
  ui/                    local shadcn/Radix primitives
src/content/             typed content
src/lib/                 pure helpers and constants
```

## App entry points

| File                        | Responsibility                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/app/layout.tsx`        | Root document, metadata defaults, CSP meta, site JSON-LD, theme provider, persistent landscape and chrome |
| `src/app/page.tsx`          | Home station                                                                                              |
| `src/app/skills/page.tsx`   | Experience station                                                                                        |
| `src/app/projects/page.tsx` | Projects station                                                                                          |
| `src/app/articles/page.tsx` | Writing station                                                                                           |
| `src/app/cv/page.tsx`       | Off-trail CV                                                                                              |
| `src/app/not-found.tsx`     | Static 404 with trail links                                                                               |
| `src/app/error.tsx`         | Client route-segment error boundary; receives `retry` in Next 16                                          |
| `src/app/global-error.tsx`  | Last-resort root error document; inline styles, own `<html>` and `<body>`                                 |
| `src/app/sitemap.ts`        | Station sitemap                                                                                           |
| `src/app/robots.ts`         | Named AI-agent allow list                                                                                 |
| `src/app/manifest.ts`       | Web app manifest                                                                                          |
| `src/app/llms.txt/route.ts` | Plain-text site digest                                                                                    |
| `src/app/globals.css`       | Tokens, themes, scene units, base styles, reduced motion                                                  |

## Layout components

### `SkipLink`

First focusable element. Links to `#content`. Pairs with
`<main id="content" tabIndex={-1}>`; the `tabIndex` is what moves focus in
Safari, not just the scroll.

### `SiteHeader`

Fixed, 64px, one line. Contains the wordmark link, desktop `TrailNav`, desktop
`ThemeControl`, and `MobileNav` below `md`. Uses a low-alpha background with
`backdrop-blur-md`. It is fixed rather than a scrolling blur container, which
keeps the composite cost low.

### `TrailNav`

Desktop primary nav. It maps `STATIONS` to equal-width items, draws a hairline
under the row, and animates a marker and a small diamond to the active station.
Off-trail `EXTERNAL_LINKS` sit outside the `<ul>` so they do not affect the
marker's division. The marker is `aria-hidden`; the link carries
`aria-current="page"`.

### `MobileNav`

Radix `Dialog` through `src/components/ui/sheet.tsx`. Trigger is a list icon.
It lists stations, external links, and `ThemeControl`, and closes on navigation.
The Radix primitive supplies the focus trap, escape handling, scroll lock and
focus return, which is why the site uses it rather than a hand-rolled drawer.

### `SiteFooter`

Three-column footer: identity/title, page links from `STATIONS`, and contact
links. The contact link uses the same `SITE.contactLabel` and destination as the
hero, not a second wording.

### `StationHero`

Client component. A transparent, full-scene-height hero band at every station:

- `min-h-[var(--scene)] pt-28`, so the fixed header is cleared and the scene
  floor applies on short viewports;
- copy in a 7/12 grid column at `md`, 6/12 at `lg`;
- fades opacity as the reader scrolls, with no translate, so it stays in step
  with the section below;
- every page supplies one `h1 id="station-title"`.

It carries no background; the landscape in the layout is the sky.

### `StationContent` and `Section`

`StationContent` is the opaque block below the hero. It sets
`paddingTop: var(--vu) * CONTENT_OFFSET_DVH` and `z-index: Z.content`, then wraps
children in `bg-background`. The background is what stops the landscape showing
through long-form content.

`Section` provides the site's section rhythm:

- `<section aria-labelledby={id}>`;
- heading `<h2 id={id} class="scroll-mt-24 ...">`;
- a hidden-until-hover/focus permalink;
- `max-w-[1400px] px-4 md:px-8`;
- `py-12` at every breakpoint and `mt-10 md:mt-14` under the heading.

The anchor is the heading, not the section, so a link lands on the words rather
than on the section's top padding.

### `ScrollCue`

A real `<a>` to the first section, not a decorative button. It sits in the hero's
normal flow so it scrolls away naturally, has a small hover/focus caret shift,
and has no looping animation.

## Landscape components

| Component         | Responsibility                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Landscape`       | The live scene. Far and near fixed bands, pan strip, depth layers, sky/haze/orb/water. Mounted in the root layout. |
| `LandscapeStatic` | One composed, server-rendered frame with no hooks. Used by 404 and the local landscape error fallback.             |
| `Orb`             | Sun/moon. Scrolls vertically only; no horizontal pan, no ambient loop.                                             |
| `Grain`           | Fixed inline-SVG noise, `pointer-events-none`, `Z.grain`.                                                          |
| `atmosphere.ts`   | `SKY_CLASS`, `hazeStyle()`, orb classes and gradients. Shared by live and static scenes.                           |
| `terrain-mask.ts` | `terrainLayerStyle()` and `waterStyle()`: SVG mask tiles plus body gradients.                                      |

Details and constraints are in [`landscape.md`](landscape.md).

## Section components

### `FeaturedWork`

Home-page asymmetric split:

- lead project in the wider column;
- project index directly beneath;
- two remaining featured projects stacked in the narrower column.

The grid row template is intentional. A plain stretched column grew the lead
card from its natural height to match the stacked pair. It uses
`FEATURED_PROJECTS`, not all projects.

### `ContactRoutes`

A hairline-divided list of real contact routes:

- email (`mailto:`);
- GitHub and LinkedIn;
- phone only when `SITE.phone` is non-null.

It uses icons as decoration and text labels. The hero links here rather than
firing a mail client immediately.

### `RoleDeliveries`

Renders `Role.deliveries` as programmes rather than bullets. Each entry uses its
`discipline` as an eyebrow, then name, summary, detail and tools. The discipline
is the reason the entry exists and must be unique within a role.

### `RoleProgression`

Renders `Role.progression` as a horizontal rail from `md` up and a vertical list
below. It derives month labels and durations from `src/lib/dates.ts`; it does not
own dates. The current role can show a "present" treatment.

## System components

### `StationSwipe` and `StationSwipeContent`

Client context provider that owns:

- the shared pan spring;
- the touch gesture and commit/return logic;
- neighbour prefetching;
- `useStationPan()` for the landscape;
- `StationSwipeContent`, which translates the page by a quarter of the drag.

The gesture deliberately does not claim vertical scrolls, browser edge gestures,
open dialogs or multi-touch. `touchmove` is the only non-passive listener. It is
an enhancement, not the only navigation path.

### `Reveal`

Motion `whileInView` wrapper with the shared 600ms / 12px / 80ms stagger. Supports
`div`, `li`, `section` and `article` element types via `as`. Reduced motion
renders without the animation.

### `ThemeProvider`

`next-themes` with `attribute="data-theme"`, `defaultTheme="system"`,
`enableSystem`, and `disableTransitionOnChange`. The attribute is what the CSS
token layer follows.

### `ThemeControl`

Three-state segmented control (`Auto`, `Light`, `Dark`) implemented as a
`radiogroup` of buttons. It renders a same-size placeholder on the server/first
client pass to avoid layout shift and uses `useSyncExternalStore` to answer "are
we on the client yet" without an effect-driven second render.

### `JsonLd`

One `<script type="application/ld+json">`. It exists to avoid repeating
`dangerouslySetInnerHTML` in every page. Input is always a literal built from
typed content modules in `src/lib/schema.ts`; no user input reaches it.

### `ClientBoundary`

Class error boundary for a single client island. Wraps `Landscape` so a throw in
the scene falls back to `LandscapeStatic` instead of replacing the entire route
segment. Hand-written because React error boundaries still require a class.

## Brand components

### `BrandMark`

One pill per skill: bordered, `h-10`, optional 16px mark prefix, name always set
in mono. Marks take `currentColor` from `--logo-ink`; no brand hexes. The mark is
`aria-hidden` because the name is beside it.

### `registry.ts`

The only module allowed to import `@icons-pack/react-simple-icons`. Maps
`IconSkillId` to a Simple Icons component. The package version is pinned and the
registry is typed so a new icon-backed skill cannot ship without a mark.

There is no AWS mark. Amazon, Microsoft and Google had marks removed from Simple
Icons on trademark request; drawing one would fabricate another company's brand.

## UI primitives

`src/components/ui/` contains local shadcn-style primitives:

- `accordion.tsx` — used by the Experience roles.
- `sheet.tsx` — used by `MobileNav`.
- `badge.tsx`, `button.tsx`, `card.tsx`, `skeleton.tsx`, `tabs.tsx`,
  `tooltip.tsx` — present as the standard primitive set but not currently
  imported by a page.

They are local source, not a runtime dependency on a shadcn package. Keep their
token names aligned with `globals.css`. Do not use the pill-shaped `Badge` for
tech tags; `TAG` in `src/lib/type.ts` is the site's tag treatment.

## Ownership rules

| If you change…                     | Also check…                                                           |
| ---------------------------------- | --------------------------------------------------------------------- |
| `TrailNav` or `MobileNav`          | `STATIONS`, `EXTERNAL_LINKS`, active/current semantics                |
| `StationHero`                      | every page's `h1 id`, content offset, near terrain cap                |
| `StationContent`/`Section`         | anchor targets in page CTAs and `ScrollCue`                           |
| `Landscape`                        | `LandscapeStatic`, atmosphere/mask helpers, reduced motion, z-index   |
| `StationSwipe`                     | station geometry, prefetch, content transform, mobile nav scroll lock |
| `Reveal`                           | motion tokens and `prefers-reduced-motion`                            |
| `BrandMark`                        | registry, `Skill.icon`, contrast of `--logo-ink`                      |
| `RoleDeliveries`/`RoleProgression` | the `Role` type, Experience and CV views                              |
| `globals.css`                      | contrast script, Tailwind `@theme inline`, both themes                |
