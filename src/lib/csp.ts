/**
 * The Content Security Policy, in the one place it can be read as source.
 *
 * WHY THIS IS A META TAG AND NOT ONLY A HEADER. Under `output: 'export'` there
 * is no server, so `headers` in next.config does nothing and the policy has to
 * come from the host: vercel.json on Vercel, public/_headers on Cloudflare
 * Pages. DigitalOcean App Platform, which is where this site actually deploys,
 * has no equivalent of either, and GitHub Pages has none at all. On those two
 * hosts a header-only policy is simply absent.
 *
 * A `<meta http-equiv>` CSP is enforced by the browser from the document
 * itself, so it travels with the page to every host. Where a header is also
 * present the two are enforced as an intersection, and since this string is the
 * header's string minus the directives meta cannot carry, the intersection is
 * the same policy.
 *
 * WHAT META CANNOT DO. `frame-ancestors`, `report-uri` and `sandbox` are
 * ignored in meta by specification, so clickjacking protection still depends on
 * the header (`frame-ancestors` plus `X-Frame-Options`). That gap is real on
 * DigitalOcean and is the strongest argument for putting a proxy in front of it.
 *
 * `'unsafe-inline'` on script-src is load-bearing, not an oversight. A static
 * export cannot mint a per-request nonce, and the alternative, hashing every
 * inline script, means hashing the ~50 RSC flight payloads Next emits per page,
 * all of which change on every build. The exposure it leaves is small here: the
 * site takes no user input, has no forms, no auth, no cookies, no third-party
 * script and no origin state worth stealing, so there is nothing for an
 * injected inline script to act on. It is recorded rather than hidden.
 *
 * KEEP IN SYNC WITH vercel.json AND public/_headers. scripts/verify-export.mjs
 * compares all three at build and fails if they have drifted, so this is a
 * checked instruction rather than a hopeful comment.
 */

/** Directives valid in both a header and a meta tag. */
const SHARED = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self'",
  'upgrade-insecure-requests',
] as const

/**
 * The meta form. `frame-ancestors` is deliberately absent: browsers ignore it
 * in meta and log a console warning for including it.
 */
export const CSP_META = SHARED.join('; ')

/** The header form, which additionally carries the meta-ignored directive. */
export const CSP_HEADER = [...SHARED, "frame-ancestors 'none'"].join('; ')
