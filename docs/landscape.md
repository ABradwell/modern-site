# The landscape

The landscape is the site's only advanced scroll composition. Everything else
is either static layout or a small reveal. This document covers the scene model,
the station strip, the vertical depth system, the generated terrain pipeline and
the constraints that keep the composition readable.

## Composition model

The scene is one fixed, full-viewport image split into two paint bands:

| Band | z-index                | Contents                                            | Behaviour                                       |
| ---- | ---------------------- | --------------------------------------------------- | ----------------------------------------------- |
| Far  | `Z.landscapeFar` (0)   | Sky, haze, orb, depth layers 4, 3 and 2, then water | Behind page content                             |
| Near | `Z.landscapeNear` (30) | Depth layer 1 only                                  | In front of page content, `pointer-events-none` |

The two bands are siblings returned from a fragment by
`src/components/landscape/Landscape.tsx`. A wrapper carrying a transform would
create a containing block for the fixed children, so the wrapper is avoided on
purpose.

"Almost everything paints behind the page" is the design constraint. The near
treeline overlaps only the top edge of the content block, which is section
padding rather than readable text. Terrain must never paint over type. The
`pointer-events-none` on both bands is mandatory: without it the silhouettes
silently swallow clicks in the top strip of every page.

The scene is mounted in `src/app/layout.tsx`, not in a page, so App Router keeps
it mounted across route changes and the pan can be continuous.

## Scene units

The composition is measured in **scene units**, not `dvh`, `vh` or `h-screen`.

`globals.css` defines:

```css
--scene: max(100svh, 48rem);
--vu: calc(var(--scene) / 100);
```

`--vu` is one percent of the scene. The `48rem` floor is the shortest scene in
which the tallest hero copy still clears the near treeline, whose crests top out
at 76 scene units. Using `svh` rather than `dvh` avoids the mobile address-bar
snap: the composition lays out once and does not reflow when the bar retracts.
The landscape is fixed to the viewport while the composition is measured against
the scene, but the bands overhang to 130 units, so the difference is already
covered by painted terrain.

Every terrain `bottom`, `base`, shape height, haze offset, sky height, hero
height and content offset reads from `--vu`. If you add a scene-positioned
element, use `--vu`.

## The route

The landscape is one panorama for the whole trail, not one scene per station.
Walked west to east:

| Station    | Window at rest | What it shows                                                                                                   |
| ---------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| Home       | `[0, 100]`     | Deep woods: four rows of conifers                                                                               |
| Experience | `[116, 216]`   | The near trees thin into a meadow; a river leaves them and winds east past poplars; far woods and distant hills |
| Projects   | `[232, 332]`   | The river runs behind a low hill and opens into a lake at the foot of the mountains                             |
| Writing    | `[348, 448]`   | Rock, a cloud sea filling the valley, and distant summits standing clear of it                                  |

Windows are in strip viewport widths. Rows change scene at different places on
purpose: walking out of a forest, the trees beside you end first while the far
treeline carries on, so the near row opens into the clearing while the rows
behind are still woods. The route is declared as `ROWS` and `WATER` in
`scripts/lib/terrain-config.mjs`.

## Horizontal travel: one strip, one spring

`src/lib/station-geometry.ts` owns the geometry:

| Constant    | Value                   | Meaning                                      |
| ----------- | ----------------------- | -------------------------------------------- |
| `GUTTER_VW` | `16`                    | World between stations, seen only in passing |
| `SPAN_VW`   | `100 + 16 = 116`        | Distance travelled per station               |
| `STRIP_VW`  | `STATIONS.length * 116` | Total strip width; `464` with four stations  |

`panTarget(index)` is `-stripPct(index * SPAN_VW)`: a percentage of the strip
element that places station `index` in the viewport. With four stations, each
step is `116 / 464 = 25%` of the strip.

`scripts/lib/terrain-config.mjs` mirrors `SPAN_VW`, because the generator lays
the world out against these windows. The generated file records the strip width
as `PANORAMA.stripVw`, and `Landscape.tsx` throws if it disagrees with
`STRIP_VW`, so a station added without `pnpm terrain` fails loudly rather than
panning to the wrong place.

### The gutter

The panorama is continuous, so the gutter hides no seam. What it buys is room for
a change of scene to happen off-screen: at rest each window shows one place, and
the woods' edge, the hill and the climb into rock are what the reader walks
through between them.

### The spring

`PAN_SPRING` in `src/lib/motion.ts` is:

```ts
{ stiffness: 72, damping: 26, mass: 1 }
```

Damping ratio is about `1.53`, comfortably overdamped, so a full-viewport slide
settles without bouncing. Stiffness was lowered from 80 when the gutters went in:
a station is now 116 viewports of travel rather than 100, and the lower stiffness
keeps the felt speed roughly where it was.

Every depth uses this one spring. Per-depth horizontal stiffness was tried and
rejected: it reads as the world coming apart on a full-viewport slide and caused
motion sickness. Depth is expressed vertically instead.

Each depth is a `DepthBand`: a `Travel` layer for its vertical speed, holding a
`PanStrip` with that depth's row of the panorama. The water is a band of its own
between depth 2 and depth 1.

## Vertical travel: depth on scroll

All landscape layers are fixed and translate upward by `-scrollY * speed`.

`Travel` in `src/components/landscape/travel.tsx` owns this. Where the browser
supports scroll-driven animations, the `.landscape-travel` rule in `globals.css`
runs the travel as a CSS animation on the root scroll timeline, so the compositor
moves the layers in the same frame as the page. `useTravelRange` publishes the
scroll range as `--travel-max` so the keyframes can turn progress back into
pixels. Elsewhere, Motion drives the same offset from `useScroll`. The CSS path
writes `translate` and Motion writes `transform`, so the idle path always holds
its identity value.

The speeds in `src/lib/motion.ts` are absolute multipliers of scroll distance:

| Layer           | `SPEED` | Reading                                               |
| --------------- | ------- | ----------------------------------------------------- |
| Sky             | `0.40`  | Effectively distant                                   |
| Orb             | `0.40`  | Celestial body at infinity                            |
| Haze            | `0.52`  | Atmospheric layer                                     |
| Terrain depth 4 | `0.66`  | Furthest ridge                                        |
| Terrain depth 3 | `0.76`  | Far ridge                                             |
| Terrain depth 2 | `0.92`  | Mid ground                                            |
| Water           | `0.96`  | River and lake in the ground plane in front of row 2  |
| Page content    | `1.00`  | Normal document flow                                  |
| Terrain depth 1 | `1.08`  | Near treeline; overtakes content to close its overlap |

Rules that follow from the table:

- The nearest band is fastest, so parallax increases toward the viewer.
- Every band except depth 1 is slower than content, so content gradually rises
  and covers the scene. That is "the page comes up out of the landscape."
- Depth 1 is slightly faster than content because it is painted in front. Its
  overlap with the top of the content block must close as the reader scrolls,
  not sit permanently on the page.
- The water must be painted after depth 2 and travel at `0.96`. It lies in the
  ground plane in front of that row; at `0.82` it drifted out from under the near
  grass.

`Travel` collapses the Motion output to zero when reduced motion is active rather
than skipping hooks, and the CSS path is gated on `prefers-reduced-motion:
no-preference`, so hook order remains stable if the OS setting changes
mid-session. The spring uses `jump()` under reduced motion.

## Compositing

Every moving element is its own compositor layer: each `Travel` layer carries
`will-change: transform`, and so does each `PanStrip`. Scrolling and panning then
move pixels that were rasterised once. When every depth shared one layer per
band, any motion repainted the whole band at device pixel ratio on every frame,
which is what made the scene judder on slower GPUs.

Each depth band's box is `PANORAMA.bandVu` deep: the lowest ground line plus
`BODY_VU`, 130 scene units today. It has to contain every row, or the near body
is cut off along a hard line once the reader scrolls.

## Drawing a row

`src/components/landscape/panorama.tsx` draws each row as inline SVG.
`PanoramaRowSvg` and `PanoramaWaterSvg` are pure renders with no hooks, shared by
the animated landscape and the static fallback so the two cannot draw different
worlds.

The problem it solves: stations are spaced in viewport widths, so everything has
to be placed in viewport widths, but a tree drawn in viewport widths is a needle
on a phone and splayed on an ultrawide. So the panorama has two kinds of shape.

**Symbols keep their proportions.** Conifers, snags, poplars, hills and
mountains are `<symbol>`s with `preserveAspectRatio="xMidYMax meet"`, placed by
a `<use>` whose box is positioned by centre in percentages of the strip and
sized in percentages of the row's height. The browser scales the symbol
uniformly to fit the box and stands it on the box's floor.

The box is `boxFit` (`2.6`) times the shape's design width in viewport widths.
Near the design shape the box is wider than the shape, so height limits it and it
stands at full height. On a narrow screen width takes over and the shape scales
down uniformly. A phone then sees the same composition as a laptop with lower
shapes. Without it, a phone at Experience saw nothing but the far mountains.

**Profiles stretch.** Meadow rolls, mountain shoulders, the cloud sea, the river,
the lake and each row's solid body are drawn in a nested SVG with
`preserveAspectRatio="none"`, in panorama units (`unit = 10` per viewport width
across and per scene unit down). These lie in the ground plane or have no
characteristic proportion, so a narrow viewport reads them as a different view of
the same place.

Colour is a `--terrain-N` token per fill group, inherited by every symbol, so one
asset serves both themes. The body under each row is a rectangle filled with a
vertical gradient: solid for `SOLID_TO` of `BODY_VU` below the ground line, then
dissolving. It starts `seamVu` above the base, so it overlaps the feet of
everything standing there; meeting exactly leaves an antialiased hairline.

Every symbol and gradient id carries a prefix (`land1` to `land4` animated,
`still1` to `still4` static), because the 404 renders both scenes and ids are
document-wide.

### Level of detail

Above `designAspect / boxFit` (about `0.67`), shapes keep their size while the
viewport narrows, so they stand closer together. The generator marks every other
placed shape as detail (`lod-1`), and `globals.css` hides `.lod-1` below an
aspect ratio of `7/5`. Below `0.67` shapes scale with the width and their spacing
stops changing. Together that holds density within a factor of two of the design
from a folded phone to an ultrawide. `7/5` sits between common tablet and laptop
shapes. `maxLod` in `scripts/lib/terrain-render.mjs` mirrors the rule.

## The camera and generated terrain

Terrain is generated, not hand-drawn. `src/content/terrain.generated.ts` is
committed and must not be edited by hand. It exports `PANORAMA` and
`HORIZON_DVH`.

`scripts/lib/terrain-config.mjs` defines:

| Constant           | Value        | Meaning                                                   |
| ------------------ | ------------ | --------------------------------------------------------- |
| `CAMERA.horizon`   | `58`         | Ground-plane vanishing line in scene units                |
| `CAMERA.nearBase`  | `106`        | Nearest row's ground line                                 |
| `CAMERA.recession` | `0.74`       | Ground-line spacing / camera angle                        |
| `DESIGN_ASPECT`    | `1.75`       | Viewport shape the spacings are written for               |
| `BODY_VU`          | `24`         | Solid then fading body below each ground line             |
| `SOLID_TO`         | `0.4`        | Fraction of the body that stays solid                     |
| `GROUND`           | `0.12`       | Base height above the ground line, as a fraction of crest |
| `NEAR_TOP`         | `76`         | Highest any near-row shape may reach                      |
| `REFERENCE`        | `1440 x 900` | Viewport for preview geometry                             |

Ground lines use `horizon + (nearBase - horizon) * recession ** i`: `106 / 93.5 /
84.3 / 77.5`. Each row's shapes stand on its base, `GROUND * nominalCrest` above
the ground line, and the strip of solid ground between is the floor the eye sees
between one row and the next. Crests come from `apparentCrest(nearCrest, i,
lift)`, so a row of conifers falls off at the camera's rate, while `lift` lets a
far range stand taller than the ridge in front of it.

### Regions

Each row is a list of overlapping regions:

| Kind     | Draws                                                                       |
| -------- | --------------------------------------------------------------------------- |
| `forest` | Conifers placed one by one; `density` keys thin, space out and shorten them |
| `meadow` | A low rolling profile, with poplars `every` so many viewport widths         |
| `massif` | One standing hill, with poplars baked into the symbol                       |
| `range`  | One massif per peak, from a pool of six, on a continuous shoulder profile   |
| `cloud`  | The cloud sea: a flat deck with lopsided billows                            |

Regions overlap, so an edge is a change of density rather than a seam: where the
woods thin, the meadow is already underneath them. `fill` overrides the colour
rung; it is used where the cloud sea must be paler than the rock behind it.

`WATER` is one shape: a river whose width is keyed to its height above the
horizon (linear perspective), easing onto the lake's centreline at the mouth, and
a superellipse lake with a wavering far shore.

### Generation and validation

```bash
pnpm terrain               # regenerate and validate
pnpm terrain -- --preview  # also write flattened SVGs to .terrain-preview/
```

The generator is deterministic: the same config and seeds produce the same
shapes on every machine. CI runs `pnpm terrain`, then
`git diff --exit-code src/content/terrain.generated.ts`; a diff means the
committed asset is stale relative to its source.

Validation covers:

- rows recede, and the floor between consecutive rows is at least `3.5` scene
  units;
- the near row's ground line does not pass `nearBase`;
- nothing in the near row stands above `NEAR_TOP`, so it never meets hero copy;
- the water lies between row 2's ground line and the near ground line;
- every symbol stays inside its viewBox;
- no line-only subpath intersects itself.

The preview writes `panorama.svg` (the whole trail at the design aspect) and a
laptop and phone frame for every station, flattened by `renderWindow` in
`scripts/lib/terrain-render.mjs`. `scripts/generate-og.mjs` uses the same
renderer to draw the social card from the Home window.

## Static and failure paths

`src/components/landscape/LandscapeStatic.tsx` renders one composed frame with
no hooks and no pathname dependency beyond an optional `pathname` prop. It is:

- the fallback inside `ClientBoundary` if the animated landscape throws;
- the scene on the 404, which cannot use the client landscape reliably;
- deliberately not a `Landscape` variant behind a flag, so the fallback cannot
  throw a second time while handling the first.

It parks the panorama at the station with a static `translateX`, and paints
depth 2 to 4 in the far band, the water after depth 2, and depth 1 in the near
band, matching the animated paint order.

It is a `'use client'` module even though it has no hooks. The layout passes it
as the error boundary's `fallback`, and as a server component its whole
panorama was serialised into the RSC payload of every page and every client
navigation. As a client module the payload carries a reference, and it still
server-renders to HTML, so the 404 keeps its no-JS floor.

`global-error.tsx` cannot use it because that boundary replaces the root layout
and has no global styles; it is a separate inline-styled document.

## Reduced motion and accessibility

- `useReducedMotion()` collapses vertical travel to zero and makes the pan spring
  jump rather than animate.
- The global CSS block also cuts animations and transitions to `0.01ms`.
- Touch swipe is optional; the nav sheet is the WCAG 2.5.1 single-pointer
  alternative.
- The landscape is `aria-hidden`; no information is carried only by terrain.
- Both fixed bands are `pointer-events-none`.
- The orb is decorative and is not the theme control. At `2.52:1` in light mode
  it is not a legal UI component, which is why the theme control is a labelled
  segmented control in the header.

## Pitfalls

- Do not move `Landscape` into a page. The route change will remount it.
- Do not give depth bands different horizontal stiffness.
- Do not read `dvh` for scene positions; use `--vu`.
- Do not raise `CAMERA.nearBase`, `BODY_VU` or `CONTENT_OFFSET_DVH` in isolation.
- Do not edit `terrain.generated.ts` directly.
- Do not stand a symbol on another symbol. Positions are in viewport widths and
  sizes in scene units, so a tree placed on a hillside leaves it the moment the
  viewport changes shape. Shapes stand on their row's base; trees on a hill are
  baked into the hill's symbol.
- Do not draw something with a characteristic proportion as a profile. It will
  stretch with the viewport.
- Do not add a third fixed landscape band without checking the click and
  stacking consequences.
- Do not drive a landscape layer's vertical offset from a scroll listener or a
  bare `useTransform`; wrap it in `Travel` so it stays on the compositor.
- Do not shrink a depth band's box below `PANORAMA.bandVu`.
- Do not hide essential content in the landscape; it is decorative.
- When changing the water, keep it after depth 2 and keep its speed between
  terrain 2 and content.
