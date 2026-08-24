# aidenbradwell.com rebuild: a five-stage landscape portfolio

## Context

The current site at aidenbradwell.com is a Node/Express app with Jade templates and a
PostgreSQL backend. It works, but it carries real problems: the homepage ships an empty
shell and injects everything over three XHR calls so nothing renders without JS, there is
no viewport or charset meta tag, the flip-card interactions are hover-only and therefore
dead on touch devices while the page instructs the user to "tap", `routes/queries.js`
concatenates SQL and has hardcoded credentials committed to a public repo, and the work
experience section still says "2 & ½ Years In-field" which is stale by about two years.
There is no dark mode, no favicon, no OG tags, no sitemap, and no custom 404.

The replacement is a fully static React site. No database, no server, no runtime. Content
becomes typed modules in the repo, which is the right shape because the content is small,
changes rarely, and benefits from compile-time checking.

The design goal is a single idea carried the whole way through: **the site is one continuous
landscape, read west to east.** Each route is a station along it. Scrolling down at a station
lifts the terrain and lets content emerge from beneath it. Navigating between stations pans
the landscape sideways. The sun or moon overhead reflects the reader's colour scheme.

Owner decisions taken: five biomes, one per page. Current title is **Engineering Team Lead**
at zally. Projects curated to five with the 2025 music site leading. Articles lists the two
LinkedIn essays only.

---

## The journey

| Route         | Biome                | Terrain grammar           | Content                                   |
| ------------- | -------------------- | ------------------------- | ----------------------------------------- |
| `/`           | Forest               | conifer spires            | hero, featured work, short about, contact |
| `/skills`     | Plains with a river  | grass ridges + water band | technology wall by category               |
| `/experience` | Foothills            | low layered ridges        | roles, education, clearances              |
| `/projects`   | Mountain range       | high jagged ridges        | five projects                             |
| `/articles`   | Above the cloud line | cloudbank                 | two essays, honest note on what is coming |

Forward travel pans the terrain left. Back travel pans it right. Direction derives from the
station index, so the browser back button reverses correctly without special casing.

---

## Stack

Next.js 16 App Router with `output: 'export'`. Chosen over Vite for four reasons that each
cost real work otherwise: `next/font` is mandated by the governing design skill and emits
`size-adjust` fallback metrics that hold CLS near zero; static export writes a real
`out/404.html` on disk, which is what makes a stylised 404 work on any host, where a Vite SPA
returns HTTP 200 for missing routes; RSC by default; and the committed `.gitignore` is
verbatim the create-next-app one, already ignoring `/out/` and `next-env.d.ts`.

What `output: 'export'` gives up, honestly: no `rewrites`, `redirects`, or `headers` from
`next.config`, so security headers become a host artifact. No Server Actions, so a contact
form would need a third party. No image optimisation, so `images: { unoptimized: true }` and
we ship the bytes we author.

```
next@16.3.2  react@19.2.8  react-dom@19.2.8  motion@13.1.1
geist@1.7.2  next-themes@0.4.6  clsx  tailwind-merge  class-variance-authority
@phosphor-icons/react@2.1.10  @icons-pack/react-simple-icons@13.15.1

-D  typescript@5.9.3  tailwindcss@4.3.3  @tailwindcss/postcss@4.3.3  postcss
    tw-animate-css  eslint@9.39.5  eslint-config-next@16.3.2
    eslint-plugin-jsx-a11y@6.10.2  eslint-config-prettier@10.1.8
    prettier@3.9.6  prettier-plugin-tailwindcss@0.8.1
    husky@9.1.7  lint-staged@17.3.0
```

Three version pins are forced, not preference. `eslint-plugin-jsx-a11y@6.10.2` is the latest
published and peers `eslint ^9`, so ESLint stays on 9. `typescript-eslint@8.67.0` (pulled in
by `eslint-config-next`) peers `typescript >=4.8.4 <6.1.0`, so TypeScript stays on 5.9.3 even
though `latest` is 7.x. `eslint-plugin-jsx-a11y` must be a **direct** devDependency despite
`eslint-config-next` already depending on it, because pnpm's isolated `node_modules` will not
resolve a transitive dep from our own config file. Re-verify all versions at install time.

**No GSAP.** The design skill hard-bans mixing GSAP with Motion in one tree, the rest of the
site needs Motion for section reveals, and nothing here needs pinning. One driver, one path.

### Component library

shadcn/ui, on Radix primitives. The dependency actually being bought is **Radix UI**, which
supplies the focus trap, escape handling, ARIA wiring, scroll lock and collision-aware
positioning. That is the wheel, and we are not rebuilding it. shadcn is the themed layer
copied into the repo on top. Note this in the README so it never reads as a shortcut.

Add eight: `button card badge accordion tabs tooltip sheet skeleton`. The highest-value one
is `sheet`, for the mobile nav drawer, because a hand-rolled drawer is where portfolios fail
accessibility. Skip `navigation-menu` (heavy machinery for five flat links), `separator`
(group with `border-t` instead), `dropdown-menu`, and `sonner` (nothing submits).

Rejected: Radix Themes, Mantine and Chakra each ship a second token system that would fight
Tailwind v4 and require overriding nearly everything. MUI is Emotion runtime CSS-in-JS
needing a client provider high in the tree, which contradicts RSC-by-default.

---

## Design tokens

Two hue families, verified: warm earth at 54 to 75 degrees (brown, tan, cream) and green at
119 to 123 degrees (sage, moss). Max chroma across the set is 0.070, so the low-chroma and
sub-80-percent-saturation rules hold for free and no gradient here can go neon.

The warm family is the accent ramp, the green family is surface and ink. Light mode accent is
brown `#7F5539`; dark mode accent is tan `#A68A64`. One accent at two lightnesses, not two
accents.

Measured contrast decides three role assignments that are not negotiable:

- `#414833` on `#EDE0D4` is 7.37:1. Primary text, both AAA.
- `#656D4A` on `#EDE0D4` is 4.22:1, which **fails AA body**. Retired from all text duty.
  Survives as a terrain fill, which has no contrast floor.
- `#A68A64` on `#EDE0D4` is 2.52:1, failing even the 3:1 large-text floor. **Never a text
  colour anywhere.** It becomes the sun disc, dark-mode accent fill (4.86:1 on `#202417`,
  which clears AA), and hairlines.

Derived values, computed rather than guessed: light secondary text `#5C6444` at 4.82:1 on
cream; dark surface `#202417` with cream at 12.23:1; dark elevated `#2B3021`; mixing anchor
`#0F1109`, never painted, because pure black is banned.

Structure in `src/app/globals.css`, three layers:

1. Raw ramps in `:root`, never consumed by components.
2. Semantic layer for `:root`/`[data-theme="light"]` and `[data-theme="dark"]`, plus a
   `:root:not([data-theme])` block inside `@media (prefers-color-scheme: dark)`. That guard
   is what gives three theme states without specificity games: no attribute means follow the
   system.
3. `@theme inline { --color-surface: var(--surface); ... }`.

**The `inline` keyword is load-bearing.** Without it Tailwind resolves the variable at
definition and freezes the light value into the utility, so `.dark` never reaches
`bg-surface`. Dark mode looks wired up and silently does nothing.

Also required in v4: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
because `dark:` defaults to `prefers-color-scheme` in v4 and will otherwise ignore the
toggle. Do not declare `--breakpoint-*`; v4's defaults already match the mandated scale and
declaring them **replaces** rather than extends.

Express the palette through shadcn's expected variable names (`--background --foreground
--primary --muted --border --ring --radius` and the rest) rather than alongside them, or every
shadcn component renders unthemed. Site-only extras (`--canopy-1..4`, `--orb`, `--sky-*`,
`--logo-ink`) sit next to them.

Shape lock: `--radius-card: 12px`, `--radius-ctl: 8px`, nothing pill. Shadows tinted to the
ink hue at alpha under 0.05, never neutral black. Hairlines are `color-mix` of the ink hue at
12 to 14 percent, so they read as a fold in paper rather than a grey border.

Type: **Geist and Geist Mono** via the `geist` npm package, not `next/font/google`. The
package vendors the files into `node_modules`, so the build is deterministic and works
offline, where `next/font/google` puts a network dependency on `fonts.googleapis.com` into
every build. No serif anywhere: the skill names "creative brief equals serif" as its most
tested AI tell, and a developer portfolio does not qualify for the editorial exception.

---

## The landscape system

This is the centrepiece and the part most likely to be got wrong, so it is specified fully.

### Persistence

The landscape lives in the **root layout**, not in any page. App Router preserves layout
state across navigation within the same layout, so the component never unmounts and the pan
is genuinely continuous rather than a simulated crossfade.

`src/components/landscape/Landscape.tsx` (`'use client'`) returns two sibling fixed divs from
a fragment, not a wrapper. A wrapper with a transform would trap `position: fixed` children
in its own containing block.

```
z 0    <div fixed> sky gradient, haze, orb, terrain depth 4 and 3
z 10   <main>   page content
z 30   <div fixed> terrain depth 2 and 1, pointer-events-none
z 40   <header> trail nav
z 50   mobile sheet
z 60   grain, fixed, pointer-events-none
```

The z-scale lives in `src/lib/z.ts` as a const object. No arbitrary `z-50` anywhere.

`pointer-events-none` on the near band is mandatory. Without it the terrain swallows every
click in the top third of every page. This is the single easiest way to ship this broken.

### Vertical parallax, within a station

Motion `useScroll` + `useTransform` against the hero element, `offset: ['start start', 'end
start']`, `layoutEffect: false` so the first measurement stays off the pre-paint path and does
not touch LCP. Values are written straight to `style` outside the React render cycle, so
`useState` never holds a continuous value.

Everything translates **up**. Depth is how much of the scroll each layer cancels: front
layers cancel least and so move fastest. Content cancels nothing, so it moves fastest of all
and emerges from beneath the near terrain.

| Layer         | translateY at progress 1 | Opacity                  |
| ------------- | ------------------------ | ------------------------ |
| sky, orb      | +52vh                    | constant                 |
| haze band     | +38vh                    | 1 to 0.55 over 0.55 to 1 |
| copy block    | +14vh                    | 1 to 0 over 0.30 to 0.72 |
| depth 4, far  | +27vh                    | constant                 |
| depth 3       | +19vh                    | constant                 |
| depth 2       | +12vh                    | constant                 |
| depth 1, near | +6vh                     | constant                 |
| `<main>`      | none                     | n/a                      |

Near against sky is 46vh of relative travel, which is the effect. Near against far is 21vh,
which is what makes it read as depth rather than a decal. Terrain opacity stays constant:
fading a silhouette produces ghosting where sky shows through the trees.

"Content beneath the trees" is **paint order, not animation**. The near band is fixed at z 30
above `<main>` at z 10, and its terrain bottoms sit below the viewport fold. Nothing is
repositioned to create the overlap. `<main>` carries `pt-[38dvh]` on the landing page so no
real content is ever permanently hidden.

Headline legibility over the sky, computed: moss on the sky gradient runs 8.37:1 at the top
to 5.51:1 at the horizon, and the copy block sits entirely in the 7.37-and-above zone.
**No scrim, overlay, or text-shadow is needed anywhere.** Most scene heroes need one. This
palette does not, and that is worth stating because it is the reason the composition works.

### Horizontal parallax, between stations

```ts
export const STATIONS = ['/', '/skills', '/experience', '/projects', '/articles'] as const
```

Each of the four depth strips is `500vw` wide, holding five biome segments side by side, and
all four target the same offset: `-index * 100vw`. Horizontal parallax comes from **staggered
spring stiffness**, not from different targets:

| Strip         | stiffness | damping | behaviour    |
| ------------- | --------- | ------- | ------------ |
| depth 1, near | 90        | 22      | snaps past   |
| depth 2       | 74        | 22      |              |
| depth 3       | 60        | 22      |              |
| depth 4, far  | 48        | 22      | drifts       |
| sky, orb      | 40        | 24      | barely moves |

Because every strip converges on the same value, the biomes are **perfectly aligned at rest**
and only diverge mid-transition. Near terrain sweeps past while distant mountains barely
shift, which is exactly how parallax works in the world. This is the whole trick and it costs
four animated transforms.

Page content fades in keyed on `pathname`, **entry only, no exit animation**. Exit animations
under App Router fight the router's own child swap and produce jank. The landscape pan is what
carries the transition; the content just arrives.

### Terrain authoring

Four grammars, parameterised twenty ways, not twenty hand-drawn silhouettes:

- `conifers()` sharp asymmetric spires, drooping boughs, occasional dead flat-topped snag
- `grassland()` low soft undulation, plus `river()` for the water band
- `ridge()` angular peaks, with roughness and height as parameters so foothills and mountains
  are the same function at different settings
- `cloudbank()` pure quadratic rounded mass, no individual tips at all

`scripts/generate-terrain.mjs` runs these with a fixed-seed xorshift PRNG and writes
`src/content/terrain.generated.ts`, committed. Deterministic output means zero runtime cost,
no hydration mismatch, and a reviewable diff.

Complexity budget falls with distance: roughly 110 path commands at depth 1 down to about 31
at depth 4. That is correct atmospheric perspective and correct performance discipline at the
same time.

Delivery is a **CSS mask on a background-coloured div**, not an inline `<svg>`:

```css
mask-image:
  url('data:image/svg+xml,...tile...'),
  linear-gradient(to bottom, #000 0 76%, transparent 100%);
mask-size:
  auto var(--crest),
  100% calc(100% - var(--crest) + 1px);
mask-repeat: repeat-x, no-repeat;
mask-composite: add;
```

`mask-size: auto <length>` is the answer to tiling. The explicit height comes from `--crest`
and `auto` derives width from the viewBox ratio, so the tile scales proportionally and repeats
to fill any width with zero distortion, with crest height decoupled from viewport width.

Both obvious alternatives fail and it is worth recording why. `preserveAspectRatio="none"`
stretches, turning conifers into fat cones at 1920px and needles at 375px.
`preserveAspectRatio="xMidYMax slice"` behaves like `background-size: cover` and crops the
tree tips off at wide viewports, making the composition width-dependent.

Tile widths are deliberately coprime-ish (640 / 700 / 880 / 760) so the four layers never
re-phase into a visible wallpaper repeat at any viewport width.

Because colour lives entirely in `background-color`, dark mode is free: same mask, different
token, no second asset and no `fill` plumbing.

The design skill strongly discourages hand-rolled decorative SVG. This invokes its stated
exception, "the brief explicitly calls for it", and the exception genuinely applies: the brief
specifies the treeline twice, no image-generation tool exists in this environment, and
photography cannot deliver four independently parallaxing silhouette layers with token-driven
colour in two themes. Write that justification as a comment at the top of the generator so the
next reader knows it was a decision and not a default.

### The orb

A `div` with two nested radial gradients, not SVG, since there is no path here. Gradient
centre offset to 38 percent 34 percent gives it a lit side and a terminator, so it has form
instead of being a flat circle. Every stop is a mix of palette values, so chroma cannot exceed
0.070 and it cannot become a bloom by construction.

The halo is a separate element at `inset: -55%`, a single low-chroma radial at 26 percent
alpha in light and 9 percent in dark, no blur or saturation boost, same hue as the disc. That
is atmospheric scatter, not the banned neon glow, which is a saturated ring brighter than its
source. Label it as such in the CSS comment so it survives review.

Tan sun in light, cream moon in dark, transitioning `background` over 480ms, gated under
reduced motion. No craters, no crescent, no rays: context does the work, and each addition
would be another decorative illustration to justify.

**No ambient float or pulse.** The orb already moves, via 0.48x parallax drift, and that
motion is motivated by depth. A second infinite animation on the same element would be motion
for its own sake.

### The orb is not the theme toggle

It is tempting and it is wrong, for one measurable reason plus four supporting ones. The tan
sun is 2.52:1 against the sky. A decorative graphic has no contrast floor, but a **UI
component** requires 3:1 under WCAG 1.4.11. Attaching `onClick` converts a legal decorative
element into a failing control, in light mode only, which is the worst kind of failure to
catch. It also cannot express three states when Auto is the correct default, it is the
literal named cliché in the skill set, it scrolls out of reach at 30dvh, and it is a moving
hit target.

Note the distinction the cliché rule actually draws: it bans the sun/moon **switch**, not
celestial imagery. A decorative sky body that reflects the theme is fine.

The control is a three-state segmented radiogroup in the nav, labelled with text,
`Auto / Light / Dark`. On mobile it becomes a row in the sheet.

### No scroll-driven day-to-night flip

Worth recording because it is the obvious next idea and it is a defect. Interpolating
`--surface` from cream to moss while `--text-primary` goes the other way means the two ramps
cross. Contrast measured across the transition:

| progress | contrast           |
| -------- | ------------------ |
| 0.00     | 7.37               |
| 0.15     | 3.84 fails AA      |
| 0.25     | 2.47 fails 3:1     |
| **0.45** | **1.00 invisible** |
| 0.65     | 2.53 fails 3:1     |
| 1.00     | 12.23              |

Roughly 68 percent of the transition sits below the AA floor and about half below 3:1. Whether
a reader lands in that band depends entirely on scroll speed, so anyone who stops mid-scroll
gets unreadable text. It also overrides explicit consent: a reader who chose Light gets
dragged to Dark by scrolling. The owner asked for a sun in light and a moon in dark, and gets
exactly that, from `prefers-color-scheme` with a manual override.

### Reduced motion

`useReducedMotion()` collapses every translate range to `0vh` and every opacity range to
`[1, 1]`, so the scene renders at its resting composition and never moves. Ranges are
collapsed rather than early-returned before the hooks, which keeps hook order stable if the OS
setting is flipped mid-session. The horizontal pan becomes an instant jump with a short
crossfade. Under `prefers-reduced-motion: reduce` the orb's mode transition is also disabled.

### Mobile at 375px

Desktop composition is copy left, orb right, terrain beneath. That does not survive 375px, so
the mobile composition is declared explicitly rather than assumed: single column, orb reduced
and moved above the headline, every vertical differential halved, depth 3 dropped so three
terrain layers remain, crest heights reduced. Horizontal pan still works because it is a
translate. Page root carries `overflow-x-hidden w-full max-w-full`, which is not optional:
parallax layers overshoot and horizontal overflow on mobile is a critical failure.

Inner-page heroes are `min-h-[62dvh]`, not full height. Only the landing page is
`min-h-[100dvh]`. Never `h-screen`, always `dvh`, so the iOS Safari address bar does not cause
a layout jump.

---

## Pages and section layouts

Layout families must not repeat, and no more than two consecutive image-plus-text splits.

**`/` Forest.** Hero (full-bleed layered scene) → featured work, asymmetric 2fr 1fr split →
second work pair, inverted split, which reaches the zigzag cap → about, single column at
`max-w-[65ch]` → contact, one CTA, high negative space. Five families, two consecutive splits.

**`/skills` Plains.** The wall, grouped by category: languages, cloud, data, infrastructure,
ML, mobile. Presented as a horizontal band riding the riverline, **not** a three-column card
grid, which is banned by five of the skills, and **not** a marquee. Category rows of varying
length, each row a fixed-cell grid so marks align optically. Heading is "Technologies",
never "Trusted by": these are skills, not customers, and the trademark hygiene matters.

**`/experience` Foothills.** Roles as an accordion, ordered newest first, each with two to four
highlights maximum. Education and clearances as a compact definition list. The seven roles on
the current site collapse to the four substantial ones plus a short "also" line for the three
website-management and mentoring roles.

**`/projects` Mountains.** Five cards in an asymmetric grid with exactly five cells, no empty
tiles. Real screenshots exist on the current site for all of them and should be salvaged.
Repo links exist in the old database (`project_github_str`) but are rendered nowhere; surface
them. Note `ABradwell/Pear_Studios` does not exist on the account, so that one link must be
dropped rather than shipped broken.

**`/articles` Above cloud.** Two essays, both linking out to LinkedIn, plus one honest line
about what is coming. No fabricated entries. Nothing on this page may imply peer review:
there is no Google Scholar profile and no published paper.

### Icons and brand marks

UI icons: `@phosphor-icons/react`, one family, `weight="regular"` everywhere. Note the API is
`weight`, not `strokeWidth`. Import from `@phosphor-icons/react/dist/ssr` to keep dev compile
times sane, and verify that entry point exists in 2.1.10.

Brand logos: `@icons-pack/react-simple-icons`, MIT, zero runtime dependencies, one
tree-shakeable component per brand, and its `title` prop becomes the SVG accessible name for
free. Confined to `src/components/brand/registry.ts`, the only file allowed to import it,
which makes the one-icon-family boundary enforceable by grep.

Simple Icons path data is CC0 but the **trademarks are not**. Pin the version, because icons
have been removed on legal request before and an unpinned bump breaks a build.

Two rendering problems, and the naive answer fails both. Tinting: pass `color="currentColor"`
and drive everything from one `--logo-ink` token, which flips once per theme. Thirty brand
hexes is a rainbow, not a wall. Optical size: a single `h-8` looks broken across thirty marks
because a wide wordmark and a square glyph at equal height have very different visual weight.
Fix is a fixed cell with `grid place-items-center`, the SVG constrained by **both** `max-h`
and `max-w` so wide marks shrink rather than overflow, and an `opticalScale?: number` field on
the `Skill` type for the five or six that still read wrong. Expect to hand-tune those.

---

## Content modules

Pages are pure presentation. `src/content/{site,skills,experience,projects,articles}.ts` with
types in `types.ts`. The technique that makes this earn its keep:

```ts
export const skills = [/* ... */] satisfies readonly Skill[]
export type KnownSlug = (typeof skills)[number]['slug']
```

`satisfies` rather than a type annotation preserves literal types, so `KnownSlug` is a real
union of the actual slugs. Then `Role.stack` and `Project.stack` are typechecked against
skills that exist, and `Record<KnownSlug, BrandIcon>` in the brand registry makes adding a
technology without a logo a **build failure** rather than a blank cell on the wall.

All content is real and already gathered. Corrections to carry over: **zally is always
lowercase**; the LinkedIn URL moves from `ca.linkedin.com` to `uk.linkedin.com`; the stale
"2 & ½ Years In-field" line is dropped; typos in the old copy (`surival`, `proove`,
`post-proccessing`) are fixed; the article PDF whose filename embeds a uOttawa student number
is not carried over; GitHub (`github.com/ABradwell`) gets linked, which the current site never
does despite having the data.

---

## Error handling, SEO, accessibility

`app/not-found.tsx` renders to `out/404.html` and works on every static host. It is a Server
Component taking no props, so it cannot use `usePathname`; a small client island reads
`window.location.pathname` if we want to echo the bad URL. Its title comes from the root
layout's `metadata.title.default`.

`app/error.tsx` is a client error boundary compiled into the browser bundle, so it works
under static export. **In Next 16 the props are `{ error, retry }`, not `reset`.** Pasted
tutorial code gives a dead button.

`app/global-error.tsx` must render its own `<html>` and `<body>` and **receives no global
styles**, so inline styles only and handle `prefers-color-scheme` by hand. Tailwind classes
will not apply. Use React 19's hoistable `<title>` rather than a `metadata` export.

Skip `global-not-found.tsx`: experimental, needs a flag, and exists for apps with multiple
root layouts.

`error.tsx` replaces the **entire route segment**, so a throwing landscape would blank the
page. Every motion island gets a local class boundary in
`src/components/system/error-boundary.tsx` with a static fallback: `<Landscape />` degrades to
a single composed still frame rather than a hole.

Leave `trailingSlash` at its default `false`. The verified output is `out/404.html`, which is
exactly the filename Cloudflare Pages and GitHub Pages look for; `trailingSlash: true` may
relocate it to `out/404/index.html` and silently break the one file that was explicitly asked
for.

Metadata API in the root layout with `metadataBase` (not optional under static export, or OG
URLs stay relative and scrapers get nothing), `title.template`, `openGraph`, `twitter`,
canonical, robots, icons. `app/sitemap.ts`, `robots.ts`, `manifest.ts`. JSON-LD Person schema
with `knowsAbout` derived from `skills.ts`.

**OG image: commit a static `app/opengraph-image.png`.** The claim that
`opengraph-image.tsx` with `ImageResponse` works under `output: 'export'` does not hold up:
neither the static-exports nor the opengraph-image docs mention static export, route handlers
under export need an explicit `dynamic = 'force-static'` which that convention does not carry,
and vercel/next.js discussion #55890 reports it needs a server and is unanswered. Generate the
PNG once with a standalone script, commit it. The failure mode is silent and only visible when
someone shares the link, so the postbuild check asserts it exists.

Skip link as the first focusable element, paired with `<main id="content" tabIndex={-1}>`. The
`tabIndex={-1}` is what actually moves focus in Safari. One `--ring` token,
`focus-visible:outline-2 outline-offset-2`, never `outline-none` without a replacement.
`<header><nav aria-label="Primary">`, `<main>`, `<footer>`, one `<h1>` per page, every section
`aria-labelledby` a real heading.

Next 16 removed automatic `scroll-behavior: smooth`, so anchor navigation needs
`data-scroll-behavior="smooth"` on the document.

No contact form. `output: 'export'` has no Server Actions and a decorative form that cannot
submit is worse than a mailto link.

---

## Tooling

`eslint.config.mjs`, flat config: `eslint-config-next/core-web-vitals`, then
`eslint-config-next/typescript`, then `jsxA11y.flatConfigs.strict`, then local rules, then
`eslint-config-prettier/flat` **last** so its disables win. Use the `/flat` specifier, not the
bare package path. Do not add `eslint-plugin-prettier`.

Prettier with `prettier-plugin-tailwindcss`, `tailwindStylesheet: "./src/app/globals.css"`
(the v4 option that replaced v3's `tailwindConfig`, since `@theme` now lives in CSS) and
`tailwindFunctions: ["cn", "cva"]`, without which every class string inside `cn()` goes
unsorted.

husky 9 plus lint-staged. Chosen over `lefthook`, whose postinstall downloads a Go binary and
so collides with pnpm 10's build gate, and over `simple-git-hooks`, which silently needs
re-running when hook config changes.

```
.husky/pre-commit   pnpm lint-staged
.husky/pre-push     pnpm lint
```

The pre-push hook is load-bearing, not belt-and-braces: **`next lint` was removed in Next 16
and `next build` no longer lints.** Without this, lint errors reach `main` silently.

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"]
}
```

ESLint fixes first so Prettier has the final say. `--max-warnings=0` matters because most
jsx-a11y findings surface as warnings and would otherwise not block a commit.

**pnpm 10 build gate.** Husky needs no approval: it has no install or postinstall script, and
pnpm blocks dependencies' scripts, not the root project's own `prepare`. The package that
**does** get blocked is `unrs-resolver`, reached via `eslint-config-next` →
`eslint-import-resolver-typescript`, and leaving it unapproved breaks ESLint's import
resolution. Run `pnpm install` once, read the "Ignored build scripts" warning, and pin exactly
that list in `pnpm.onlyBuiltDependencies`. Note in a comment that this key is replaced by
`allowBuilds` in pnpm 11.

Add `.npmrc` to `.gitignore`. This machine's global pnpm config carries an AWS CodeArtifact
auth token and private scoped registries, and a project `.npmrc` is an easy accidental
credential leak. Put pnpm settings in `package.json` instead. Also add `.env*` and `.idea`.

Scripts: `dev`, `build` (which runs `next build && node scripts/verify-export.mjs`),
`preview`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `verify`, `prepare`.
**No `start`**: `next start` does not apply under static export. `typecheck` stays because
Turbopack does not typecheck.

CI at `.github/workflows/ci.yml`: pnpm setup, `--frozen-lockfile`, `pnpm verify`, then
`pnpm build`. Verify before build, because build no longer lints.

`create-next-app` will most likely refuse to scaffold here: its empty-directory check
whitelists `.git` and `.gitignore` but not `.claude/` or `skills-lock.json`. Scaffold manually
with `pnpm init` plus the install commands above.

---

## Build order

1. Toolchain: `package.json`, configs, husky, CI. Green `pnpm verify` on an empty app.
2. Tokens and `globals.css`, palette locked, both themes checked in the browser.
3. Content modules with the `satisfies` and `Record<KnownSlug>` guards.
4. shadcn components and the brand registry.
5. Terrain generator and `terrain.generated.ts`.
6. `Landscape`, vertical parallax first, then horizontal pan, then the reduced-motion branch.
7. Trail nav, header, footer, theme control.
8. The five pages.
9. Error surfaces, metadata, OG image, `verify-export.mjs`.

Tokens before components is not stylistic: retrofitting a palette across thirty logos and
eight shadcn components is expensive.

---

## Verification

**Automated.** `pnpm verify` (typecheck, lint, format check) then `pnpm build`.
`scripts/verify-export.mjs` asserts `out/404.html`, `out/index.html`, the four other route
directories, `out/sitemap.xml`, `out/robots.txt`, and the OG PNG all exist, exiting non-zero
otherwise. This converts the three silent failure modes in this plan into build failures.

**Manual, in the browser via `pnpm preview`.** Each item is a real check, not a glance:

- Pan continuity. Navigate `/` → `/skills` → `/experience` → `/projects` → `/articles` and
  back with the browser button. Terrain must pan in the correct direction each time, and the
  four depths must be aligned at rest at every station.
- Content beneath terrain. Scroll each page. Content passes behind the near layer. Then click
  a link that sits under the terrain overlap region: it must respond, proving
  `pointer-events-none` is applied.
- Both themes at each of the three states: Auto with the OS in light, Auto with the OS in
  dark, and each explicit override. Dark mode is where the missing `inline` keyword would show
  up as tokens silently not swapping.
- Reduced motion. Enable it at the OS level, reload, and confirm the scene is a static
  composed frame and route changes are instant with no pan.
- 375px and 1440px. No horizontal scrollbar at either. Confirm at 390px and 768px too.
- Keyboard only. Tab from page load: skip link first, visible focus ring on everything, the
  theme radiogroup operable with arrow keys, the mobile sheet trapping focus and closing on
  Escape.
- `out/404.html` served directly, and a genuinely bad URL against the preview server.
- Lighthouse on the landing page. LCP under 2.5s, CLS under 0.1, and a look at the DevTools
  performance panel while scrolling on a throttled CPU to confirm 60fps.

**The gate before calling it done.** The governing skill ships a 62-box pre-flight checklist.
The boxes most likely to fail on this specific build, in order of likelihood: zero em dashes
anywhere in visible copy; reduced motion wrapped; eyebrow count at or below
`ceil(sections / 3)`, easiest satisfied by shipping zero; no scroll cues, no "scroll to
explore", no bouncing chevron; button contrast on every CTA, where `#656D4A` and `#A68A64`
as fills with cream labels would fail; one theme per page; hero headline at two lines maximum
with subtext at 20 words maximum; no duplicate CTA intent, so pick one of "Get in touch" or
"Contact" and use that exact string in nav, hero and footer; and the palette check, where the
answer must be that this leads with the greens and sits in the endorsed Forest family rather
than the banned cream-and-brass one.

---

## Risks

**Twenty terrain silhouettes is the largest single piece of work.** The parametric grammar
makes it tractable, but quality is the risk, not quantity: four grammars could still produce
five biomes that read as the same shape retinted. Mitigation is that each grammar has a
genuinely different vocabulary (spires, undulation, angular peaks, quadratic mass) and tile
widths never re-phase. Review all five side by side before building pages on top of them.

**The dark far layer is a whisper.** Depth 4 against the dark sky measures about 1.12:1. It
contributes depth, not a readable shape. If it vanishes entirely on a dim phone, the fix is to
lift `--sky-low`, not to lighten the layer, which would break the front-to-back ramp.

**Route transitions under App Router.** Entry-only fade avoids the known exit-animation jank,
but if the landscape ever unmounts on navigation the whole illusion collapses into a flicker.
This is why it lives in the layout, and it is the first thing to check after wiring routing.

**Twenty mask divs mounted at once.** Each is a background-coloured div with a mask, which is
cheap, but if the performance panel shows repaint cost, mount only the current station plus
its neighbours and drop the rest.

**No image-generation tool here.** Real photography comes from salvaging the current site's
assets (headshot, company logos, roughly 25 project screenshots) plus seeded `picsum.photos`
during build-out. Where a real image is genuinely required and absent, hand back an explicit
list rather than papering over it with a CSS gradient, which the skill bans by name.
