import {
  ArrowUpRight,
  EnvelopeSimple,
  GithubLogo,
  LinkedinLogo,
  Phone,
} from '@phosphor-icons/react/dist/ssr'

import { SITE } from '@/content/site'
import { CHIP, META } from '@/lib/type'

/**
 * The ways to reach a person, as a list.
 *
 * Every row is a real link that hands off to the right application: mailto to
 * the mail client, tel to the dialler, the rest to the browser. The hero's
 * contact button used to be a bare mailto, which fires the reader's mail client
 * at them with no warning and nothing to look at if they do not have one
 * configured. It now scrolls here instead, so the reader sees the options and
 * picks one.
 *
 * A hairline-divided list rather than a grid of cards, for two reasons. It is
 * the same idiom as the skills wall, the roles list and the writing list, so it
 * costs the page no new layout family. And it holds three rows as gracefully as
 * four, which matters because the phone row appears only when there is a number
 * to put in it, and a two-column grid of three items has a hole in it.
 */
// Taken off one of the icons rather than imported: the `Icon` type lives in
// @phosphor-icons/react/dist/lib, and reaching into a second entry point of the
// same package for a type that is already in hand is a path to get wrong later.
type IconComponent = typeof EnvelopeSimple

interface Route {
  readonly icon: IconComponent
  readonly label: string
  readonly value: string
  readonly href: string
  readonly external: boolean
}

/** `github.com/ABradwell` reads better as `ABradwell`. */
function handle(url: string): string {
  return new URL(url).pathname.replace(/^\/+|\/+$/g, '')
}

function routes(): readonly Route[] {
  const list: Route[] = [
    {
      icon: EnvelopeSimple,
      label: 'Email',
      value: SITE.email,
      href: `mailto:${SITE.email}`,
      external: false,
    },
  ]

  if (SITE.phone) {
    list.push({
      icon: Phone,
      label: 'Phone',
      value: SITE.phone.display,
      href: `tel:${SITE.phone.e164}`,
      external: false,
    })
  }

  list.push(
    {
      icon: LinkedinLogo,
      label: 'LinkedIn',
      value: handle(SITE.linkedin),
      href: SITE.linkedin,
      external: true,
    },
    {
      icon: GithubLogo,
      label: 'GitHub',
      value: handle(SITE.github),
      href: SITE.github,
      external: true,
    },
  )

  return list
}

export function ContactRoutes() {
  return (
    <ul className="max-w-[42ch] divide-y divide-border border-y border-border">
      {routes().map((route) => (
        <li key={route.label}>
          <a
            href={route.href}
            {...(route.external ? { target: '_blank', rel: 'me noreferrer' } : {})}
            className="group flex items-center gap-4 py-4 transition-colors hover:bg-muted/40 motion-reduce:transition-none"
          >
            <route.icon
              className="size-5 shrink-0 text-primary"
              weight="regular"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className={`block ${CHIP} text-muted-foreground`}>{route.label}</span>
              <span className={`block truncate ${META} font-medium text-foreground`}>
                {route.value}
              </span>
            </span>
            <ArrowUpRight
              className="size-4 shrink-0 text-primary opacity-60 transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
              weight="regular"
              aria-hidden
            />
          </a>
        </li>
      ))}
    </ul>
  )
}
