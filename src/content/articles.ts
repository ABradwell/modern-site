import type { Article } from './types'

/**
 * Two. Both are opinion pieces published on LinkedIn.
 *
 * Four undergraduate coursework PDFs from the old site are deliberately absent.
 * One was a placement report and three were psychology papers, none of them
 * peer reviewed, and one had a student number embedded in its filename. Nothing
 * on this page should read as a publication record, because there isn't one.
 */
export const ARTICLES: readonly Article[] = [
  {
    slug: 'under-trained-and-overconfident',
    title: 'The Dangers of Under-Trained and Overconfident Programmers',
    summary:
      'On where the computer science job market is heading, and what happens when confidence outruns training.',
    href: 'https://www.linkedin.com/pulse/dangers-under-trained-over-confident-programmers-aiden-bradwell/',
    venue: 'LinkedIn',
    year: 2023,
  },
  {
    slug: 'object-oriented-laymans-code',
    title: 'Object-Oriented Programming, the (Im)Perfect Layman’s Code',
    summary:
      'An argument against reaching for object orientation by reflex, and what the reflex costs.',
    href: 'https://www.linkedin.com/pulse/object-oriented-programming-imperfect-laymans-code-aiden-bradwell/',
    venue: 'LinkedIn',
    year: 2023,
  },
] as const

export const ARTICLES_NOTE =
  'Two pieces so far, both written on the way out of university. More is coming, most likely about authentication and about what streaming systems do to your assumptions.'
