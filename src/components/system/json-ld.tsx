/**
 * One JSON-LD script tag.
 *
 * Exists so that the four routes and the layout do not each repeat a
 * `dangerouslySetInnerHTML` call. The name is alarming and the usage here is
 * not: the only input is a literal built in src/lib/schema.ts from the typed
 * content modules, `JSON.stringify` is what escapes it, and no user input
 * reaches this file. It is the documented way to emit JSON-LD from a Server
 * Component, since React would otherwise escape the braces into entities.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
