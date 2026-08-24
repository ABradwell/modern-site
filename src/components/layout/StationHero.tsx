'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { ReactNode } from 'react'

import { Z } from '@/lib/z'

/**
 * The hero band at every station.
 *
 * Transparent by design: the landscape lives in the root layout behind it, so
 * this contributes only type and spacing. It carries no background of its own,
 * or it would paint over the sky.
 *
 * ONE HEIGHT ON EVERY ROUTE. The landscape is a fixed composition measured in
 * absolute scene units, so where content begins has to be absolute too. Inner
 * pages originally had shorter heroes, which slid their content up into the
 * near treeline: on the mountains station the foreground band ran to 130 while
 * content began at 74, and the result was a dark ridge painted across the first
 * heading. Same hero height everywhere, content at 120 everywhere, foreground
 * band capped at 118, and the collision cannot recur.
 *
 * min-h in SCENE units, never h-screen and never a bare 100dvh. The scene has
 * a floor (see --scene in globals.css), and it has one because of landscape
 * phones: at a 390px viewport a 100dvh hero is shorter than its own copy, so
 * the headline, the paragraph and the buttons were squeezed down into the
 * treeline. The terrain reads from the same unit, so the whole composition
 * stops shrinking together and the copy keeps its clearance at any rotation.
 *
 * pt-28 clears the 64px fixed header and stays inside the hero top-padding cap.
 * The copy is not pushed to the vertical centre with padding; its position comes
 * from the layer composition behind it.
 */
export function StationHero({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()

  // The copy fades as the terrain rises past it. No translate: the copy is in
  // normal flow, so it already moves at content speed, and adding travel on top
  // would make it drift out of step with the section it belongs to.
  const opacity = useTransform(scrollY, (y) =>
    reduce ? 1 : Math.max(0, 1 - Math.max(0, y - 60) / 420),
  )

  return (
    <section
      aria-labelledby="station-title"
      className="relative min-h-[var(--scene)] pt-28"
      style={{ zIndex: Z.content }}
    >
      <motion.div
        style={{ opacity }}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 md:grid-cols-12 md:px-8"
      >
        <div className="md:col-span-7 md:col-start-1 lg:col-span-6">{children}</div>
      </motion.div>
    </section>
  )
}
