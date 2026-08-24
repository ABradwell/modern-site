'use client'

import { ThemeProvider as NextThemes } from 'next-themes'
import type { ReactNode } from 'react'

/**
 * `attribute="data-theme"` rather than the class strategy, because the token
 * layer in globals.css is keyed on [data-theme]. The three states it produces
 * are what the :root:not([data-theme]) block exists to serve.
 *
 * `disableTransitionOnChange` stops every tinted surface, hairline and terrain
 * band on the page from animating at once when the theme flips, which reads as
 * a smear rather than as a switch.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemes>
  )
}
