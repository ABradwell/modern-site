'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

import { STATIONS, stationIndex } from '@/content/stations'
import { PAN_SPRING } from '@/lib/motion'
import { panTarget, stripPct } from '@/lib/station-geometry'

/**
 * Swipe left and right to travel between stations, on touch devices.
 *
 * The site is one landscape read west to east, so a horizontal drag is the
 * gesture the whole design already implies. This owns the pan spring and hands
 * it to the landscape, because a route change and a finger on the screen are two
 * ways of moving the same strip: one spring between them, or a tap and a swipe
 * end up fighting for the same transform.
 *
 * DRAG DRIVES THE SPRING DIRECTLY, via jump() rather than by adding a second
 * offset on top. That matters at the moment of release. With the drag as a
 * separate term, letting go would snap the strip back by the drag distance and
 * only then start travelling, which reads as a stutter. Because the spring's
 * current value already holds the dragged position, set() animates on from
 * exactly where the finger left off.
 *
 * The slide also starts on release rather than waiting for the route to resolve:
 * the spring is aimed at the next station immediately and router.push follows.
 * Neighbours are prefetched, so the payload is usually there already, but the
 * point is that the gesture never feels like it is waiting for the network.
 *
 * WHAT IT REFUSES TO TOUCH, in order of how much trouble each one causes:
 *
 *   Vertical scrolling. Nothing is claimed until the gesture has moved LOCK_PX
 *   and horizontal movement beats vertical by AXIS_RATIO. Until then no
 *   preventDefault is called, so a scroll that happens to start with a few
 *   degrees of wobble stays a scroll. Get this wrong and the page cannot be read
 *   at all on a phone, which makes it the one part worth being fussy about.
 *
 *   The browser's own edge gestures. Touches starting within EDGE_GUARD_PX of
 *   either side are ignored, so iOS Safari keeps its back and forward swipes.
 *
 *   Open dialogs. The mobile nav is a Radix dialog with its own scroll lock, and
 *   swiping inside it should do nothing.
 *
 *   Pinch zoom. Multi-touch aborts the gesture, and touch-action is never
 *   narrowed, so the browser keeps zoom.
 *
 * NOT THE ONLY WAY TO NAVIGATE. WCAG 2.5.1 asks that a path-based gesture have a
 * single-pointer alternative; the nav sheet is that alternative, and it is why
 * this can be an enhancement rather than a control.
 *
 * Touch events only, so it is inert on a mouse. Horizontal wheel and trackpad
 * gestures are deliberately left alone: hijacking those on a desktop is how
 * scroll-jacking gets its reputation.
 */

/** Ignore touches this close to either edge, where the browser has its own gesture. */
const EDGE_GUARD_PX = 24

/** Movement before an axis is chosen. */
const LOCK_PX = 12

/** Horizontal has to beat vertical by this much to claim the gesture. */
const AXIS_RATIO = 1.3

/** Fraction of the viewport that commits a slow drag. */
const COMMIT_FRACTION = 0.22

/** Or px per ms, which commits a flick that never travelled far. */
const COMMIT_VELOCITY = 0.45

/** Drag past the first or last station moves this much, so the end is felt. */
const END_RESISTANCE = 0.28

/**
 * How much page content follows the finger, as a fraction of the drag.
 *
 * Small on purpose. A route change moves the landscape and only fades the
 * content, and that is right for a tap. Under a finger the expectation is
 * different: something has to move with the hand or the gesture feels broken. A
 * quarter is enough to answer that without turning the page into a carousel.
 */
const CONTENT_FOLLOW = 0.25

interface StationSwipeValue {
  /** Strip offset, as a percentage string, ready for a transform. */
  readonly pan: MotionValue<string>
  /** Live drag, in units of one percent of the viewport width. Zero at rest. */
  readonly drag: MotionValue<number>
}

const StationSwipeContext = createContext<StationSwipeValue | null>(null)

function useStationSwipe(): StationSwipeValue {
  const value = useContext(StationSwipeContext)
  if (!value) {
    throw new Error('useStationSwipe must be used inside <StationSwipe>')
  }
  return value
}

/** The strip offset. Consumed by the landscape, which draws it. */
export function useStationPan(): MotionValue<string> {
  return useStationSwipe().pan
}

export function StationSwipe({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const reduce = useReducedMotion() ?? false
  const index = stationIndex(pathname)
  const target = panTarget(index)

  const spring = useSpring(target, reduce ? { duration: 0 } : PAN_SPRING)
  const drag = useMotionValue(0)
  const pan = useMotionTemplate`${spring}%`

  // The listeners are attached once and live for the session, so they read the
  // current station through a ref. Closing over `index` instead would leave a
  // handler that navigates from wherever the reader was when it was attached.
  // Written in an effect rather than during render: a ref mutation in the render
  // body is not safe under concurrent rendering, where a render can be thrown
  // away, and no touch can fire before effects have run anyway.
  const live = useRef({ index, target, reduce })
  useEffect(() => {
    live.current = { index, target, reduce }
  }, [index, target, reduce])

  useEffect(() => {
    if (reduce) spring.jump(target)
    else spring.set(target)
  }, [spring, target, reduce])

  // Both neighbours, so a swipe in either direction has its payload in hand.
  useEffect(() => {
    for (const i of [index - 1, index + 1]) {
      const station = STATIONS[i]
      if (station) router.prefetch(station.href)
    }
  }, [router, index])

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startedAt = 0
    let tracking = false
    let horizontal = false

    const reset = () => {
      tracking = false
      horizontal = false
    }

    const onStart = (event: TouchEvent) => {
      reset()
      if (event.touches.length !== 1) return

      const touch = event.touches[0]
      if (!touch) return

      const target = event.target
      if (target instanceof Element && target.closest('[role="dialog"]')) return
      if (document.body.hasAttribute('data-scroll-locked')) return

      const edge = window.innerWidth - EDGE_GUARD_PX
      if (touch.clientX < EDGE_GUARD_PX || touch.clientX > edge) return

      startX = touch.clientX
      startY = touch.clientY
      startedAt = performance.now()
      tracking = true
    }

    const onMove = (event: TouchEvent) => {
      if (!tracking) return
      if (event.touches.length !== 1) {
        reset()
        return
      }

      const touch = event.touches[0]
      if (!touch) return

      const dx = touch.clientX - startX
      const dy = touch.clientY - startY

      if (!horizontal) {
        // Undecided. Claim nothing and prevent nothing until the direction is
        // unambiguous, or a slightly wobbly scroll becomes a navigation.
        if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return
        if (Math.abs(dx) <= Math.abs(dy) * AXIS_RATIO) {
          reset()
          return
        }
        horizontal = true
      }

      // Claimed. Stop the browser scrolling underneath the gesture.
      event.preventDefault()

      const { index: from, target: base, reduce: still } = live.current
      if (still) return

      const wanted = dx < 0 ? from + 1 : from - 1
      const travel = STATIONS[wanted] ? dx : dx * END_RESISTANCE
      const vw = (travel / window.innerWidth) * 100

      drag.set(vw)
      spring.jump(base + stripPct(vw))
    }

    const onEnd = (event: TouchEvent) => {
      if (!tracking || !horizontal) {
        reset()
        return
      }

      const touch = event.changedTouches[0]
      const dx = touch ? touch.clientX - startX : 0
      const elapsed = Math.max(1, performance.now() - startedAt)
      const { index: from, target: base, reduce: still } = live.current

      const wanted = dx < 0 ? from + 1 : from - 1
      const next = STATIONS[wanted]
      const committed =
        !!next &&
        (Math.abs(dx) > window.innerWidth * COMMIT_FRACTION ||
          Math.abs(dx / elapsed) > COMMIT_VELOCITY)

      if (committed && next) {
        // Aim first, navigate second.
        const aim = panTarget(wanted)
        if (still) spring.jump(aim)
        else spring.set(aim)
        router.push(next.href)
      } else if (!still) {
        spring.set(base)
      }

      if (still) drag.jump(0)
      else animate(drag, 0, PAN_SPRING)

      reset()
    }

    // touchmove is the only non-passive listener, because it is the only one
    // that ever calls preventDefault.
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [router, spring, drag])

  const value = useMemo(() => ({ pan, drag }), [pan, drag])

  return (
    <StationSwipeContext.Provider value={value}>{children}</StationSwipeContext.Provider>
  )
}

/**
 * Page content, translated a little while a swipe is in progress.
 *
 * `transform` rather than Motion's `x` shorthand, resolving to the literal
 * `none` at rest. A translate of zero is still a transform, and a transform
 * establishes a containing block for fixed descendants and a new stacking
 * context. Leaving one permanently wrapped around every page would be a trap
 * waiting for the first `position: fixed` element anyone adds to a page.
 */
export function StationSwipeContent({ children }: { children: ReactNode }) {
  const { drag } = useStationSwipe()
  const transform = useTransform(drag, (v) =>
    v === 0 ? 'none' : `translate3d(${(v * CONTENT_FOLLOW).toFixed(3)}vw, 0, 0)`,
  )

  return <motion.div style={{ transform }}>{children}</motion.div>
}
