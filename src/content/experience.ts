import type { Education, MinorRole, Role } from './types'

/**
 * Sourced from the 2024 resume rather than the old site's cards, because the
 * two disagreed on almost every title and employer name and the resume is the
 * more careful document. Current title follows the GitHub bio, which is newer
 * than both.
 */
export const ROLES: readonly Role[] = [
  {
    company: 'zally',
    title: 'Engineering Team Lead',
    start: '2023-07',
    end: null,
    location: 'Manchester, UK',
    summary:
      'Founding member of the development team building a biometric authentication service, now leading it.',
    highlights: [
      'Full-stack across AWS solutions architecture, Node.js and React Native, from Cognito and Lambda through to Kinesis stream processing.',
      'Ran the design and facilitation of a sixty-member beta experiment.',
      'Brought Docker, Terraform and OpenAPI 3.0 into the team as the platform grew past what hand-managed infrastructure could hold.',
    ],
    stack: [
      'aws',
      'cognito',
      'lambda',
      'kinesis',
      'dynamodb',
      'react',
      'react-native',
      'nodejs',
      'typescript',
      'terraform',
      'docker',
      'swift',
      'openapi',
    ],
    logo: { src: '/images/logos/zally.svg', alt: 'zally' },
  },
  {
    company: 'Department of Fisheries and Oceans',
    title: 'Java Web-App Developer',
    start: '2022-05',
    end: '2022-09',
    location: 'Ottawa, ON, Canada',
    summary:
      'Built an internal platform for departmental teams to publish and track their ongoing prototypes.',
    highlights: [
      'Developed a REST API on Spring MVC and PostgreSQL to store and manage in-flight projects.',
      'Built the full-stack application on Spring Boot with a Thymeleaf template layer.',
      'Ran Agile delivery through a greenfield build, including getting departmental staff interested enough to use it.',
    ],
    stack: ['java', 'spring-boot', 'postgresql', 'javascript', 'thymeleaf', 'agile'],
    logo: { src: '/images/logos/canada.png', alt: 'Government of Canada' },
  },
  {
    company: 'Microchip Technology Incorporated',
    title: 'Embedded Software Developer',
    start: '2021-01',
    end: '2021-08',
    location: 'Kanata, ON, Canada',
    summary:
      'Rebuilt the automated test platform used to integrate timing microchips in a semiconductor lab.',
    highlights: [
      'Reverse engineered the legacy automated testing software it replaced.',
      'Developed a Python CLI over a Robot Framework automation back end, with GPIB instrument control and oscilloscope capture.',
      'Took low-level systems from concept to delivery inside a semiconductor R and D environment.',
    ],
    stack: ['python', 'robot-framework', 'tcl', 'embedded'],
    logo: { src: '/images/logos/microchip.png', alt: 'Microchip Technology' },
  },
  {
    company: 'National Research Council of Canada',
    title: 'Undergraduate Computer Vision Researcher',
    start: '2020-05',
    end: '2020-08',
    location: 'Ottawa, ON, Canada',
    summary:
      'Explored whether early signs of Alzheimer’s disease could be detected through webcam-based eye tracking.',
    highlights: [
      'Investigated gaze estimation and eye tracking from an ordinary RGB webcam, with no specialist hardware.',
      'Built a four-task PyGame experiment with a gaze-tracking network behind it.',
      'Selected to present the work to the NRC’s Computer Vision and Graphics team.',
    ],
    stack: ['python', 'tensorflow', 'opencv', 'pygame', 'computer-vision'],
    logo: { src: '/images/logos/nrc.png', alt: 'National Research Council of Canada' },
  },
] as const

/**
 * Kept short deliberately. These were real but small, and giving each one a
 * full card would flatten the difference between them and the four above.
 */
export const MINOR_ROLES: readonly MinorRole[] = [
  {
    company: 'Discover Year',
    title: 'Website management',
    start: '2021-05',
    end: '2023-06',
    note: 'Design, updates and development for an Ottawa startup.',
  },
  {
    company: 'MentorU',
    title: 'Website management',
    start: '2020-03',
    end: '2023-06',
    note: 'Design, updates and development for an Ottawa startup.',
  },
  {
    company: 'University of Ottawa',
    title: 'Regional Mentor',
    start: '2019-05',
    end: '2020-04',
    note: 'Helped first-year students through the move into university.',
  },
] as const

export const EDUCATION: readonly Education[] = [
  {
    institution: 'University of Ottawa',
    qualification: 'BSc, Major in Computer Science, Major in Psychology',
    start: '2018-08',
    end: '2022-12',
    location: 'Ottawa, ON, Canada',
    honours: [
      'Graduated Magna Cum Laude, equivalent to first-class honours',
      "Dean's Honours List, 2018 to 2022",
    ],
  },
] as const

export const CREDENTIALS: readonly string[] = [
  'Right to work in the UK through British nationality',
  'Active Canadian Reliability security clearance',
] as const
