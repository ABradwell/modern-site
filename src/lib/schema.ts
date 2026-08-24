/**
 * Structured data, in one place, derived from the typed content modules.
 *
 * WHAT THIS IS FOR. The pages are already readable prose, which is most of the
 * job. What prose does not give a machine is the relationships: that the wall of
 * technologies belongs to the roles beside it, that five projects are five
 * distinct works with their own repositories and years, that the two articles
 * are hosted somewhere else and are not site content. A crawler, a rich-result
 * pipeline or an agent answering a question about the owner has to infer all of
 * that from layout, and infers it badly. Stating it costs a few kilobytes of
 * JSON that no reader ever sees.
 *
 * ONE GRAPH, NOT SCATTERED NODES. Every page emits `@graph` and every node
 * carries an `@id`, so the Person is declared once in the layout and referenced
 * by id everywhere after. Without ids a consumer reading /projects/ gets a bag
 * of works with no stated author and has to guess from proximity.
 *
 * Everything below reads from src/content, so it cannot drift from what the
 * pages render. Add a project and it appears here; correct a date and it
 * corrects here too.
 */

import { ARTICLES } from '@/content/articles'
import { EDUCATION, ROLES } from '@/content/experience'
import { PROJECTS } from '@/content/projects'
import { SITE } from '@/content/site'
import { SKILLS, SKILL_BY_ID, type SkillId } from '@/content/skills'

/** Stable ids. Every cross-reference in the graph goes through these. */
export const PERSON_ID = `${SITE.url}#person`
export const WEBSITE_ID = `${SITE.url}#website`

/** Absolute, trailing-slashed, matching what sitemap.ts submits. */
function abs(path: string): string {
  const withSlash = path.endsWith('/') ? path : `${path}/`
  return new URL(withSlash, SITE.url).toString()
}

/**
 * Display names, not ids. `stack` fields are keyed to the competency wall, so
 * they hold ids like `react-native`. Publishing the key rather than the name
 * would be publishing an internal identifier as though it were the technology.
 */
function named(ids: readonly string[]): string[] {
  return ids.map((id) => SKILL_BY_ID.get(id as SkillId)?.name ?? id)
}

/** The site-wide graph. Emitted once, from the root layout. */
export const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: SITE.name,
      alternateName: SITE.shortName,
      url: SITE.url,
      jobTitle: SITE.title,
      description: SITE.description,
      email: `mailto:${SITE.email}`,
      worksFor: { '@type': 'Organization', name: SITE.company },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Manchester',
        addressCountry: 'GB',
      },
      alumniOf: EDUCATION.map((e) => ({
        '@type': 'CollegeOrUniversity',
        name: e.institution,
      })),
      knowsLanguage: ['en'],
      sameAs: [SITE.github, SITE.linkedin],
      knowsAbout: SKILLS.filter((s) => s.tier === 1).map((s) => s.name),
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE.url,
      name: `${SITE.name}, ${SITE.title}`,
      description: SITE.description,
      inLanguage: 'en-GB',
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
    },
  ],
}

/**
 * Breadcrumbs. Two levels, because the site is two levels deep and inventing a
 * third would be describing a hierarchy that does not exist.
 */
function breadcrumb(label: string, path: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: label, item: abs(path) },
    ],
  }
}

/** Common shape for a page node that is part of this site and this author. */
function pageNode(type: string, path: string, name: string, description: string) {
  return {
    '@type': type,
    '@id': `${abs(path)}#page`,
    url: abs(path),
    name,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    inLanguage: 'en-GB',
  }
}

/**
 * The landing page. `ProfilePage` rather than a plain WebPage, which is the
 * type consumers look for when the subject of a page is one person.
 */
export const homeGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      ...pageNode('ProfilePage', '/', `${SITE.name}, ${SITE.title}`, SITE.description),
      mainEntity: { '@id': PERSON_ID },
    },
  ],
}

/**
 * Experience. The roles are the substance of this page, so they are stated as
 * `hasOccupation` on the Person rather than left implicit in the markup.
 *
 * Dates are ISO YYYY-MM in the content module, which is already what schema.org
 * wants for a partial date, so they pass through untouched. A null `end` means
 * current, and schema.org's way to say that is to omit endDate entirely rather
 * than to send a null.
 */
export const experienceGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    pageNode(
      'ProfilePage',
      '/skills',
      'Experience',
      'Engineering roles, competencies and education.',
    ),
    breadcrumb('Experience', '/skills'),
    {
      '@id': PERSON_ID,
      hasOccupation: ROLES.map((role) => ({
        '@type': 'EmployeeRole',
        roleName: role.title,
        startDate: role.start,
        ...(role.end ? { endDate: role.end } : {}),
        worksFor: { '@type': 'Organization', name: role.company },
      })),
    },
  ],
}

/**
 * Projects. `SoftwareSourceCode` rather than CreativeWork: every one of them is
 * code with a repository, and the more specific type carries `codeRepository`
 * and `programmingLanguage`, which is most of what a consumer wants to know.
 */
export const projectsGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    pageNode(
      'CollectionPage',
      '/projects',
      'Projects',
      'Selected personal and academic engineering projects.',
    ),
    breadcrumb('Projects', '/projects'),
    {
      '@type': 'ItemList',
      '@id': `${abs('/projects')}#list`,
      numberOfItems: PROJECTS.length,
      itemListElement: PROJECTS.map((project, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareSourceCode',
          name: project.name,
          description: project.summary,
          dateCreated: String(project.year),
          author: { '@id': PERSON_ID },
          programmingLanguage: named(project.stack),
          ...(project.repo ? { codeRepository: project.repo } : {}),
          ...(project.live ? { url: project.live } : {}),
        },
      })),
    },
  ],
}

/**
 * Writing. Each article's `url` is the LinkedIn post, not a path on this site,
 * because that is where the text actually is. Claiming them as site content
 * would be describing pages that do not exist here.
 */
export const writingGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    pageNode(
      'CollectionPage',
      '/articles',
      'Writing',
      'Opinion pieces on software practice, published externally.',
    ),
    breadcrumb('Writing', '/articles'),
    {
      '@type': 'ItemList',
      '@id': `${abs('/articles')}#list`,
      numberOfItems: ARTICLES.length,
      itemListElement: ARTICLES.map((article, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Article',
          headline: article.title,
          abstract: article.summary,
          url: article.href,
          datePublished: String(article.year),
          author: { '@id': PERSON_ID },
          publisher: { '@type': 'Organization', name: article.venue },
        },
      })),
    },
  ],
}
