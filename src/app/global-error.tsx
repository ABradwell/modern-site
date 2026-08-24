'use client'

/**
 * The last resort: a failure inside the root layout itself.
 *
 * Two constraints make this file look unlike every other one in the project,
 * and both are real rather than stylistic.
 *
 * IT RECEIVES NO GLOBAL STYLES. When this renders it replaces the root layout,
 * so globals.css is not loaded and every Tailwind class would be inert. All
 * styling here is inline, and the two themes are handled by hand through a
 * matchMedia read rather than by the token layer.
 *
 * IT RENDERS ITS OWN DOCUMENT. html and body are declared here because there is
 * no layout above to provide them.
 *
 * It also cannot export `metadata`, being a Client Component, so the title is
 * set through React 19's hoistable <title>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const dark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches

  const bg = dark ? '#202417' : '#ede0d4'
  const fg = dark ? '#ede0d4' : '#414833'
  const muted = dark ? '#b9b2a4' : '#5c6444'
  const accent = dark ? '#a68a64' : '#7f5539'
  const onAccent = dark ? '#202417' : '#ede0d4'

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: bg,
          color: fg,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <title>Something went wrong</title>
        <main style={{ margin: '0 auto', maxWidth: '38rem', padding: '2rem 1.5rem' }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875rem',
              color: muted,
            }}
          >
            Error
          </p>
          <h1
            style={{
              margin: '0.75rem 0 0',
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              fontWeight: 600,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: '1.5rem 0 0',
              maxWidth: '46ch',
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: muted,
            }}
          >
            The page failed before it could load its own styles, which is why this looks
            so bare. Reloading usually clears it.
          </p>
          <div
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: '2.75rem',
                padding: '0 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: accent,
                color: onAccent,
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/*
              A plain anchor, not next/link, and this is the one file where that
              is right. global-error replaces the root layout, so the router
              context is gone: a Link here would render but could not navigate.
              A full document load is exactly what recovery needs.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: '2.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 1.5rem',
                borderRadius: '0.5rem',
                border: `1px solid ${muted}`,
                color: fg,
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Back to the start
            </a>
          </div>
          {error.digest ? (
            <p
              style={{
                marginTop: '2rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                color: muted,
              }}
            >
              Reference {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}
