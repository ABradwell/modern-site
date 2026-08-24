# aidenbradwell.com

A static personal site. Five pages, one continuous landscape.

The idea the whole build hangs off: the site is a single landscape read west to
east, and each route is a station along it. Scrolling at a station lifts the
terrain and lets the page rise out of it. Navigating pans the landscape sideways.
The sun overhead becomes a moon when the reader's colour scheme is dark.

| Route         | Station              | Terrain                            |
| ------------- | -------------------- | ---------------------------------- |
| `/`           | Forest               | conifer spires                     |
| `/skills`     | Plains               | grass, sentinel poplars, a river   |
| `/experience` | Foothills            | rolling smoothed ridges            |
| `/projects`   | Mountains            | angular fractal ridges             |
| `/articles`   | Above the cloud line | rock, a cloud sea, distant summits |

## Commands

```bash
pnpm install
pnpm dev                       # http://localhost:3000
pnpm build                     # next build, then verify the export
pnpm preview                   # build and serve out/ over a static server
pnpm verify                    # typecheck, lint, format check
pnpm terrain                   # regenerate the terrain silhouettes
pnpm terrain -- --preview      # also write a contact sheet to .terrain-preview/
node scripts/check-contrast.mjs # assert every shipped colour pair against WCAG
node scripts/generate-og.mjs   # regenerate the Open Graph card
```

## Stack, and why

**Next.js 16, App Router, `output: 'export'`.** Fully static, no runtime. Chosen
over Vite for one concrete reason above the others: static export writes a real
`out/404.html`, which is the file every static host serves for unmatched paths. A
Vite SPA returns HTTP 200 for a missing route, which is wrong for both readers and
crawlers.

Known trade-offs, since they are permanent under static export: no `headers` from
`next.config` (so security headers live in `public/_headers` and `vercel.json`),
no Server Actions (so no contact form; the site links a mailto instead), and no
image optimisation, so `images.unoptimized` is on and every asset is shipped at
the size it was authored.

**Component behaviour is Radix UI. Component styling is ours.** Distributed via
shadcn/ui, which copies the source into `src/components/ui` rather than adding a
styled dependency. This is not a shortcut around using a library: Radix is doing
the genuinely hard work, supplying the focus trap, escape handling, scroll lock
and ARIA wiring for the mobile navigation and the experience accordion. What is
ours is the appearance. The components are deliberately not in default state:
they consume our tokens, the radius scale is remapped so nothing is pill-shaped,
and their focus rings were removed in favour of one global `:focus-visible`
outline so the whole site has a single focus system.

**Motion** for all animation, and no GSAP. Two animation libraries competing for
the same frames is a real problem and nothing here needs pinning.

**Geist** via the `geist` package rather than `next/font/google`, so the build has
no network dependency on a font CDN and works offline.

**Phosphor** for interface icons, one family, `weight="regular"` everywhere.
Brand logos come from Simple Icons and are confined to
`src/components/brand/registry.ts`, which is the only file allowed to import
them.

## Where things are

```
scripts/
  lib/terrain-grammars.mjs   four shape languages: conifers, grassland, ridge, cloudbank
  lib/terrain-config.mjs     the twenty silhouettes, declared
  generate-terrain.mjs       writes src/content/terrain.generated.ts, validates geometry
  generate-og.mjs            writes the committed Open Graph card
  check-contrast.mjs         asserts every colour pair the site ships
  verify-export.mjs          post-build gate over out/
src/
  app/                       routes, error surfaces, metadata routes
  components/landscape/      the scene: bands, orb, grain, mask builder
  components/layout/         header, trail nav, mobile nav, hero and content shells
  content/                   all site content as typed modules
  lib/                       tokens for motion, the z-index scale, cn()
```

## The landscape

`src/components/landscape/Landscape.tsx` is mounted in the **root layout**, never
in a page. App Router preserves layout state across navigation, so the scene never
unmounts and the pan is continuous travel rather than a crossfade imitating it.

Two fixed bands sandwich the page. Almost everything paints behind content; only
the nearest treeline paints in front, and only far enough to overlap section
padding. All three fixed bands are `pointer-events: none`, which is load-bearing
rather than tidy: without it the terrain silently swallows clicks.

Horizontal movement uses **one shared spring for every depth**. Per-depth
stiffness was tried and removed. It is textbook parallax, and on a full-viewport
slide it read as the world coming apart rather than as depth, to the point of
inducing motion sickness. Depth is expressed vertically, where the reader controls
the rate.

### Two numbers that are a pair

The depth-1 `bottom` in `terrain-config.mjs` is capped at 106 so the foreground
band, including its 12dvh body, ends by 118dvh. `CONTENT_OFFSET_DVH` in
`src/lib/motion.ts` puts content at an absolute 120dvh on every route. Raise
either without the other and terrain starts painting over headings. Every hero is
the same height for the same reason: the landscape is an absolute composition, so
where content begins has to be absolute too.

### Regenerating terrain

Silhouettes are generated, not hand-drawn, and the output is committed.
Deterministic seeds mean the same input always produces the same paths, so there
is no runtime cost, no hydration risk, and a reviewable diff when a shape changes.
Edit a grammar or the config, then `pnpm terrain`. CI regenerates and fails if the
result differs from what is committed.

`--preview` writes an SVG contact sheet per biome at true dvh proportions, with a
rule drawn at the fold. Look at those before changing numbers.

The generator validates each tile: it must start and end on its baseline so the
repeat is seamless, stay inside its viewBox, and contain no self-intersecting
line subpath. It also reports rendered element aspect, which should stay near 2.4
for the conifer bands.

Two things about tile geometry that cost real time to find, and will cost it
again if undone:

- **Never put `preserveAspectRatio="none"` on a mask tile.** It removes the
  intrinsic aspect ratio, so `mask-size: auto <height>` has nothing to derive the
  width from and the browser scales x and y by different factors. Every
  silhouette silently distorts.
- **Never set `-webkit-mask-composite`.** It is not an alias for
  `mask-composite`; it takes different keywords, and set alongside the standard
  property it overrides it.

## Colour

Five source colours, two hue families: warm earth at 54 to 75 degrees and green at
119 to 123. Max chroma is 0.070, which is why nothing here can go neon.

Three role assignments are forced by measurement rather than taste. `#414833` on
`#EDE0D4` is 7.37:1 and carries body text. `#656D4A` is 4.22:1 and fails AA, so it
is retired from text entirely and survives as terrain fill. `#A68A64` is 2.52:1 and
fails even the large-text floor, so it is never a text colour anywhere: it is the
sun, the dark-mode accent fill, and hairlines.

`scripts/check-contrast.mjs` asserts all 26 shipped pairs plus the terrain ramp
ordering. Run it if you touch the palette.

Tokens live in `src/app/globals.css` in three layers: raw ramps, a semantic layer
named to shadcn's contract, and `@theme inline`. **The `inline` keyword is
load-bearing**: without it Tailwind bakes the light value into each utility and
dark mode silently stops working while appearing to be wired up.

## Deploying

Build output is `out/`.

- **Vercel.** Detected automatically. Security headers come from `vercel.json`.
- **Cloudflare Pages.** Build `pnpm build`, output directory `out`. Headers come
  from `public/_headers`, which Next copies to the deploy root.
- **GitHub Pages.** `public/.nojekyll` is committed and required: without it
  Jekyll strips `/_next/*` and every asset 404s, which looks like a build failure
  but is not. A project page also needs `basePath` and `assetPrefix`. GitHub Pages
  cannot set response headers at all.

## Content

All content is typed modules under `src/content/`, so pages are pure
presentation and a typo in a project's tech stack is a build error rather than a
blank cell. `SKILLS` uses `satisfies` to preserve literal types, and the brand
registry is typed `Record<IconSkillId, ...>` so adding a technology without
wiring its logo fails the build.

There is no lawful brand mark for AWS: Amazon, Microsoft and Google all had their
logos removed from Simple Icons on trademark request. Rather than drawing one,
the technology wall runs two registers, a brand mark where one legitimately
exists and set type where it does not. The wall is headed "Technologies" and
never "Trusted by": these are tools, not customers.

## A note on the pre-commit hook

`lint-staged` passes staged paths to ESLint explicitly, including files ESLint is
configured to ignore. ESLint reports those as a warning, and `--max-warnings=0`
turns the warning into a failed commit. Hence `--no-warn-ignored` on the ESLint
command in `package.json`. Remove it and every commit that touches
`src/content/terrain.generated.ts` fails for no real reason.
