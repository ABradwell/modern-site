# Design system

The visual system is deliberately small: a five-colour source palette, a
semantic token layer, one type scale for body copy, two corner radii, a short
z-index scale and one motion language. This document describes the rules and
where they are enforced.

Most values live in:

- `src/app/globals.css` — colour tokens, theme layers, radii, shadows, scene
  units, base styles, reduced motion.
- `src/lib/type.ts` — body type scale.
- `src/lib/z.ts` — global and scene stacking.
- `src/lib/motion.ts` — reveal and travel constants.
- `scripts/check-contrast.mjs` — measured contrast pairs and terrain ramp checks.

## Colour

### Source palette

Two hue families, warm earth at 54-75 degrees and green at 119-123 degrees. Max
chroma across the set is `0.070`, so no gradient built from these values can go
neon.

```css
--earth-900: #7f5539; /* brown */
--earth-600: #a68a64; /* tan */
--earth-100: #ede0d4; /* cream */
--moss-500: #656d4a; /* sage */
--moss-700: #414833; /* moss */
```

Derived values include `--earth-050` (lifted cream), several earth and moss
rungs, `--ink-soft`, `--paper-soft`, and the one warm red pair `--brick-700` /
`--brick-400`. The red is pulled toward the earth family so it does not read as a
foreign hue.

### Token layers

`globals.css` has three layers:

1. **Raw ramps** — named source colours and derived values. Components never
   reference these.
2. **Semantic layer** — shadcn-compatible names (`--background`, `--foreground`,
   `--card`, `--primary`, `--muted`, `--border`, `--ring`, etc.) plus site-only
   scene tokens (`--sky-high`, `--terrain-1`…`--terrain-4`, `--water`,
   `--logo-ink`, `--grain-opacity`, `--shade-1`, `--shade-2`).
3. **Tailwind theme** — `@theme inline` maps the semantic variables to utility
   names.

`inline` is load-bearing. Without it Tailwind resolves each variable at the point
of definition and freezes the light value into the generated utility, so
`bg-background` would stop following `[data-theme='dark']` while still looking
wired up.

### Three theme states

| State           | Selector                                                      | Purpose                                  |
| --------------- | ------------------------------------------------------------- | ---------------------------------------- |
| Light           | `:root`, `[data-theme='light']`                               | Explicit light                           |
| Dark            | `[data-theme='dark']`                                         | Explicit dark                            |
| System fallback | `@media (prefers-color-scheme: dark) :root:not([data-theme])` | No-JS readers before an attribute exists |

`next-themes` writes `data-theme` before paint. The `dark` Tailwind variant is
redeclared to follow that attribute, with the media query only as a no-JS
fallback. Do not replace this with the default Tailwind media-query dark mode:
the theme control would stop working.

### Measured roles

These are not taste calls; they are contrast decisions.

| Colour             | On        | Ratio     | Use                                                          |
| ------------------ | --------- | --------- | ------------------------------------------------------------ |
| `#414833`          | `#ede0d4` | `7.37:1`  | Light foreground / body text                                 |
| `#5c6444`          | `#ede0d4` | `4.82:1`  | Light muted foreground                                       |
| `#ede0d4`          | `#202417` | `12.23:1` | Dark foreground                                              |
| `#b9b2a4`          | `#202417` | `7.52:1`  | Dark muted foreground                                        |
| `#656d4a` on cream | —         | `4.22:1`  | Fails AA for text; terrain fill only                         |
| `#a68a64` on cream | —         | `2.52:1`  | Fails even large text; sun, dark accent fill, hairlines only |

`#656d4a` is retired from text. `#a68a64` is never a text colour, and it is why
the orb cannot double as a UI control in light mode.

`scripts/check-contrast.mjs` contains 25 transcribed foreground/background pairs
(13 light, 12 dark), each with its WCAG floor. It also checks:

- the terrain ramp is monotonically lighter from near to far in both themes;
- dark `terrain-1` is darker than the dark background.

The script is a mirror of `globals.css`, not a live parser. If you change a token
in CSS, update the corresponding hex in the script or the check stops meaning
anything. The README's "26 shipped pairs" is stale; the array has 25.

### Terrain colours

Terrain is decorative and has no text-contrast floor. The only rule is monotonic
lightness from near to far, which preserves the depth illusion. In light mode
the ramp runs moss to earth; in dark mode it runs near-black to a slightly lifted
moss. Dark `terrain-1` is intentionally darker than the page surface so that
where the near layer passes over content it reads as shadow.

### Border and surface rules

- Borders are low-alpha `--border` or `--border-strong`, never a solid mid-grey.
- Cards use `--card`; most sections sit directly on `--background`.
- `color-mix(in oklab, var(--background) 82%, transparent)` is used for the
  header surface.
- The logo ink is `--logo-ink`, not brand colours. Every mark takes
  `currentColor`; a wall of brand hexes would read as breakage next to the
  palette.

## Typography

Fonts: Geist Sans (`--font-geist-sans`) for UI and prose, Geist Mono
(`--font-geist-mono`) for chips, dates, numbers and small technical marks.

The body scale is four steps from `src/lib/type.ts`:

| Token         | Classes                     | Use                                        |
| ------------- | --------------------------- | ------------------------------------------ |
| `PROSE`       | `text-lg leading-relaxed`   | Section paragraphs and the main argument   |
| `PROSE_TIGHT` | `text-base leading-relaxed` | Card copy, caveats, dense lists            |
| `META`        | `text-sm leading-relaxed`   | Labels, dates, locations, supporting lines |
| `CHIP`        | `font-mono text-xs`         | Technology marks and tiny metadata         |

`TAG` adds the bordered, `rounded-sm` technology chip treatment used on role
stacks. It is deliberately not the shadcn `Badge`, which is pill-shaped.

Headings, nav and buttons sit outside the body scale. They have their own
responsive ramps. Controls stay at `text-sm` across the site so a link does not
change size depending on which section it lands in.

Global base styles:

- `h1, h2, h3 { text-wrap: balance }`
- `p { text-wrap: pretty }`
- `time` and `.tabular` use tabular figures.
- Display headings use `tracking-tighter`; the home hero overrides line-height
  to `1.08` to avoid clipping the descender in "Stevenson Bradwell".

Text measures: long prose is generally capped at `62-65ch`; hero subtext at
`46ch`; card copy at `58-62ch`.

## Shape, elevation and layout

Two radii for the whole site:

- controls: `--radius-ctl` = `8px` (`0.5rem`)
- cards: `--radius-card` = `12px` (`0.75rem`)

Tailwind's `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl` and
`rounded-3xl` are remapped to those values, which pulls the shadcn components onto
the same shape system without editing each file. There are no pill shapes.
`rounded-full` is reserved for genuinely circular things such as the orb and
small dots.

Elevation is quiet and mostly unnecessary. `shadow-soft` and `shadow-lift` are
low-opacity, small-offset tokens; the page is grouped by hairlines and space, not
floating cards.

Layout constants:

- maximum content width: `1400px`
- page gutter: `16px` (`px-4`), `32px` at `md` (`md:px-8`)
- header height: `64px` (`h-16`)
- section padding: `py-12` at every breakpoint
- section heading gap: `mt-10 md:mt-14`
- hero: `min-h-[var(--scene)] pt-28`, copy in a 7/12 column at `md` and 6/12 at
  `lg`
- content start: `CONTENT_OFFSET_DVH = 20` below a full-scene hero, giving an
  absolute `120` scene units

Do not add a second max-width or a bespoke page gutter without checking the
header, footer and `Section` component together.

## z-index

The global scale is in `src/lib/z.ts`:

| Token           | Value | Owner                                   |
| --------------- | ----- | --------------------------------------- |
| `landscapeFar`  | `0`   | Sky, haze, orb, depths 4-2, water       |
| `content`       | `10`  | Page content, footer                    |
| `landscapeNear` | `30`  | Depth 1; must be `pointer-events-none`  |
| `header`        | `40`  | Fixed site header and trail nav         |
| `overlay`       | `50`  | Mobile nav sheet                        |
| `grain`         | `60`  | Fixed film grain, `pointer-events-none` |

There is a separate `SCENE_Z` for local stacking inside the landscape. It never
leaks to the page and starts from zero again. The skip link uses `focus:z-[70]`
because it must be above the grain when focused.

Do not add arbitrary z-index utilities. If a new layer needs a slot, add it to
the documented scale and explain why.

## Motion

The site has one advanced composition (the landscape) and one reveal language.

### Reveal

`src/components/system/reveal.tsx` uses Motion's `whileInView`:

- duration `0.6s`
- offset `12px`
- stagger `0.08s`
- ease `[0.16, 1, 0.3, 1]` (expo-out)
- viewport `{ once: true, amount: 0.3 }`

The reveal exists to establish reading order, not perform. Do not add looping
ambient animation to page content.

### Pan and depth

The landscape pan is one overdamped spring shared by every depth band. Vertical
travel uses the `SPEED` table. See [`landscape.md`](landscape.md).

### Reduced motion

- Motion islands call `useReducedMotion()` and collapse transforms or jump the
  spring.
- `globals.css` also reduces CSS animation/transition duration to `0.01ms` and
  sets `scroll-behavior: auto`.
- The mobile swipe is optional; no content depends on it.

## Accessibility defaults

The site has a hard accessibility floor, not an aspiration.

- First focusable element: `SkipLink` to `#content`; `<main>` has
  `tabIndex={-1}` so Safari actually moves focus.
- Every page has one `h1` with `id="station-title"`, used as the hero's
  `aria-labelledby`.
- `Section` uses the heading id for both `aria-labelledby` and the anchor target;
  `scroll-mt-24` clears the fixed header.
- Every section heading gets a focusable permalink that appears on hover/focus.
- Focus visible is a 2px `--ring` outline with 2px offset.
- Icon-only decorations are `aria-hidden`; names are set in text beside marks.
- The nav marker is `aria-hidden`; the actual link carries `aria-current="page"`.
- Mobile nav is a Radix dialog/Sheet, which supplies focus trap, escape, scroll
  lock and focus return.
- External links that open a new tab announce it in visually hidden text where
  needed.
- The landscape is decorative and `aria-hidden`; no content is carried only by
  colour or terrain.
- The theme control is a labelled `radiogroup` with words, not an icon toggle,
  so its state is exposed and its contrast can clear `3:1`.

### Contrast check

Run `node scripts/check-contrast.mjs` after any palette or token change. It exits
non-zero on failure. It does not read CSS automatically; update both files
together.

## When adding UI

1. Use semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`)
   rather than raw hex values.
2. Use `PROSE`, `PROSE_TIGHT`, `META` or `CHIP` for body copy instead of a new
   arbitrary `text-[...]`.
3. Use `rounded-ctl` or `rounded-card`. Do not introduce pills.
4. Use a z token from `lib/z.ts`.
5. Add a visible focus state and a real accessible name.
6. Respect reduced motion.
7. Check both themes by toggling the theme control, not just by changing the OS.
8. Run the contrast check if colour is involved.
9. If the element is fixed, pointer-events-none or scenically positioned, verify
   that it does not cover type or swallow clicks.
