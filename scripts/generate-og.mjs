/**
 * Generates src/app/opengraph-image.png, committed to the repo.
 *
 * WHY A SCRIPT AND A COMMITTED FILE, rather than app/opengraph-image.tsx.
 * The file-based convention that renders an ImageResponse at request time does
 * not reliably produce a PNG under `output: 'export'`: it compiles to a route
 * handler, and static export needs those to opt in explicitly, which that
 * convention does not do. The failure is silent and only shows up when somebody
 * shares a link and gets a blank card. So the same renderer runs here instead,
 * once, by hand, and the result is committed. scripts/verify-export.mjs then
 * fails the build if the file ever goes missing.
 *
 *   node scripts/generate-og.mjs
 *
 * The card is drawn from the real panorama, the woods at the Home station, so it
 * cannot drift away from what the site actually looks like. It is flattened by
 * the same renderer the terrain preview uses, then handed to Satori as one SVG.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ImageResponse } from 'next/og.js'

import { LIGHT, renderWindow } from './lib/terrain-render.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The generated terrain module is TypeScript, so Node cannot import it. Read the
 * object literal out of it instead. That is safe here precisely because the file
 * is machine-written and its shape is fixed by the generator.
 */
function loadPanorama() {
  const src = readFileSync(resolve(root, 'src/content/terrain.generated.ts'), 'utf8')
  const start = src.indexOf('= {', src.indexOf('export const PANORAMA'))
  return JSON.parse(src.slice(start + 2, src.lastIndexOf('}') + 1))
}

const W = 1200
const H = 630

const COLOUR = {
  skyHigh: '#f5efe9',
  skyMid: '#ede0d4',
  skyLow: '#d3c2b0',
  ink: '#414833',
  muted: '#5c6444',
  orb: '#a68a64',
  terrain: { 1: '#414833', 2: '#656d4a', 3: '#817854', 4: '#bca68d' },
}

const font = (file) =>
  readFileSync(resolve(root, 'node_modules/geist/dist/fonts/geist-sans', file))

/**
 * Maps scene units onto the card. At 5.4 the nearest treetops land at roughly
 * 248px, which leaves the top 40 percent of the card clear for type and puts the
 * near row's ground line just inside the bottom edge.
 */
const SCALE = 5.4
const terrain = renderWindow(loadPanorama(), {
  x0: 0,
  x1: 100,
  width: W,
  height: H,
  pxPerVu: SCALE,
  colours: { ...LIGHT, ...COLOUR.terrain },
})
const bands = [
  {
    type: 'img',
    props: {
      src: `data:image/svg+xml;base64,${Buffer.from(terrain).toString('base64')}`,
      width: W,
      height: H,
      style: { position: 'absolute', left: 0, top: 0 },
    },
  },
]

const image = new ImageResponse(
  {
    type: 'div',
    props: {
      style: {
        width: W,
        height: H,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(to bottom, ${COLOUR.skyHigh} 0%, ${COLOUR.skyMid} 46%, ${COLOUR.skyLow} 100%)`,
        fontFamily: 'Geist',
      },
      children: [
        // The sun. Same palette value the page uses.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 54,
              left: 946,
              width: 172,
              height: 172,
              borderRadius: 999,
              backgroundImage: `radial-gradient(circle at 38% 34%, #cbb495 0%, ${COLOUR.orb} 62%, #8f7752 100%)`,
            },
          },
        },
        ...bands,
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              padding: '52px 72px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 64,
                    fontWeight: 600,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.04,
                    color: COLOUR.ink,
                    maxWidth: 640,
                  },
                  children: 'Aiden Stevenson Bradwell',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 22,
                    fontSize: 27,
                    fontWeight: 400,
                    color: COLOUR.muted,
                    maxWidth: 640,
                  },
                  children: 'Engineering Team Lead at zally, Manchester',
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    width: W,
    height: H,
    fonts: [
      { name: 'Geist', data: font('Geist-Regular.ttf'), weight: 400, style: 'normal' },
      { name: 'Geist', data: font('Geist-SemiBold.ttf'), weight: 600, style: 'normal' },
    ],
  },
)

const png = Buffer.from(await image.arrayBuffer())
const out = resolve(root, 'src/app/opengraph-image.png')
writeFileSync(out, png)
writeFileSync(
  resolve(root, 'src/app/opengraph-image.alt.txt'),
  'Aiden Stevenson Bradwell, Engineering Team Lead at zally in Manchester, over an illustrated conifer treeline at dawn.',
  'utf8',
)
console.log(`wrote src/app/opengraph-image.png  ${W}x${H}, ${png.length} bytes`)
