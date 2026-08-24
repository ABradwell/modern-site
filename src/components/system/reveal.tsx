'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import {
  EASE_OUT_EXPO,
  REVEAL_DURATION,
  REVEAL_OFFSET,
  REVEAL_STAGGER,
  REVEAL_VIEWPORT,
} from '@/lib/motion'

/**
 * Scroll reveal. Motion's whileInView, not a scroll listener, and not GSAP.
 *
 * The site has exactly one advanced scroll composition, the landscape. Every
 * other piece of motion is this: twelve pixels and six hundred milliseconds on
 * an expo-out curve. It exists to establish reading order, not to perform, and
 * that restraint is the reason the landscape reads as the one deliberate
 * gesture rather than as one effect among many.
 */
export function Reveal({
  children,
  index = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  /** Position in a group, for the stagger. */
  index?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'article'
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as]

  if (reduce) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{
        duration: REVEAL_DURATION,
        ease: EASE_OUT_EXPO,
        delay: index * REVEAL_STAGGER,
      }}
    >
      {children}
    </Tag>
  )
}
