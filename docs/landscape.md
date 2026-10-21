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

Every terrain `bottom`, `crest`, haze offset, sky height, hero height and content
offset reads from `--vu`. If you add a scene-positioned element, use `--vu`.

## Horizontal travel: one strip, one spring

`src/lib/station-geometry.ts` owns the geometry:

| Constant        | Value                   | Meaning                                            |
| --------------- | ----------------------- | -------------------------------------------------- |
| `GUTTER_VW`     | `16`                    | Transition width between stations                  |
| `SPAN_VW`       | `100 + 16 = 116`        | Distance travelled per station                     |
| `SLOT_VW`       | `100 + 2 * 16 = 132`    | Each station's painted slot, including both bleeds |
| `STRIP_VW`      | `STATIONS.length * 116` | Total strip width; `464` with four stations        |
| `SEAM_RAMP_PCT` | `16 / 132 * 100`        | The fade ramp as a percentage of one slot          |

`panTarget(index)` is `-stripPct(index * SPAN_VW)`: a percentage of the strip
element that places station `index` in the viewport. With four stations, each
step is `116 / 464 = 25%` of the strip.

### The gutter

Stations do not butt-joint. Each station is one viewport of content followed by a
16vw gutter. A station's terrain bleeds east across its own gutter; the next
station reaches back west across the same gutter and fades in. The east station
ramps from transparent to opaque over the top of the west station, which is
fully opaque underneath. Coverage is exactly 1 everywhere and colours
interpolate rather than step.

The fade is one-sided, not a double-sided cross-fade. Two ramps meeting at 50%
would composite two half-opaque layers to 75% rather than 100% and leave a pale
band at every join.

At rest, a station's window is bounded by its neighbours' slot edges on both
sides, so exactly one biome is visible. The blend exists only while travelling.

### The spring

`PAN_SPRING` in `src/lib/motion.ts` is:

```ts
{ stiffness: 72, damping: 26, mass: 1 }
```

Damping ratio is about `1.53`, comfortably overdamped, so a full-viewport slide
settles without bouncing. Stiffness was lowered from 80 when the gutters went in:
a station is now 116 viewports of travel rather than 100, and the lower stiffness
keeps the felt speed roughly where it was.

Every depth band uses this one spring. Per-depth horizontal stiffness was tried
and rejected: it reads as the world coming apart on a full-viewport slide and
caused motion sickness. Depth is expressed vertically instead.

There is one strip per depth, not one per band. Each depth is a `DepthBand`: a
`Travel` layer for its vertical speed, holding a `PanStrip` with that depth's row
for every station. In a gutter, each row therefore fades into the matching row of
the next biome, and a far ridge never paints over a nearer row from the west.

The strip is `position: absolute` rather than flexed because slots must overlap
in the gutters, and later stations must paint over earlier ones in DOM order.
The fade is a mask on each slot, using `mask-repeat: repeat-y` so the slot mask
also covers the near band's body below the one-viewport slot box.

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
| Water           | `0.96`  | River in the ground plane in front of row 2           |
| Page content    | `1.00`  | Normal document flow                                  |
| Terrain depth 1 | `1.08`  | Near treeline; overtakes content to close its overlap |

Rules that follow from the table:

- The nearest band is fastest, so parallax increases toward the viewer.
- Every band except depth 1 is slower than content, so content gradually rises
  and covers the scene. That is "the page comes up out of the landscape."
- Depth 1 is slightly faster than content because it is painted in front. Its
  overlap with the top of the content block must close as the reader scrolls,
  not sit permanently on the page.
- The river must be painted after depth 2 and travel at `0.96`. It lies in the
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
band, any motion repainted every SVG mask in the band at device pixel ratio on
every frame, which is what made the scene judder on slower GPUs.

Each depth band's box is `BAND_DEPTH_VU` deep, the lowest ground line plus
`BODY_DVH` (130 scene units today). It has to contain every row, because the
seam mask on each slot clips to the slot's box and the slot travels with its
depth. A one-viewport box cuts the near body off along a hard line once the
reader scrolls.

## Terrain bands and masks

Each biome has four layers, each with a generated SVG path tile. The layer is
rendered as a CSS mask over a background-coloured `div`, not as inline SVG. That
lets one asset serve both themes: the mask only cares about alpha, and colour
comes from `--terrain-N` on the element.

`src/components/landscape/terrain-mask.ts`:

- `BODY_DVH = 24` — solid/faded body below a layer's ground line.
- `SOLID_TO = 0.4` — the first 40% of the body stays solid before the dissolve.
- The body extends `crest + BODY_DVH` below the top of the layer.
- The layer top is `bottom - crest`; its ground line is `bottom`.
- The depth-1 `bottom` is capped at `106` by `CAMERA.nearBase`, so the near band
  reaches `106 + 24 = 130` scene units. Page content begins at an absolute `120`
  (`CONTENT_OFFSET_DVH = 20` below the full-scene hero).

The mask is two layers combined with `mask-composite: add`:

1. The SVG tile at `auto <crest>`, repeating horizontally.
2. A vertical gradient below the crest that fades out at the body floor.

The `1px` overlap between the tile and the gradient prevents a rounding hairline.

Two CSS rules are load-bearing:

- **Never use `preserveAspectRatio="none"` on a mask tile.** It removes the
  intrinsic aspect ratio that `mask-size: auto <height>` needs to derive width,
  and every silhouette silently distorts.
- **Never set `-webkit-mask-composite`.** It uses different keywords and can
  override the standard property. Use the standard `maskComposite`.

## The camera and generated terrain

Terrain is generated, not hand-drawn. `src/content/terrain.generated.ts` is
committed and must not be edited by hand.

`scripts/lib/terrain-config.mjs` defines:

| Constant           | Value        | Meaning                                    |
| ------------------ | ------------ | ------------------------------------------ |
| `CAMERA.horizon`   | `58`         | Ground-plane vanishing line in scene units |
| `CAMERA.nearBase`  | `106`        | Nearest row's ground line                  |
| `CAMERA.recession` | `0.74`       | Ground-line spacing / camera angle         |
| `REFERENCE`        | `1440 x 900` | Viewport for build-log geometry            |

Ground lines use
`horizon + (nearBase - horizon) * recession ** i`. With the current camera the
forest's four rows sit at `106 / 93.5 / 84.3 / 77.4` scene units. The near row is
capped at `106` so its body can clear the content start.

The four bands have fixed viewBox ratios, deliberately non-integer so repetition
does not phase into a visible beat:

| Depth | ViewBox      | Ratio  |
| ----- | ------------ | ------ |
| 1     | `792 x 240`  | `3.30` |
| 2     | `1032 x 240` | `4.30` |
| 3     | `1272 x 240` | `5.30` |
| 4     | `1536 x 240` | `6.40` |

`nearCrest` is the authored near silhouette height. Each row's apparent crest is
`nearCrest * recession ** i * lift`, where `lift` is an explicit departure from
strict perspective for mountain ranges. Forest rows use no lift because they are
one species at one height.

### Biomes and the unused foothills

`TERRAIN` currently declares five biomes:

| Key          | Label                | Used by                                   |
| ------------ | -------------------- | ----------------------------------------- |
| `forest`     | Forest               | `/`, and the fallback for off-trail paths |
| `plains`     | Plains               | `/skills`; includes a river               |
| `foothills`  | Foothills            | Nothing; generated but unreferenced       |
| `mountains`  | Mountains            | `/projects`                               |
| `abovecloud` | Above the cloud line | `/articles`                               |

`foothills` remains in `terrain-config.mjs` and in the generated file. It costs
about a fifth of the generated asset and nothing at runtime because only biomes
named by `STATIONS` are mounted. It is kept as the obvious home for a fifth
station.

`BiomeKey` is generated from the keys of `TERRAIN`, so adding a biome means
adding a `BIOMES` entry, running the generator, and then referencing the key in
`STATIONS` if it should be mounted.

### Generation and validation

```bash
pnpm terrain            # regenerate and validate
pnpm terrain -- --preview  # also write SVGs to .terrain-preview/
```

The generator is deterministic: the same config and seeds produce the same
paths on every machine. CI runs `pnpm terrain`, then
`git diff --exit-code src/content/terrain.generated.ts`; a diff means the
committed asset is stale relative to its source.

Validation covers:

- tile starts and ends on its baseline so the repeat is seamless;
- paths stay inside the viewBox;
- no self-intersecting line subpaths;
- each row either leaves a visible ground strip or clears the nearer summit;
- rows recede monotonically and the near row does not pass the cap;
- rendered tile repeat count stays below `3.2` across the reference viewport.

The build log also reports the rendered element aspect. Conifer bands should
stay near `2.4`; that is what keeps a distant tree the same shape as a near one
rather than a squashed copy.

## Static and failure paths

`src/components/landscape/LandscapeStatic.tsx` renders one composed frame with
no hooks and no pathname dependency beyond an optional `pathname` prop. It is:

- the server-rendered fallback inside `ClientBoundary` if the animated landscape
  throws;
- the scene on the 404, which cannot use the client landscape reliably;
- deliberately not a `Landscape` variant behind a flag, so the fallback cannot
  throw a second time while handling the first.

It paints depth 2-4 in the far band, the river after depth 2, and depth 1 in the
near band, matching the animated paint order.

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
- Do not raise `CAMERA.nearBase`, `BODY_DVH` or `CONTENT_OFFSET_DVH` in isolation.
- Do not edit `terrain.generated.ts` directly.
- Do not add `preserveAspectRatio="none"` or `-webkit-mask-composite`.
- Do not add a third fixed landscape band without checking the click and
  stacking consequences.
- Do not drive a landscape layer's vertical offset from a scroll listener or a
  bare `useTransform`; wrap it in `Travel` so it stays on the compositor.
- Do not shrink a depth band's box below `BAND_DEPTH_VU`.
- Do not hide essential content in the landscape; it is decorative.
- When changing the river, keep it after depth 2 and keep its speed between
  terrain 2 and content.
