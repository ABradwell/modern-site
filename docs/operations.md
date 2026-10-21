# Operations

This document covers local development, checks, hooks, CI, deployment, security
headers and the failures that are easy to misdiagnose.

## Prerequisites

| Requirement | Version                                            |
| ----------- | -------------------------------------------------- |
| Node        | `>=20.9.0` (`package.json`); CI uses Node 22       |
| pnpm        | `10.32.1` (`packageManager` and CI)                |
| gitleaks    | Required for commits; hook fails closed if missing |

```bash
pnpm install
brew install gitleaks   # if the commit hook refuses because it is missing
```

The repository uses Husky. `pnpm install` runs `husky || true`, which installs
the local hooks when Git is available.

## Commands

| Command                              | What it does                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `pnpm dev`                           | Next development server                                                               |
| `pnpm build`                         | `next build` with static export, then `scripts/verify-export.mjs`                     |
| `pnpm preview`                       | Build, then serve `out/` with `serve`                                                 |
| `pnpm typecheck`                     | `tsc --noEmit`                                                                        |
| `pnpm lint`                          | ESLint over the repository                                                            |
| `pnpm lint:fix`                      | ESLint with fixes                                                                     |
| `pnpm format`                        | Prettier write                                                                        |
| `pnpm format:check`                  | Prettier check                                                                        |
| `pnpm verify`                        | Typecheck, lint, format check                                                         |
| `pnpm terrain`                       | Regenerate and validate the panorama                                                  |
| `pnpm terrain -- --preview`          | Also write `.terrain-preview/`: the panorama, plus a laptop and phone SVG per station |
| `node scripts/check-contrast.mjs`    | Assert contrast pairs and terrain ramp                                                |
| `node scripts/generate-og.mjs`       | Regenerate the committed social card from the panorama's Home window                  |
| `sh scripts/git-identity-guard.sh …` | Identity guard; normally run by hooks                                                 |
| `sh scripts/gitleaks-guard.sh`       | Staged secret scan; normally run by the pre-commit hook                               |

There is no unit or integration test suite. Verification is static analysis plus
the build and export assertions.

## What to run for a change

| Change                    | Minimum check                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Prose or content data     | `pnpm typecheck`, then `pnpm build` if a page/export artefact changed                                                              |
| Component or page layout  | `pnpm verify`, `pnpm build`                                                                                                        |
| Colour or token           | `pnpm verify`, `node scripts/check-contrast.mjs`, `pnpm build`                                                                     |
| Terrain config or grammar | `pnpm terrain -- --preview`, review the diff and previews, `pnpm build`; `node scripts/generate-og.mjs` if the Home window changed |
| Motion / station geometry | `pnpm verify`, `pnpm build`, manual desktop and touch check                                                                        |
| Route or metadata         | `pnpm verify`, `pnpm build`; inspect the relevant `out/` file                                                                      |
| CSP or headers            | `pnpm build`; the export gate compares all three copies                                                                            |
| Docs only                 | `pnpm format:check` at minimum; `pnpm verify` if dependencies are installed                                                        |

The build gate is not optional for deployment-sensitive work. `pnpm dev` can pass
while `out/` is missing a required file.

## Hooks

### `pre-commit`

```sh
sh scripts/git-identity-guard.sh pending
sh scripts/gitleaks-guard.sh
pnpm lint-staged
```

Order matters:

1. Identity is checked before the commit object exists.
2. Secrets are scanned over the staged index before lint-staged can modify
   files.
3. `lint-staged` runs ESLint with `--max-warnings=0 --no-warn-ignored` and
   Prettier on staged files.

`--no-warn-ignored` is deliberate. lint-staged passes explicit paths, including
files ESLint is configured to ignore. Without this flag, every commit touching
`src/content/terrain.generated.ts` would fail on a warning about an ignored file.

### `pre-push`

```sh
sh scripts/git-identity-guard.sh outgoing
pnpm lint
```

The identity guard checks the commits the push would actually send, which catches
a bad identity introduced by rebase, cherry-pick or `--no-verify`. Lint runs here
because Next 16 removed `next lint` and `next build` no longer lints.

### CI

`.github/workflows/ci.yml` has two jobs:

**`verify`** (on push to `main` and every pull request):

1. checkout;
2. install pnpm 10.32.1;
3. Node 22 with pnpm cache;
4. `pnpm install --frozen-lockfile`;
5. `pnpm verify`;
6. `node scripts/check-contrast.mjs`;
7. `pnpm terrain`;
8. `git diff --exit-code src/content/terrain.generated.ts`;
9. `pnpm build`.

The terrain step is a determinism check. The generator is deterministic; any
diff means the committed generated file is stale relative to its inputs.

**`identity`** (separate, required):

- fetches full history;
- checks every commit in the push/PR range with
  `scripts/git-identity-guard.sh`;
- checks the tip only when the base is not a real commit (new branch or force
  push).

The identity job is separate so it stays fast and independent of install
success. It is the required check that cannot be skipped with `--no-verify`.

## Secret scanning

`scripts/gitleaks-guard.sh` scans the **staged index**, not the working tree. A
working-tree scan would report real signing keys that a dev build writes into
`.next/prerender-manifest.json` and siblings — files that cannot be committed.

The hook fails closed. If `gitleaks` is not on `PATH`, the commit is refused:

```text
Refusing to commit: gitleaks is not installed.
```

For a false positive:

- append `gitleaks:allow` as a comment on the line, or
- add the printed fingerprint to `.gitleaksignore`.

Do not use `--no-verify` to bypass it; that also skips the identity guard and
lint-staged.

## Commit identity

Every commit must be authored by:

```text
Aiden Stevenson Bradwell <Aidenbradwell@gmail.com>
```

The repository local config is the first layer:

```bash
git config --local user.name 'Aiden Stevenson Bradwell'
git config --local user.email 'Aidenbradwell@gmail.com'
```

All worktrees share the same local config, so setting it once covers them. The
pre-commit guard checks the identity the commit is about to use. The pre-push
guard checks the identity commits already carry. CI's `identity` job is the
required check that cannot be skipped locally.

GitHub itself is allowed as the **committer** on merge commits it creates; the
author is still the owner.

## Deployment

The deployable artefact is `out/`. The primary target is DigitalOcean App
Platform, configured in `.do/app.yaml`.

### DigitalOcean App Platform

`.do/app.yaml` is the source of truth. App Platform does not read it on push; it
is applied with `doctl`:

```bash
doctl auth init
doctl apps create --spec .do/app.yaml
doctl apps list
doctl apps update <app-id> --spec .do/app.yaml
```

After the app exists, `deploy_on_push: true` means ordinary commits to `main`
deploy automatically. `doctl` is only needed when the spec changes. Editing the
app in the dashboard instead is drift; the next `doctl apps update` will revert
it.

Settings encoded in the spec:

- static site component, Node buildpack;
- build command `pnpm build`;
- output directory `out`;
- index document `index.html`;
- error document `404.html`, not a catchall;
- apex `PRIMARY` domain and `www` `ALIAS`, both in the managed
  `aidenbradwell.com` zone.

The `www` alias answers 200 rather than redirecting; the per-page canonical tag
points crawlers at the apex. Do not treat the absence of a 301 as a failure.

### Other hosts

- **Vercel**: detected automatically; headers from `vercel.json`.
- **Cloudflare Pages**: build `pnpm build`, output `out`; headers from
  `public/_headers`, which Next copies into `out/`.
- **GitHub Pages**: `public/.nojekyll` is required or Jekyll strips `/_next/*`;
  a project page would need `basePath` and `assetPrefix`.

### Why `trailingSlash: true`

DigitalOcean serves the export as a plain file tree and does not try
`<path>.html` for an extension-less request. With the default, `/skills` would
look for `out/skills.html` and 404 in production while working in local preview.
`trailingSlash: true` emits `out/skills/index.html`, which every target resolves.
The export gate asserts the directory-index form.

Next 16 emits both `out/404.html` and `out/404/index.html` under this setting.
The flat file is the one static hosts look for, and the gate requires it.

## Security headers and the CSP

`output: 'export'` cannot set response headers from Next. Three copies exist:

1. `src/lib/csp.ts` — `CSP_META`, rendered as `<meta http-equiv>` in the layout.
2. `public/_headers` — Cloudflare Pages.
3. `vercel.json` — Vercel.

`scripts/verify-export.mjs` parses all three and compares them directive by
directive. Reordering is allowed; adding, dropping or changing a directive is
not. `frame-ancestors` is exempt from the meta comparison because browsers
ignore it in meta; the meta copy must not declare it.

On DigitalOcean, only the meta CSP applies. `frame-ancestors`,
`X-Frame-Options`, HSTS, `Referrer-Policy`, `X-Content-Type-Options`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy` and the immutable
`/_next/static/*` cache header are header-only and do **not** apply. The site has
no session, cookie or authenticated action, so the practical exposure is limited,
but the gap is real. Putting Cloudflare in front with a Transform Rule restores
the full header set without moving off a static site.

When editing the policy, change all three files. `CSP_META` is derived from the
same shared directive list as `CSP_HEADER` in `src/lib/csp.ts`, but the header
file and Vercel JSON are literal copies.

## Export artefacts

`scripts/verify-export.mjs` requires at least:

- `out/index.html`
- `out/404.html`
- `out/sitemap.xml`
- `out/robots.txt`
- `out/manifest.webmanifest`
- `out/llms.txt` (a file, not a directory index)
- `out/_headers`
- `out/.nojekyll` (may be zero bytes)
- `out/icon.svg`
- `out/cv/index.html` (off-trail, so explicit)
- `out/aiden-stevenson-bradwell-cv.pdf`
- `out/<station>/index.html` for every station
- an `out/opengraph-image*.png`

It also checks the meta CSP is inside `<head>`, that the CSP copies agree, and
that no file in `out/` exceeds 3 MB.

## Troubleshooting

### Commit refused: gitleaks not installed

Install it (`brew install gitleaks`) and retry. The hook is intentionally
fail-closed.

### Commit refused: identity guard

Check:

```bash
git config --local user.name
git config --local user.email
git log -1 --format='%an <%ae>'
```

Set the local identity if needed. Do not bypass the guard.

### Prettier or ESLint failure on commit

Run `pnpm lint-staged` manually to see the actual files and errors, or
`pnpm lint` / `pnpm format`. The hook only exposes the failure, not always the
cause.

### `pnpm build` fails in `verify-export.mjs`

Read the listed missing artefact. Common causes:

- `trailingSlash` reverted, so station pages are flat `.html` files;
- `/cv` page missing or moved;
- the CV PDF removed from `public/`;
- `llms.txt` route renamed or emitted as a directory index;
- social card not generated or not committed;
- CSP copies drifted;
- an asset over 3 MB.

### `/skills` works in dev/preview but 404s in production

The host is serving a flat file tree and `trailingSlash` is not `true`, or the
deployed output is not `out/`. Restore directory-index output; do not add a host
rewrite as the primary fix.

### Terrain check fails in CI

The committed `terrain.generated.ts` is stale, or a generator check failed (the
log names it: floor between rows, recession, near ground line, `NEAR_TOP`,
water placement, symbol bounds or a self-intersection). Run:

```bash
pnpm terrain
pnpm terrain -- --preview   # optional visual check
git diff -- src/content/terrain.generated.ts
```

Commit the regenerated file. Do not hand-edit it to make the diff go away.

### "terrain is …vw wide but stations span …vw"

`Landscape.tsx` throws this at module load when `PANORAMA.stripVw` differs from
`STRIP_VW`. The station list changed length without the route being extended.
Update `ROWS` (and `WATER`) in `scripts/lib/terrain-config.mjs` to cover the
new strip and run `pnpm terrain`.

### CSP drift

The error names the directive and which copies disagree. Edit
`src/lib/csp.ts` (for the meta) and both header copies (`public/_headers`,
`vercel.json`) together. Rebuild; the gate compares `out/_headers` and
`out/index.html`.

### Missing images / dimension warnings

Static export uses `images.unoptimized: true`. Every `next/image` must have
explicit `width` and `height`, and project images should live under
`public/images/`. A missing file becomes a broken static path rather than a
build-time transform.

### Swipe interferes with scrolling or dialogs

Check the guard conditions in `src/components/system/station-swipe.tsx`:

- 24px edge guard for browser back/forward gestures;
- 12px movement lock;
- horizontal must beat vertical by 1.3;
- touch starts inside `[role="dialog"]` or with `data-scroll-locked` are ignored;
- multi-touch cancels.

Do not broaden horizontal claim to compensate. Vertical scrolling must remain
unconditional until the axis is unambiguous.

### Theme does not change

Check that `next-themes` writes `data-theme`, that `globals.css` still uses
`[data-theme='dark']`, and that `@theme inline` remains `inline`. The control
itself is a radiogroup; test with keyboard and with JS disabled for the system
fallback.

### Mobile layout compresses into the treeline

Check `--scene` and `--vu`. The composition should use the `48rem` floor, not a
bare `100dvh` or `h-screen`. Do not fix this by adding page-specific hero
padding; that breaks the absolute content offset.

## Release checklist

1. `pnpm verify`.
2. `node scripts/check-contrast.mjs` if colour changed.
3. `pnpm terrain` if terrain inputs changed; commit the generated diff.
4. `pnpm build`.
5. Inspect `git diff` and `git status` for generated or secret files.
6. Confirm commit author.
7. Push and open a PR; CI must pass `verify` and `identity`.
8. Merge to `main`; DigitalOcean deploys on push.
9. Check the apex and `www` return 200, and that a mistyped URL returns the
   stylised 404.
