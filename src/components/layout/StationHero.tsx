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
 * absolute dvh, so where content begins has to be absolute too. Inner pages
 * originally had shorter heroes, which slid their content up into the near
 * treeline: on the mountains station the foreground band ran to 130dvh while
 * content began at 74dvh, and the result was a dark ridge painted across the
 * first heading. Same hero height everywhere, content at 120dvh everywhere,
 * foreground band capped at 118dvh, and the collision cannot recur.
 *
 * min-h in dvh, never h-screen. On iOS Safari vh is measured against the
 * address bar's collapsed state, so h-screen makes the whole composition jump
 * the first time the reader scrolls.
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
      className="relative min-h-[100dvh] pt-28"
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
