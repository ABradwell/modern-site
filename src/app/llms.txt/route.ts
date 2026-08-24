import { ARTICLES } from '@/content/articles'
import { CREDENTIALS, EDUCATION, MINOR_ROLES, ROLES } from '@/content/experience'
import { PROJECTS } from '@/content/projects'
import { ABOUT, SITE } from '@/content/site'
import {
  SKILLS,
  SKILL_BY_ID,
  WALL_GROUPS,
  skillsIn,
  type SkillId,
} from '@/content/skills'
import { STATIONS } from '@/content/stations'
import { range } from '@/lib/dates'

/**
 * Required under `output: 'export'`. Metadata routes and route handlers compile
 * the same way, and static export refuses to collect one that has not declared
 * itself static.
 */
export const dynamic = 'force-static'

/**
 * /llms.txt, the plain-text digest of this site.
 *
 * WHY THIS EXISTS. The pages are four HTML documents whose content is carried
 * by a canvas-backed landscape, a swipe gesture, an accordion and a good deal
 * of Tailwind. A browser resolves all of that. A model given the raw HTML gets
 * roughly fifty inline RSC flight payloads, an SVG terrain mask measured in
 * kilobytes, and the prose interleaved between them. Everything it wants is in
 * there and almost none of it is easy to find. This file is the same
 * information with the presentation removed: one document, in reading order,
 * that answers who this is, what they have done, and how to reach them.
 *
 * It follows the llms.txt convention: markdown at a well-known root path,
 * headings for structure, and links out to the canonical pages rather than a
 * replacement for them. It is a summary and says so, so nothing here competes
 * with the HTML for canonical status.
 *
 * WHY A ROUTE HANDLER AND NOT public/llms.txt. A file in public/ would be a
 * second copy of the content, hand-maintained, drifting from src/content the
 * first time a role changed. This reads the same typed modules the pages render
 * from, so the two cannot disagree: add a project and it appears in both, fix a
 * date and it is fixed in both. The extension in the segment name is what makes
 * Next write it to out/llms.txt rather than a directory index, and
 * verify-export.mjs asserts that on every build.
 *
 * KEEP IT PROSE. The temptation is to dump JSON. The structured form of this
 * site is already published, as JSON-LD on every page (see src/lib/schema.ts).
 * This file is the readable form, and readable is what it is for.
 */
export async function GET() {
  const url = (path: string) =>
    new URL(path.endsWith('/') ? path : `${path}/`, SITE.url).toString()

  /**
   * Display names, not ids. `Role.stack` is keyed to the competency wall, so it
   * holds ids like `react-native` and `nodejs`. The pages resolve those through
   * the registry before rendering and so does this, because a reader of any kind
   * is better served by "React Native" than by the key it is stored under.
   */
  const named = (ids: readonly string[]) =>
    ids.map((id) => SKILL_BY_ID.get(id as SkillId)?.name ?? id).join(', ')

  const lines: string[] = []
  const push = (...ls: string[]) => lines.push(...ls)

  push(
    `# ${SITE.name}`,
    '',
    `> ${SITE.description} Based in ${SITE.location}.`,
    '',
    'This file is a plain-text summary of the whole site, provided for automated',
    'readers. The canonical pages are linked from each section below.',
    '',
    '## About',
    '',
  )

  push(...ABOUT.map((paragraph) => `${paragraph}\n`))

  push(
    '## Contact',
    '',
    `- Email: ${SITE.email}`,
    `- GitHub: ${SITE.github}`,
    `- LinkedIn: ${SITE.linkedin}`,
    ...(SITE.phone ? [`- Phone: ${SITE.phone.display}`] : []),
    '',
    '## Pages',
    '',
    ...STATIONS.map((s) => `- [${s.label}](${url(s.href)})`),
    '',
    `## Experience ([full detail](${url('/skills')}))`,
    '',
  )

  for (const role of ROLES) {
    push(
      `### ${role.title}, ${role.company}`,
      '',
      `${range(role.start, role.end)}. ${role.location}.`,
      '',
      role.summary,
      '',
    )

    push(...role.highlights.map((h) => `- ${h}`), '')
    push(`Core stack: ${named(role.stack)}.`, '')
  }

  if (MINOR_ROLES.length) {
    push(
      '### Earlier roles',
      '',
      ...MINOR_ROLES.map(
        (r) => `- ${r.title}, ${r.company} (${range(r.start, r.end)}). ${r.note}`,
      ),
      '',
    )
  }

  push('## Competencies', '')

  for (const group of WALL_GROUPS) {
    const names = skillsIn(group.key)
      .map((s) => s.name)
      .join(', ')
    push(`- ${group.label}: ${names}`)
  }

  const behind = SKILLS.filter((s) => s.tier === 2).map((s) => s.name)
  if (behind.length) push('', `Also worked with: ${behind.join(', ')}.`)

  push('', '## Education', '')

  for (const e of EDUCATION) {
    push(
      `### ${e.qualification}, ${e.institution}`,
      '',
      `${range(e.start, e.end)}. ${e.location}.`,
      '',
      ...e.honours.map((h) => `- ${h}`),
      '',
    )
  }

  push('## Credentials', '', ...CREDENTIALS.map((c) => `- ${c}`), '')

  push(`## Projects ([full detail](${url('/projects')}))`, '')

  for (const p of PROJECTS) {
    push(
      `### ${p.name} (${p.year})`,
      '',
      p.summary,
      '',
      p.detail,
      '',
      `Built with: ${named(p.stack)}.`,
      ...(p.repo ? [`Repository: ${p.repo}`] : []),
      ...(p.live ? [`Live: ${p.live}`] : []),
      ...(p.credit ? [`Credit: ${p.credit}`] : []),
      '',
    )
  }

  push(`## Writing ([index](${url('/articles')}))`, '')

  for (const a of ARTICLES) {
    push(
      `### ${a.title} (${a.year}, ${a.venue})`,
      '',
      a.summary,
      '',
      `Read it: ${a.href}`,
      '',
    )
  }

  return new Response(`${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Static export writes this to disk and the host serves it, so this
      // header only applies where a host honours it. Harmless where it does not.
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
