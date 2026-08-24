/**
 * First focusable element in the document. Paired with
 * <main id="content" tabIndex={-1}>, where the tabIndex is the part that
 * actually moves focus in Safari rather than only scrolling the page.
 */
export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only rounded-ctl bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lift focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70]"
    >
      Skip to content
    </a>
  )
}
