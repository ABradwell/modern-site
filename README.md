# aidenbradwell.com

A static personal site. Four pages, one continuous landscape.

The idea the whole build hangs off: the site is a single landscape read west to
east, and each route is a station along it. Scrolling at a station lifts the
terrain and lets the page rise out of it. Navigating pans the landscape sideways.
The sun overhead becomes a moon when the reader's colour scheme is dark.

| Route       | Station              | Terrain                            |
| ----------- | -------------------- | ---------------------------------- |
| `/`         | Forest               | conifer spires                     |
| `/skills`   | Plains               | grass, sentinel poplars, a river   |
| `/projects` | Mountains            | angular fractal ridges             |
| `/articles` | Above the cloud line | rock, a cloud sea, distant summits |

`/skills` is labelled **Experience** in the navigation and carries roles, core
competencies and education together. It used to be two routes; merging them
retired `/experience` and, with it, the `foothills` biome, which the terrain
config still declares and `pnpm terrain` still emits. Nothing mounts it, so it
costs a fifth of the generated file and nothing at runtime. It is the obvious
home for a fifth station if one arrives.

Stations are separated by a 16vw gutter. A station's terrain bleeds east across
its own gutter and the next station reaches back west across it and fades in, so
a pan never shows the vertical step where one biome's crest tile was cut mid-tree
and the next began mid-saddle. Because a station's window is bounded by its
neighbours' slot edges, exactly one biome is drawn at rest and the blend is only
ever visible while travelling. Geometry lives in `src/lib/station-geometry.ts`.

**Swipe navigation.** On touch devices a horizontal drag travels between
stations, dragging the landscape one-to-one with the finger and committing past
22% of the viewport or on a fast flick. It is an enhancement, not a control: the
nav sheet is the single-pointer alternative WCAG 2.5.1 asks for. The gesture
claims nothing until horizontal movement beats vertical by 1.3x, ignores touches
within 24px of either edge so the browser keeps its own back and forward swipes,
declines to fire inside an open dialog, and never narrows `touch-action`, so pinch
zoom is untouched. See `src/components/system/station-swipe.tsx`, which also owns
the pan spring, because a tap and a swipe move the same strip and need one spring
between them.

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
`next.config` (so security headers live in `public/_headers`, `vercel.json` and,
for the hosts that can set no headers at all, a meta CSP from `src/lib/csp.ts`),
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

Body copy runs on four steps, defined once in `src/lib/type.ts`: `PROSE` for
section paragraphs, `PROSE_TIGHT` for card and caveat copy, `META` for labels and
dates, `CHIP` for technology marks. Headings, nav and buttons sit outside it on
purpose. Before it existed the same kind of paragraph appeared at `text-sm` on
one page and `text-xl` on another, with three arbitrary `text-[0.6875rem]`
values scattered through the cards.

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

Build output is `out/`. Every host below builds with `pnpm build` and serves that
directory. `trailingSlash: true` in `next.config.ts` puts each station at
`out/skills/index.html` rather than `out/skills.html`; that is required by
DigitalOcean and is what the other hosts want anyway.

- **DigitalOcean App Platform.** The configuration lives in `.do/app.yaml`. See
  below.
- **Vercel.** Detected automatically. Security headers come from `vercel.json`.
- **Cloudflare Pages.** Build `pnpm build`, output directory `out`. Headers come
  from `public/_headers`, which Next copies to the deploy root.
- **GitHub Pages.** `public/.nojekyll` is committed and required: without it
  Jekyll strips `/_next/*` and every asset 404s, which looks like a build failure
  but is not. A project page also needs `basePath` and `assetPrefix`. GitHub Pages
  cannot set response headers at all.

### DigitalOcean App Platform

`.do/app.yaml` is the source of truth. App Platform does not read it on push, so
it is applied with `doctl`:

```bash
doctl auth init                                   # once
doctl apps create --spec .do/app.yaml             # first deploy
doctl apps list                                   # find the app id
doctl apps update <app-id> --spec .do/app.yaml    # after editing the spec
```

After the app exists, `deploy_on_push: true` handles ordinary commits to `main`
on its own. `doctl` is only needed again when the spec itself changes. Editing
the app in the dashboard instead is drift, and the next `doctl apps update`
reverts it.

Creating the app through the dashboard works too. The equivalent settings are
resource type Static Site, build command `pnpm build`, output directory `out`,
index document `index.html`, error document `404.html`.

Three things about App Platform specifically.

**Extension-less paths do not resolve.** App Platform serves the output as a
plain file tree and never tries `<path>.html`, which is the whole reason for
`trailingSlash: true`. Revert that and `/skills` 404s in production while local
preview stays green. `scripts/verify-export.mjs` asserts the directory-index
layout on every build so the failure lands there instead.

**Use `error_document`, not `catchall_document`.** They are mutually exclusive.
A catchall would serve the homepage with a 200 for every mistyped URL, so broken
links would look healthy to a visitor and to a crawler.

**Static sites cannot set response headers.** There is no App Platform
equivalent of `vercel.json` or `public/_headers`, so nothing in either file
applies on DigitalOcean. Both stay in the repo for the hosts that do honour them.

What survives that, and what does not, is worth being precise about, because
this is the host the site actually deploys to:

- **The CSP does apply.** It is also emitted as a `<meta http-equiv>` tag in
  every document, from `src/lib/csp.ts`, and a meta CSP is enforced by the
  browser from the markup with no host involvement. That is the same policy the
  headers carry, minus the directives meta cannot express.
- **`frame-ancestors` and `X-Frame-Options` do not.** Both are header-only, and
  `frame-ancestors` is ignored in meta by specification. On DigitalOcean the site
  is therefore embeddable in an iframe by anyone. It carries no session, no
  cookie and no authenticated action, so the practical exposure is someone
  framing a portfolio, but the gap is real.
- **HSTS, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` and
  `Cross-Origin-Opener-Policy` do not apply either.** All header-only.
- **The immutable cache header on `/_next/static/*` does not apply**, so those
  assets are revalidated more often than they need to be. A correctness
  non-issue and a small performance one.

`scripts/verify-export.mjs` compares all three copies of the CSP on every build
and fails if they have drifted, so the meta tag cannot quietly fall behind the
headers.

Closing the remaining gap does not require moving off the static-site component.
Putting Cloudflare in front of the app with proxied DNS and adding a Transform
Rule for response headers restores the full set on the free tier, and is the
cheapest option by a wide margin. Moving to a service component instead means a
real server and a real bill for a site that has no server-side work to do.

The Node version comes from `engines.node` in `package.json`. It is a `>=` range
rather than a pin, so App Platform resolves it to the newest Node it offers. Pin
it to a major there if a future Node release breaks the build.

### Domains and DNS

Both hostnames are declared in the `domains:` block of `.do/app.yaml`:

| Host                    | Type      | Behaviour                                    |
| ----------------------- | --------- | -------------------------------------------- |
| `aidenbradwell.com`     | `PRIMARY` | Serves the site.                             |
| `www.aidenbradwell.com` | `ALIAS`   | Certificate issued, serves the same content. |

The nameservers are DigitalOcean's (`ns1`/`ns2`/`ns3.digitalocean.com`), and
`zone: aidenbradwell.com` on each entry tells App Platform to manage the records
in that zone itself. Applying the spec is what starts certificate issuance:

```bash
doctl apps list                                   # find the app id
doctl apps update <app-id> --spec .do/app.yaml
doctl apps get <app-id> --format DefaultIngress,Domains
```

**Never hand-write an A record for either name.** App Platform sits behind a
shared CDN edge that routes by SNI, so the IP a hostname resolves to is not what
attaches it to the app. Registering the domain on the app is. A manual A record
pointed at an edge IP therefore resolves, reaches the edge, and then fails
because no certificate exists for that name:

```
https://www.aidenbradwell.com  → sslv3 alert handshake failure
                                 (ERR_SSL_VERSION_OR_CIPHER_MISMATCH)
http://www.aidenbradwell.com   → 409 Conflict, "error code: 1001"
```

That failure mode is worth recognising, because the apex keeps serving normally
throughout and the site looks down only to anyone arriving on `www`, which
includes anyone arriving from a search result indexed under that hostname.

The managed records carry a 30 second TTL and rotate across several edge IPs. A
record with a long TTL pinned to a single IP is hand-written drift; delete it and
let App Platform recreate it.

To verify after a change:

```bash
dig +short aidenbradwell.com www.aidenbradwell.com
curl -sSI https://aidenbradwell.com     | head -1   # expect 200
curl -sSI https://www.aidenbradwell.com | head -1   # expect 200
```

An `ALIAS` serves the site rather than redirecting to the `PRIMARY`, so `www`
answers 200 with the same content and no `Location` header. Do not read the
absence of a 301 as a misconfiguration. What keeps the two hostnames from
competing as duplicates is the canonical tag, which every page carries and which
always names the apex:

```bash
curl -sS https://www.aidenbradwell.com | grep -o '<link rel="canonical"[^>]*>'
# <link rel="canonical" href="https://aidenbradwell.com/"/>
```

If a real redirect is ever wanted, App Platform cannot do it from a static-site
component. It would need an `ingress` rule with a `redirect` on a separate
component, which is a bigger change than it sounds and is not worth it while the
canonical tag is doing the job.

Canonical URLs, `sitemap.xml` and `robots.txt` all point at the apex; the source
of that is `SITE.url` in `src/content/site.ts`. Keep the apex `PRIMARY` so those
stay consistent.

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

## What machines read

Four surfaces, all generated from `src/content/` so none of them can drift from
what the pages say.

**Canonicals live per page, never in the root layout.** Metadata merges down the
route tree, so a canonical declared once in `layout.tsx` is inherited verbatim by
every route that does not override it. That is how this site spent a while
telling crawlers that `/skills/`, `/projects/` and `/articles/` were all
duplicates of the homepage while `sitemap.xml` went on submitting them as
distinct URLs. `openGraph.url` has the same trap and the same fix. If you add a
route, give it its own `alternates.canonical`.

**JSON-LD, as one graph.** `src/lib/schema.ts`. The Person and WebSite are
declared once in the layout with stable `@id`s, and each route adds a page node
that references the Person by id rather than restating it: `ProfilePage` on the
home and experience pages, `CollectionPage` with an `ItemList` of
`SoftwareSourceCode` on projects, the same with `Article` items on writing.
`knowsAbout` is the tier-1 competency wall and `alumniOf` is the education entry,
so both maintain themselves.

**`/llms.txt`.** `src/app/llms.txt/route.ts`. The whole site as one plain-text
document in reading order. The HTML is a poor artefact to hand a model: the
prose is interleaved with fifty-odd inline RSC flight payloads and kilobytes of
SVG terrain mask, so everything is present and almost none of it is easy to
find. This is the same content with the presentation removed. It is a route
handler rather than a file in `public/` so that it reads the typed content
modules directly; the extension in the segment name is what makes Next write
`out/llms.txt` instead of a directory index, and the build gate asserts it.

**`robots.txt`.** `src/app/robots.ts`. Everything is allowed, including the AI
crawlers, which are listed by name even though `*` already covers them. A named
group is the seam where the answer can differ per agent later, and the reasoning
for allowing them is written down next to the list. This is a portfolio whose job
is to be found and summarised; blocking the ingest would be blocking the
readership.

## A note on the pre-commit hook

`lint-staged` passes staged paths to ESLint explicitly, including files ESLint is
configured to ignore. ESLint reports those as a warning, and `--max-warnings=0`
turns the warning into a failed commit. Hence `--no-warn-ignored` on the ESLint
command in `package.json`. Remove it and every commit that touches
`src/content/terrain.generated.ts` fails for no real reason.
