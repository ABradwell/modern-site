import type { Skill } from './types'

/**
 * `satisfies` rather than a type annotation, so the literal ids survive and
 * `SkillId` below becomes a union of the real ones. That is what makes a typo
 * in a role's `stack` a build error instead of a silent blank.
 */
export const SKILLS = [
  // --- languages ------------------------------------------------------------
  { id: 'python', name: 'Python', icon: 'SiPython', category: 'languages', tier: 1 },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: 'SiTypescript',
    category: 'languages',
    tier: 1,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: 'SiJavascript',
    category: 'languages',
    tier: 1,
  },
  { id: 'java', name: 'Java', icon: 'SiOpenjdk', category: 'languages', tier: 1 },
  { id: 'go', name: 'Go', icon: 'SiGo', category: 'languages', tier: 1 },
  { id: 'swift', name: 'Swift', icon: 'SiSwift', category: 'languages', tier: 1 },
  { id: 'cpp', name: 'C++', icon: 'SiCplusplus', category: 'languages', tier: 1 },
  { id: 'tcl', name: 'Tcl', icon: null, category: 'languages', tier: 2 },
  { id: 'ocaml', name: 'OCaml', icon: null, category: 'languages', tier: 2 },
  { id: 'prolog', name: 'Prolog', icon: null, category: 'languages', tier: 2 },
  { id: 'racket', name: 'Racket', icon: null, category: 'languages', tier: 2 },

  // --- cloud ----------------------------------------------------------------
  // AWS and its services carry no marks, by necessity. See the note on
  // Skill.icon in types.ts.
  { id: 'aws', name: 'AWS', icon: null, category: 'cloud', tier: 1 },
  { id: 'cognito', name: 'Cognito', icon: null, category: 'cloud', tier: 1 },
  { id: 'lambda', name: 'Lambda', icon: null, category: 'cloud', tier: 1 },
  { id: 'kinesis', name: 'Kinesis', icon: null, category: 'cloud', tier: 1 },
  { id: 'dynamodb', name: 'DynamoDB', icon: null, category: 'cloud', tier: 1 },
  { id: 's3', name: 'S3', icon: null, category: 'cloud', tier: 1 },
  { id: 'sagemaker', name: 'SageMaker', icon: null, category: 'cloud', tier: 1 },
  { id: 'api-gateway', name: 'API Gateway', icon: null, category: 'cloud', tier: 2 },
  { id: 'ecr', name: 'ECR', icon: null, category: 'cloud', tier: 2 },
  { id: 'sns', name: 'SNS', icon: null, category: 'cloud', tier: 2 },

  // --- data -----------------------------------------------------------------
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: 'SiPostgresql',
    category: 'data',
    tier: 1,
  },
  { id: 'mysql', name: 'MySQL', icon: 'SiMysql', category: 'data', tier: 1 },
  { id: 'firebase', name: 'Firebase', icon: 'SiFirebase', category: 'data', tier: 1 },

  // --- infrastructure -------------------------------------------------------
  {
    id: 'terraform',
    name: 'Terraform',
    icon: 'SiTerraform',
    category: 'infrastructure',
    tier: 1,
  },
  { id: 'docker', name: 'Docker', icon: 'SiDocker', category: 'infrastructure', tier: 1 },
  { id: 'git', name: 'Git', icon: 'SiGit', category: 'infrastructure', tier: 1 },
  { id: 'linux', name: 'Linux', icon: 'SiLinux', category: 'infrastructure', tier: 1 },
  {
    id: 'openapi',
    name: 'OpenAPI',
    icon: 'SiOpenapiinitiative',
    category: 'infrastructure',
    tier: 1,
    opticalScale: 0.86,
  },
  { id: 'jira', name: 'Jira', icon: 'SiJira', category: 'infrastructure', tier: 2 },
  {
    id: 'confluence',
    name: 'Confluence',
    icon: 'SiConfluence',
    category: 'infrastructure',
    tier: 2,
  },

  // --- frameworks -----------------------------------------------------------
  { id: 'react', name: 'React', icon: 'SiReact', category: 'frameworks', tier: 1 },
  {
    id: 'react-native',
    name: 'React Native',
    icon: 'SiReact',
    category: 'frameworks',
    tier: 1,
  },
  { id: 'nodejs', name: 'Node.js', icon: 'SiNodedotjs', category: 'frameworks', tier: 1 },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    icon: 'SiTensorflow',
    category: 'frameworks',
    tier: 1,
  },
  { id: 'opencv', name: 'OpenCV', icon: 'SiOpencv', category: 'frameworks', tier: 1 },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    icon: 'SiSpringboot',
    category: 'frameworks',
    tier: 1,
  },
  { id: 'vite', name: 'Vite', icon: 'SiVite', category: 'frameworks', tier: 1 },
  { id: 'express', name: 'Express', icon: 'SiExpress', category: 'frameworks', tier: 2 },
  {
    id: 'robot-framework',
    name: 'Robot Framework',
    icon: 'SiRobotframework',
    category: 'frameworks',
    tier: 2,
  },
  { id: 'numpy', name: 'NumPy', icon: 'SiNumpy', category: 'frameworks', tier: 2 },
  { id: 'pandas', name: 'pandas', icon: 'SiPandas', category: 'frameworks', tier: 2 },
  { id: 'mediapipe', name: 'MediaPipe', icon: null, category: 'frameworks', tier: 2 },
  { id: 'pygame', name: 'PyGame', icon: null, category: 'frameworks', tier: 2 },
  { id: 'thymeleaf', name: 'Thymeleaf', icon: null, category: 'frameworks', tier: 2 },

  // --- practice -------------------------------------------------------------
  {
    id: 'computer-vision',
    name: 'Computer vision',
    icon: null,
    category: 'practice',
    tier: 1,
  },
  {
    id: 'solutions-architecture',
    name: 'Solutions architecture',
    icon: null,
    category: 'practice',
    tier: 1,
  },
  { id: 'agile', name: 'Agile delivery', icon: null, category: 'practice', tier: 1 },
  {
    id: 'experiment-design',
    name: 'Experiment design',
    icon: null,
    category: 'practice',
    tier: 1,
  },
  { id: 'embedded', name: 'Embedded systems', icon: null, category: 'practice', tier: 2 },
] as const satisfies readonly Skill[]

export type SkillId = (typeof SKILLS)[number]['id']

/** Ids of skills that carry a brand mark. The registry must cover exactly these. */
export type IconSkillId = Extract<(typeof SKILLS)[number], { icon: string }>['id']

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id as SkillId, s]))

/**
 * Wall order. Deliberately not alphabetical and not grouped by logo-versus-type,
 * so the two registers interleave rather than forming two blocks.
 */
export const WALL_GROUPS = [
  { key: 'languages', label: 'Languages' },
  { key: 'cloud', label: 'AWS' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'data', label: 'Data' },
  { key: 'practice', label: 'Practice' },
] as const

export function skillsIn(category: Skill['category'], tier?: 1 | 2) {
  return SKILLS.filter((s) => s.category === category && (tier ? s.tier === tier : true))
}
