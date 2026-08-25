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
    /**
     * Six programmes rather than a bullet list.
     *
     * ORDER IS AUTHORED, not chronological and not derived. Chronology would
     * open on the founding SDK work and close on the newest thing, which buries
     * the ownership behind a reader's willingness to reach the bottom of an
     * accordion. This order leads with the systems owned end to end and lets the
     * founding work close.
     *
     * No two share a `discipline`, which is the constraint that keeps six
     * entries from becoming six accounts of "full-stack" in different words. It
     * is also the reason there are six rather than three: each one buys a skill
     * set the others do not, so cutting any of them costs coverage rather than
     * trimming repetition.
     */
    deliveries: [
      {
        id: 'permission-bot',
        name: 'Slack permission bot for production access',
        discipline: 'Identity and access management',
        summary:
          'A Slack integration letting developers request scoped production access on demand, approved or refused by a manager in the channel.',
        detail:
          'Requests are managed through GitOps: an approval in Slack relays back to the GitHub environment, and the granted permission set is bolted onto the requesting developer for as long as the work needs it. It sits inside the wider IAM estate, which I owned end to end. Automated actions would then revoke the access either during manual revocation or after the requested time had elapsed.',
        tools: ['Slack API', 'GitHub Actions', 'AWS IAM', 'Terraform', 'GitOps'],
      },
      {
        id: 'stability-monitor',
        name: 'Internal stability monitor and employee interface',
        discipline: 'Internal platform',
        summary:
          'A pet project taken to production, giving the company oversight of the home-rolled systems the whole development suite runs on.',
        detail:
          'A fleet of pods pulses system state into DynamoDB, and the front end turns that into pages an engineer can read at a glance. Data engineers, AI engineers and software engineers work from one view of the estate without any of them stepping outside their IAM restrictions to get it. Role-based access is built in through custom attribute mapping in Keycloak, so permissions are team-specific and a team can be locked down in a single change.',
        tools: ['Kubernetes', 'DynamoDB', 'Keycloak', 'React', 'TypeScript', 'AWS'],
      },
      {
        id: 'api-security',
        name: 'Continuous API security in the delivery pipeline',
        discipline: 'Application security',
        summary:
          'An automated suite that tests the whole API surface on every pull request and every night, built on open-source tooling.',
        detail:
          'Static gates cover secrets, static analysis, dependencies, containers and infrastructure as code, alongside a lint holding the OpenAPI audit metadata to a threat model kept in the repository. A scheduled suite then tests the running service: contract conformance, regression tests for broken object and function level authorisation, fuzzing, and passive and active dynamic scanning. Every check maps to an OWASP category. Each gate landed report-only and was promoted to blocking once the backlog behind it was clear, so the team was never handed a red pipeline with no route through it.',
        tools: [
          'Semgrep',
          'gitleaks',
          'Trivy',
          'OSV-Scanner',
          'OWASP ZAP',
          'Spectral',
          'OpenAPI',
          'GitHub Actions',
        ],
      },
      {
        id: 'model-scoring-harness',
        name: 'Training management and model scoring harness',
        discipline: 'ML-Ops',
        summary: 'The operational layer behind a model per user, scored in real time.',
        detail:
          'One model per user is a different operational problem from one model per product: the binding constraints become cache management and how fast the fleet can scale, not the model itself. The harness handles both, and carries the release machinery around them. Shadow transitions let a new model score live traffic without affecting anyone, and phased rollout moves a version out to users in stages rather than all at once.',
        tools: ['SageMaker', 'Python', 'Kubernetes', 'AWS', 'Terraform'],
      },
      {
        id: 'ai-enablement',
        name: "The team's move to AI-assisted engineering",
        discipline: 'Engineering leadership',
        summary:
          'Championed the shift to autonomous coding, and reshaped the practices around it so the change could be made safely.',
        detail:
          'Adopting autonomous coding is a process decision more than a tooling one. Review, testing and delivery habits calibrated for hand-written code stop being calibrated the moment most of the code is not, and the failure mode is not bad code so much as unexamined code. I ran the experiments that worked out which of those habits had to change and which had to hold, and set up weekly exploration days so engineers have protected time to meet emerging tooling somewhere other than the middle of a delivery sprint.',
        tools: ['Agentic coding tools', 'Review and testing practice', 'Team enablement'],
      },
      {
        id: 'sdks-and-oauth',
        name: 'Multi-platform SDKs and third-party OAuth exchange',
        discipline: 'Cross-platform engineering',
        summary:
          'Founding development of the motion-sensor SDKs, and the token exchange that lets third parties stream to us securely.',
        detail:
          'Native SDKs in Swift and Kotlin with a React Native layer over them, so an integrator meets the same surface whichever stack they build on. Alongside them, a third-party OAuth token exchange, which is what makes the streaming integration an industry-standard one rather than something bespoke per customer. Before the pivot, the same run of work included a full-stack password manager with autofill.',
        tools: [
          'Swift',
          'Kotlin',
          'React Native',
          'OAuth 2.0',
          'Keycloak',
          'Node.js',
          'TypeScript',
        ],
      },
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
    /**
     * The arc inside the one employer, oldest first. Three titles in three
     * years, which is the fact the single "Engineering Team Lead" heading above
     * hides: that heading is where this ended up, not where it started, and a
     * reader who only sees it cannot tell the difference between being hired as
     * a lead and being promoted into one.
     */
    progression: [
      {
        date: '2023-07',
        title: 'Software Engineer',
        note: 'Founding member of the development team.',
      },
      { date: '2024-08', title: 'Senior Software Engineer' },
      { date: '2025-02', title: 'Engineering Team Lead' },
    ],
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
