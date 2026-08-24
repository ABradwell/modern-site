'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
  readonly fallback: ReactNode
  readonly label: string
}

interface State {
  readonly failed: boolean
}

/**
 * A local error boundary for a single client island.
 *
 * This exists because app/error.tsx replaces the ENTIRE route segment. Without
 * a boundary here, one throw inside the animated landscape would blank the whole
 * page. With it, the landscape falls back to a still frame and everything else
 * on the page carries on.
 *
 * A class, because React error boundaries still have to be. Hand-written rather
 * than pulling in react-error-boundary, so the fallback contract stays ours and
 * the dependency count stays honest for twenty-five lines of code.
 */
export class ClientBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced rather than swallowed. A silent degrade is worse than a noisy
    // one, because nobody ever finds out the island stopped working.
    console.error(`[${this.props.label}] fell back to its static frame`, error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
