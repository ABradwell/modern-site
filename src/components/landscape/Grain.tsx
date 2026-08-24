/**
 * Film grain.
 *
 * Fixed and pointer-events-none, which is a hard requirement rather than
 * tidiness: a noise filter on a scrolling container forces continuous GPU
 * repaints and destroys frame rate on mobile. Because this layer never scrolls,
 * it composites once and costs nothing thereafter.
 *
 * The texture is an inline SVG feTurbulence rather than a raster tile, so it
 * adds no request and no bytes worth measuring.
 */
import { Z } from '@/lib/z'

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: Z.grain,
        backgroundImage: NOISE,
        opacity: 'var(--grain-opacity)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}
