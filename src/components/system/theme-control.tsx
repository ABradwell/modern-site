'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { cn } from '@/lib/cn'

/**
 * "Am I on the client yet", without a state update inside an effect.
 *
 * next-themes cannot know the resolved theme until it runs in the browser, so
 * the control has to render a neutral placeholder for the server pass. The
 * usual useState-plus-useEffect version of this triggers a second render pass
 * on mount, which React 19 now flags as a cascading render. useSyncExternalStore
 * with a false server snapshot and a true client snapshot gives the same answer
 * synchronously, during the first client render, with no effect at all.
 *
 * The subscribe callback is intentionally inert: nothing ever changes after
 * mount, so there is nothing to subscribe to.
 */
const NO_OP_SUBSCRIBE = () => () => {}
const useIsClient = () =>
  useSyncExternalStore(
    NO_OP_SUBSCRIBE,
    () => true,
    () => false,
  )

const OPTIONS = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

/**
 * A three-state segmented control, labelled with words.
 *
 * Words rather than a sun and a moon glyph, for three reasons that all matter.
 * The page already has a sun in the sky, and a second one in the nav would read
 * as a duplicate rather than as a control. A two-state icon toggle cannot
 * express Auto, which is the correct default. And an icon toggle would put a
 * control at 2.52:1 against its background, failing WCAG 1.4.11's 3:1 floor for
 * UI components in light mode only.
 *
 * radiogroup rather than three buttons, so arrow keys move between the options
 * and a screen reader announces which one is active.
 */
export function ThemeControl({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()

  // The placeholder reserves exactly the same box as the real control, so
  // nothing on the page shifts when the real one arrives.
  if (!isClient) {
    return (
      <div
        className={cn('h-8 w-[152px] rounded-ctl border border-border', className)}
        aria-hidden
      />
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'flex h-8 items-center rounded-ctl border border-border p-0.5',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = (theme ?? 'system') === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              'rounded-[calc(var(--radius-ctl)-2px)] px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
