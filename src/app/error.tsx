'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Z } from '@/lib/z'

/**
 * A client error boundary for the route segment.
 *
 * It works under `output: 'export'` because it never needed a server: it is
 * compiled into the client bundle and catches render and hydration failures in
 * the browser. What it cannot do here is catch a server error at request time,
 * since under static export there are no requests.
 *
 * NOTE THE PROP NAME. Next 16 passes `retry`, not the `reset` that older
 * examples show. Wiring a button to `reset` here would compile and then do
 * nothing at all when clicked.
 *
 * This replaces the ENTIRE segment when it fires, which is exactly why the
 * landscape is additionally wrapped in its own local boundary. A failure in one
 * animation should not take a page down to this.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('route segment failed', error)
  }, [error])

  return (
    <section
      className="relative flex min-h-[var(--scene)] items-center pt-28"
      style={{ zIndex: Z.content }}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="font-mono text-sm text-muted-foreground">Error</p>
        <h1
          className="mt-4 max-w-[26ch] text-4xl font-semibold tracking-tighter text-foreground md:text-5xl"
          style={{ lineHeight: 1.08 }}
        >
          This page came apart
        </h1>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          Something in the page failed while rendering. Trying again often works, because
          most failures here are transient.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-11 items-center rounded-ctl bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-ctl border border-border-strong px-6 text-sm font-medium text-foreground transition-transform duration-200 active:scale-[0.98] motion-reduce:transition-none"
          >
            Back to the start
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            Reference {error.digest}
          </p>
        ) : null}
      </div>
    </section>
  )
}
