/**
 * Post-build gate.
 *
 * Every check here corresponds to a failure mode that is otherwise SILENT: the
 * build succeeds, the site looks fine locally, and the problem only surfaces
 * when a stranger hits a bad URL or shares a link. Turning those into a
 * non-zero exit is the whole point.
 *
 *   out/404.html        the stylised 404. Every static host looks for exactly
 *                       this filename. Next emits it alongside 404/index.html
 *                       under trailingSlash, and only the flat one is honoured.
 *   station/index.html  the directory-index layout. DigitalOcean App Platform
 *                       does not try <path>.html for an extension-less request,
 *                       so out/skills.html would 404 there while passing local
 *                       preview. Asserting the directory form catches a revert
 *                       of `trailingSlash` at build rather than at deploy.
 *   opengraph-image.png the social card. Absent if the generator was not run.
 *   sitemap / robots    the metadata routes, which are easy to break silently.
 *   .nojekyll           without it GitHub Pages strips /_next/* and every asset
 *                       404s, which looks like a build failure but is hosting.
 */

import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { STATIONS } from './lib/stations.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'out')

/** [path, why, mayBeEmpty] */
const required = [
  ['out/index.html', 'the landing page'],
  ['out/404.html', 'the stylised 404, served by every static host for unmatched paths'],
  ['out/sitemap.xml', 'emitted by app/sitemap.ts'],
  ['out/robots.txt', 'emitted by app/robots.ts'],
  ['out/manifest.webmanifest', 'emitted by app/manifest.ts'],
  // Legitimately zero bytes: its existence is the whole signal.
  [
    'out/.nojekyll',
    'without this GitHub Pages strips /_next/* and every asset 404s',
    true,
  ],
  ['out/icon.svg', 'favicon'],
]

// Every station must have produced a real HTML document, at the directory-index
// path rather than the flat one. See the note on trailingSlash in next.config.ts.
for (const station of STATIONS) {
  if (station === '/') continue
  required.push([
    `out${station}/index.html`,
    `the ${station} station (directory-index form, which is the only form DigitalOcean App Platform serves)`,
  ])
}

const problems = []

for (const [rel, why, mayBeEmpty] of required) {
  const path = resolve(root, rel)
  if (!existsSync(path)) {
    problems.push(`missing ${rel}  (${why})`)
    continue
  }
  if (!mayBeEmpty && statSync(path).size === 0) {
    problems.push(`empty ${rel}  (${why})`)
  }
}

// The Open Graph image is emitted under a hashed name, so match by prefix.
if (existsSync(out)) {
  const hasOg = readdirSync(out).some(
    (f) => f.startsWith('opengraph-image') && f.endsWith('.png'),
  )
  if (!hasOg) {
    problems.push(
      'missing out/opengraph-image*.png  (run `node scripts/generate-og.mjs` and commit the result)',
    )
  }
}

// Nothing enormous should reach the deploy. A 68MB animated GIF did, once.
const OVERSIZE = 3 * 1024 * 1024
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (statSync(path).size > OVERSIZE) {
      problems.push(
        `oversized asset ${path.slice(root.length + 1)}  (${(statSync(path).size / 1024 / 1024).toFixed(1)}MB, cap is 3MB)`,
      )
    }
  }
}
if (existsSync(out)) walk(out)

if (problems.length > 0) {
  console.error('\nexport verification failed:\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(`export verified: ${required.length} required artefacts present`)
