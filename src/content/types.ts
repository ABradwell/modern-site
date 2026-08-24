/**
 * Content types.
 *
 * Every page on this site is pure presentation over these structures. The site
 * has no CMS and no database on purpose: the content is small, changes rarely,
 * and benefits far more from compile-time checking than from an editor.
 *
 * Two guards do real work here. `satisfies` in skills.ts preserves literal
 * types so `SkillId` becomes a union of the actual ids, which means a typo in a
 * role's `stack` is a build error. And `Record<IconSkillId, ...>` in the brand
 * registry means adding an icon-backed technology without wiring its mark is
 * also a build error, rather than a blank cell on the wall.
 */

export type SkillCategory =
  'languages' | 'cloud' | 'data' | 'infrastructure' | 'frameworks' | 'practice'

export interface Skill {
  readonly id: string
  readonly name: string
  /**
   * Simple Icons component name, or null for a set-in-type chip.
   *
   * null is not a gap to fill later. Amazon, Microsoft and Google all had their
   * marks removed from Simple Icons on trademark request, so there is no
   * lawful, non-fabricated logo available for AWS. Drawing one would be
   * inventing another company's brand mark. The wall therefore runs two
   * registers: a brand mark where one legitimately exists, and set type where
   * it does not. That is also what stops it becoming thirty identical cells.
   */
  readonly icon: string | null
  readonly category: SkillCategory
  /** 1 sits on the wall. 2 sits behind a disclosure. */
  readonly tier: 1 | 2
  /**
   * Per-mark optical correction, 1 meaning none. A wide wordmark and a square
   * glyph at the same height carry very different visual weight, so a handful
   * of marks need nudging to sit as one system.
   */
  readonly opticalScale?: number
}

/**
 * A step inside a single employer.
 *
 * Separate from Role because a promotion is not a new job: collapsing a
 * progression into four sibling role cards would say a reader had four
 * employers, and splitting one employer's dates across cards makes the tenure
 * unreadable. So one card, with the arc inside it.
 */
export interface Milestone {
  /** ISO YYYY-MM, the month the step started. */
  readonly date: string
  readonly title: string
  /** One short line on what changed. Optional: not every step needs one. */
  readonly note?: string
}

export interface Role {
  readonly company: string
  readonly title: string
  /** ISO YYYY-MM. `end` null means current. */
  readonly start: string
  readonly end: string | null
  readonly location: string
  readonly summary: string
  /** Two to four. Ruthlessly cut, because nobody reads the fifth. */
  readonly highlights: readonly string[]
  readonly stack: readonly string[]
  readonly logo?: { readonly src: string; readonly alt: string }
  /**
   * Ordered oldest to newest. Present only where the role actually changed
   * shape over its tenure, so a two-month placement does not get a timeline
   * with one node on it.
   */
  readonly progression?: readonly Milestone[]
}

/** Shorter-form roles that would crowd the main list. */
export interface MinorRole {
  readonly company: string
  readonly title: string
  readonly start: string
  readonly end: string | null
  readonly note: string
}

export interface Education {
  readonly institution: string
  readonly qualification: string
  readonly start: string
  readonly end: string
  readonly location: string
  readonly honours: readonly string[]
}

export interface Project {
  readonly slug: string
  readonly name: string
  readonly year: number
  /** Twenty-five words at most. */
  readonly summary: string
  readonly detail: string
  readonly stack: readonly string[]
  readonly repo?: string
  readonly live?: string
  readonly image?: {
    readonly src: string
    readonly alt: string
    readonly width: number
    readonly height: number
  }
  /** Preserved attribution where a project leans on someone else's work. */
  readonly credit?: string
  readonly featured: boolean
}

export interface Article {
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly href: string
  readonly venue: string
  readonly year: number
}

export interface PhoneNumber {
  /** E.164. Used for the `tel:` href, so no spaces or punctuation. */
  readonly e164: string
  /** Spaced for reading. */
  readonly display: string
}

export interface SiteConfig {
  readonly name: string
  readonly shortName: string
  readonly title: string
  readonly company: string
  readonly location: string
  readonly url: string
  readonly description: string
  readonly email: string
  /**
   * null means the contact section offers no phone route, and the page is
   * correct without one. It is NOT a placeholder: a plausible-looking number
   * invented to fill the slot is somebody else's real phone.
   */
  readonly phone: PhoneNumber | null
  readonly github: string
  readonly linkedin: string
  /** One contact label, used in the nav, the hero and the footer alike. */
  readonly contactLabel: string
}
