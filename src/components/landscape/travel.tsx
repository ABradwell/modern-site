'use client'

import { motion, useTransform, type MotionStyle, type MotionValue } from 'motion/react'
import {
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'

/**
 * Upward travel for one landscape layer: -scrollY * speed, in pixels.
 *
 * A layer at speed 1.0 tracks page content exactly; below 1.0 it falls behind
 * and reads as distant; above 1.0 it outruns the content and lifts away.
 *
 * ON THE COMPOSITOR WHERE IT CAN BE. The page scrolls on the compositor thread.
 * A transform written from JavaScript lands on the main thread, one frame
 * behind whenever that thread is busy, and the near treeline is painted over
 * the content, so every late frame showed as the trees wobbling against the
 * page. Where scroll-driven animations exist, the `.landscape-travel` rule in
 * globals.css runs the travel as a CSS animation on the root scroll timeline,
 * which the compositor advances in the same frame as the scroll itself. Motion
 * drives it only where the browser has no scroll timeline.
 *
 * The CSS animation writes `translate` and Motion writes `transform`. They are
 * separate properties that compose, so whichever path is idle holds its
 * identity value and the two can never fight.
 *
 * ON LAYERS. The class also carries `will-change: transform`, so each depth is
 * its own compositor layer. Before this, every depth shared one layer per band,
 * and moving any row repainted the whole band: every SVG mask, at device pixel
 * ratio, on every frame of every scroll and every pan.
 *
 * `still` collapses the output instead of skipping the hook, so hook order
 * stays stable if the reader flips the OS reduced-motion setting mid-session.
 * The CSS path is gated on the same media query in globals.css.
 */
export function Travel({
  scrollY,
  speed,
  still,
  className,
  style,
  children,
}: {
  scrollY: MotionValue<number>
  speed: number
  still: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const native = useNativeTravel()
  const y = useTransform(scrollY, (v) => (still || native ? 0 : -v * speed))

  return (
    <motion.div
      className={['landscape-travel', className].filter(Boolean).join(' ')}
      style={{ ...style, y, '--travel-speed': speed } as MotionStyle}
    >
      {children}
    </motion.div>
  )
}

const NATIVE_QUERY = 'animation-timeline: scroll()'

const noSubscribe = () => () => {}

/**
 * Whether the browser runs the travel itself. False on the server and during
 * hydration, so the first client render matches the static HTML.
 */
function useNativeTravel(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => CSS.supports(NATIVE_QUERY),
    () => false,
  )
}

/**
 * Publishes the root scroll range as `--travel-max`.
 *
 * A scroll timeline only reports progress from 0 to 1, so the keyframes need
 * the range in pixels to turn progress back into distance: progress * range *
 * speed is exactly scrollY * speed. The range changes on resize and on every
 * route change, since each page is a different height, and nowhere else, so
 * this runs a handful of times per session rather than once per frame.
 *
 * Mounted once, by the landscape.
 */
export function useTravelRange() {
  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      const range = Math.max(0, root.scrollHeight - root.clientHeight)
      root.style.setProperty('--travel-max', `${range}px`)
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(root)
    observer.observe(document.body)
    window.addEventListener('resize', sync)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sync)
      root.style.removeProperty('--travel-max')
    }
  }, [])
}
