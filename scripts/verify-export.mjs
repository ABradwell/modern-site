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
 *   llms.txt            the plain-text digest. A route handler whose segment
 *                       carries an extension, which is what makes Next write a
 *                       file rather than a directory index. If that ever
 *                       changes, the URL 404s and nothing else notices.
 *   the CSP, three ways vercel.json, _headers and the meta tag in the document
 *                       each carry the policy, because no one of them reaches
 *                       every host. Drift between them is silent: the site
 *                       keeps working and one host enforces something weaker.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
  [
    'out/llms.txt',
    'the plain-text digest for automated readers, emitted by app/llms.txt/route.ts. Its absence here means the route handler produced a directory index instead of a file',
  ],
  ['out/_headers', 'the Cloudflare Pages header policy, copied from public/'],
  // Legitimately zero bytes: its existence is the whole signal.
  [
    'out/.nojekyll',
    'without this GitHub Pages strips /_next/* and every asset 404s',
    true,
  ],
  ['out/icon.svg', 'favicon'],
  // Off the trail on purpose, so not covered by the STATIONS loop below.
  ['out/cv/index.html', 'the CV page, which is deliberately absent from STATIONS'],
  [
    'out/aiden-stevenson-bradwell-cv.pdf',
    'the resume PDF the Experience hero and the CV page link to, copied from public/',
  ],
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

/**
 * The CSP exists in three copies and they must agree.
 *
 * Static export cannot set a header, so the policy is written once per delivery
 * mechanism: vercel.json for Vercel, public/_headers for Cloudflare Pages, and a
 * meta tag in the document for DigitalOcean App Platform and GitHub Pages, which
 * can set no headers at all. Three copies of one policy drift, and the failure
 * is silent in the worst way: the site keeps working, and one host quietly
 * enforces something weaker than the other two.
 *
 * Compared as directive sets rather than strings, so reordering is allowed and a
 * changed, added or dropped directive is not. `frame-ancestors` is exempt: it is
 * ignored in meta by specification, so the meta copy legitimately omits it.
 */
const META_EXEMPT = new Set(['frame-ancestors'])

function directives(csp) {
  return new Map(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...values] = d.split(/\s+/)
        return [name.toLowerCase(), values.join(' ')]
      }),
  )
}

/**
 * The meta tag's content arrives HTML-escaped, because that is what correct
 * serialisation of `'self'` inside an attribute looks like. A browser decodes it
 * while parsing, so the comparison has to decode it too or every single-quoted
 * source expression reads as drift.
 */
function decodeEntities(text) {
  return text
    .replace(/&#x27;?/gi, "'")
    .replace(/&#39;?/g, "'")
    .replace(/&quot;?/gi, '"')
    .replace(/&amp;?/gi, '&')
}

function readCsp(label, path, pattern) {
  if (!existsSync(path)) return null
  const match = readFileSync(path, 'utf8').match(pattern)
  if (!match) {
    problems.push(`no Content-Security-Policy found in ${label}`)
    return null
  }
  return directives(decodeEntities(match[1]))
}

const cspSources = [
  readCsp(
    'vercel.json',
    resolve(root, 'vercel.json'),
    /"Content-Security-Policy",\s*\n?\s*"value":\s*"([^"]+)"/,
  ),
  readCsp(
    'out/_headers',
    resolve(out, '_headers'),
    /^\s*Content-Security-Policy:\s*(.+)$/m,
  ),
  readCsp(
    'the meta tag in out/index.html',
    resolve(out, 'index.html'),
    /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"/i,
  ),
].filter(Boolean)

if (cspSources.length === 3) {
  const [vercel, headers, meta] = cspSources
  const names = new Set([...vercel.keys(), ...headers.keys(), ...meta.keys()])

  for (const name of names) {
    const expected = vercel.get(name)

    if (headers.get(name) !== expected) {
      problems.push(
        `CSP drift on \`${name}\`: vercel.json says "${expected ?? '(absent)'}", out/_headers says "${headers.get(name) ?? '(absent)'}"`,
      )
    }

    if (!META_EXEMPT.has(name) && meta.get(name) !== expected) {
      problems.push(
        `CSP drift on \`${name}\`: vercel.json says "${expected ?? '(absent)'}", the meta tag says "${meta.get(name) ?? '(absent)'}" (edit src/lib/csp.ts)`,
      )
    }
  }

  if (meta.has('frame-ancestors')) {
    problems.push(
      'the meta CSP declares `frame-ancestors`, which browsers ignore in meta and warn about. Remove it from src/lib/csp.ts CSP_META',
    )
  }
}

// The meta CSP is only enforced if the browser parses it inside <head>. React
// hoists it, but a regression there would disable the policy on the two hosts
// that have nothing else, and the page would look perfectly fine.
if (existsSync(resolve(out, 'index.html'))) {
  const html = readFileSync(resolve(out, 'index.html'), 'utf8')
  const head = html.slice(0, html.indexOf('</head>'))
  if (!/http-equiv="Content-Security-Policy"/i.test(head)) {
    problems.push(
      'the meta CSP is not inside <head> in out/index.html, so no browser will enforce it',
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
