import * as Icons from '@icons-pack/react-simple-icons'

import type { IconSkillId } from '@/content/skills'

/**
 * The ONLY file in the project allowed to import @icons-pack/react-simple-icons.
 *
 * Keeping the brand-logo dependency behind one module means the "one icon
 * family" rule stays enforceable by grep: Phosphor is the UI icon set
 * everywhere, and brand marks only ever arrive through here.
 *
 * LICENSING. Simple Icons path data is CC0, but the trademarks it depicts are
 * not, and the project ships a disclaimer asking users to read it. Two rules
 * follow, both observed in this codebase. The version is pinned, because icons
 * have been removed on legal request before and an unpinned bump would break a
 * build. And the wall is headed "Technologies", never "Trusted by" or
 * "Partners": these are things this person has worked with, not customers, so
 * the honest heading is also the one that implies no endorsement.
 *
 * Typed as Record<IconSkillId, ...>, so adding an icon-backed skill without
 * wiring its mark is a compile error rather than a blank cell on the page.
 */
/**
 * Structural props only, plus the SVG passthrough the wall actually uses:
 * aria-hidden, because the pill sets the name in text beside the mark, and
 * style, for the per-mark optical correction. Widened from a closed four-key
 * shape, which silently rejected both.
 */
type BrandIcon = (
  props: React.SVGProps<SVGSVGElement> & {
    size?: number | string
    title?: string
  },
) => React.ReactNode

export const BRAND_MARKS: Record<IconSkillId, BrandIcon> = {
  python: Icons.SiPython,
  typescript: Icons.SiTypescript,
  javascript: Icons.SiJavascript,
  java: Icons.SiOpenjdk,
  go: Icons.SiGo,
  swift: Icons.SiSwift,
  cpp: Icons.SiCplusplus,
  kotlin: Icons.SiKotlin,
  postgresql: Icons.SiPostgresql,
  mysql: Icons.SiMysql,
  firebase: Icons.SiFirebase,
  terraform: Icons.SiTerraform,
  sst: Icons.SiSst,
  docker: Icons.SiDocker,
  kubernetes: Icons.SiKubernetes,
  git: Icons.SiGit,
  linux: Icons.SiLinux,
  openapi: Icons.SiOpenapiinitiative,
  jira: Icons.SiJira,
  confluence: Icons.SiConfluence,
  react: Icons.SiReact,
  'react-native': Icons.SiReact,
  nodejs: Icons.SiNodedotjs,
  tensorflow: Icons.SiTensorflow,
  opencv: Icons.SiOpencv,
  'spring-boot': Icons.SiSpringboot,
  vite: Icons.SiVite,
  fastapi: Icons.SiFastapi,
  flink: Icons.SiApacheflink,
  kafka: Icons.SiApachekafka,
  express: Icons.SiExpress,
  'robot-framework': Icons.SiRobotframework,
  numpy: Icons.SiNumpy,
  pandas: Icons.SiPandas,
}
