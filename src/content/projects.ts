import type { Project, ProjectGroup } from './types'

/**
 * Eight, curated. The older work is undergraduate coursework and is presented as
 * such: real dates, real repositories, and no inflation. Where a project leans
 * on someone else's model or library, `credit` says so on the card rather than
 * in a footnote nobody reads.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'bradwell-applications',
    name: 'Bradwell Applications',
    year: 2026,
    group: 'modern-work',
    summary:
      'A voxel town in three.js that doubles as a playable CV: every house on the high street is one of my projects.',
    detail:
      'Each stone house carries a painted shop sign and, inside, a screenshot gallery, the project’s stack and a live preview. The Shack is where to find out who runs the place. Sixteen named townsfolk keep their own schedules, get hungry and tired, and head for the fruit stall or the nearest bench. The lamps come on at dusk, and pressing Space twice moves you in so you can walk the streets yourself.',
    stack: ['typescript', 'threejs', 'vite'],
    live: 'https://town.aidenbradwell.com',
    image: {
      src: '/images/projects/bradwell-applications.jpg',
      alt: 'The voxel town in morning light: stone houses along a cobbled high street, market stalls and a bandstand, with the church, terraced hills and a river behind',
      width: 1200,
      height: 750,
    },
    gallery: [
      {
        src: '/images/projects/bradwell-applications-pub.jpg',
        alt: 'A close view of the pub, a whitewashed stone house with a painted sign, a street lamp and a fenced beer garden, with townsfolk at the door',
        width: 1200,
        height: 750,
        caption: 'Every house is a project',
      },
      {
        src: '/images/projects/bradwell-applications-panel.jpg',
        alt: 'The Assay Office panel open over the town, showing a screenshot of the LLM SEO Toolbox with links to visit it',
        width: 1200,
        height: 750,
        caption: 'Step inside for the project itself',
      },
      {
        src: '/images/projects/bradwell-applications-dusk.jpg',
        alt: 'The high street at dusk, lit by street lamps and windows, with the bandstand glowing in the foreground',
        width: 1200,
        height: 750,
        caption: 'The lamps come on at dusk',
      },
    ],
    featured: true,
  },
  {
    slug: 'llm-seo-toolbox',
    name: 'LLM SEO Toolbox',
    year: 2026,
    group: 'modern-work',
    summary:
      'An open-source auditor that rates how readable a URL is for large language models.',
    detail:
      'Paste a URL and it classifies the site, then runs twenty checks against the initial HTML response: llms.txt, RFC 9309 robots rules for crawlers like GPTBot and ClaudeBot, static signal-to-noise and the schema.org types that kind of site should carry. Each miss comes back with a score, a letter grade and the exact line that would fix it. No accounts, no cookies, and the audit is also available as a JSON API.',
    stack: ['typescript', 'react'],
    live: 'https://llm.aidenbradwell.com',
    repo: 'https://github.com/ABradwell/llm-seo-toolbox',
    image: {
      src: '/images/projects/llm-seo-toolbox.jpg',
      alt: 'The LLM SEO Toolbox homepage, with a URL field beside a sample audit of nextjs.org/docs',
      width: 1200,
      height: 750,
    },
    featured: true,
  },
  {
    slug: 'staniland-audio',
    name: 'Staniland Audio',
    year: 2026,
    group: 'modern-work',
    summary:
      'A portfolio and booking site for Luke Staniland, an audio engineer working out of Manchester.',
    detail:
      'Built for Luke, who records, mixes and masters for artists across the North West. It is a static Next.js export with a filterable wall of credits, a showreel and an enquiry form. Every credit lives in one typed module, so adding a session is a single edit that also updates the search data.',
    stack: ['typescript', 'react'],
    // Staging URL until stanilandaudio.co.uk is live.
    live: 'https://staniland-audio-co-uk-stg-cow8t.ondigitalocean.app',
    image: {
      src: '/images/projects/staniland-audio.jpg',
      alt: 'The Staniland Audio homepage, with Luke Staniland at a mixing desk during a live session',
      width: 1200,
      height: 750,
    },
    featured: true,
  },
  {
    slug: 'bradwell-music',
    name: 'Bradwell Music',
    year: 2025,
    group: 'modern-work',
    summary:
      'A player for ten original tracks, built around a gramophone transport and shareable links.',
    detail:
      'A personal favourite of mine, a Vite & React web app which includes a cute record player and streams a recently recorded album.',
    stack: ['typescript', 'react', 'vite'],
    repo: 'https://github.com/ABradwell/bradwell-music-website',
    image: {
      src: '/images/projects/bradwell-music.jpg',
      alt: 'Cover photograph used across the Bradwell Music site',
      width: 640,
      height: 800,
    },
    featured: true,
  },
  {
    slug: 'number-recognition',
    name: 'Number Recognition',
    year: 2022,
    group: 'university-work',
    summary:
      'A convolutional network that finds and reads fixed-font numbers inside cluttered images.',
    detail:
      'Thirteen layers, trained in TensorFlow over a hand-labelled set of 3,992 digits, sitting behind a pre-processing step that isolates candidate numbers before they reach the network. It read all four digits correctly on 1,294 of 1,324 test images, which is 97.7 percent. Nearly all of the remaining error came from the Canny edge pass rather than the network, so the next thing to try would be different threshold values or a blur stage.',
    stack: ['python', 'tensorflow', 'opencv', 'numpy', 'computer-vision'],
    repo: 'https://github.com/ABradwell/Number_recognition',
    image: {
      src: '/images/projects/number-recognition.jpg',
      alt: 'Digits isolated from a cluttered source image and labelled by the network',
      width: 1170,
      height: 425,
    },
    featured: true,
  },
  {
    slug: 'image-processor',
    name: 'Live-Feed Image Processor',
    year: 2021,
    group: 'university-work',
    summary:
      'A webcam processor that stacks OpenCV filters live so you can see the combined result.',
    detail:
      'Seven filters that compose in any order: threshold, sharpen, emboss, Canny edge detection, blur in normal, median and Gaussian variants, lighten and darken. The point was being able to see what filters do to each other rather than one at a time, which is harder to picture than it sounds.',
    stack: ['python', 'opencv'],
    repo: 'https://github.com/ABradwell/Webcam_OpenCv_morph',
    image: {
      src: '/images/projects/image-processor.jpg',
      alt: 'A webcam frame with several OpenCV filters applied at once',
      width: 1109,
      height: 669,
    },
    featured: true,
  },
  {
    slug: 'hand-tracker',
    name: 'Hand Tracker',
    year: 2022,
    group: 'university-work',
    summary: 'Live hand detection and motion tracking from an ordinary webcam.',
    detail:
      'Detection and per-frame motion tracking over a live capture, written while working out how far you can get with gesture input on hardware everybody already owns.',
    stack: ['python', 'opencv', 'mediapipe', 'computer-vision'],
    repo: 'https://github.com/ABradwell/Hand_Tracking',
    credit:
      'The pretrained hand-recognition network comes from a TechVidvan tutorial, by way of Google MediaPipe.',
    image: {
      src: '/images/projects/hand-tracker.jpg',
      alt: 'A tracked hand with detected joint positions overlaid',
      width: 960,
      height: 540,
    },
    featured: false,
  },
  {
    slug: 'walk-in-clinic-simulation',
    name: 'Walk-In Clinic Simulation',
    year: 2022,
    group: 'university-work',
    summary:
      'A statistical model of a real Nova Scotian walk-in clinic, used to test how it assigns doctors.',
    detail:
      'Built for CSI4124, Foundations of Modelling and Simulation. The model reproduces the clinic’s actual scheduling behaviour closely enough to run efficiency experiments against it, then compares alternative approaches to doctor assignment and utilisation. The interesting result was how much of the queue came from assignment policy rather than from capacity.',
    stack: ['java', 'agile'],
    repo: 'https://github.com/ABradwell/CSI4124-Simulation-Project',
    featured: false,
  },
] as const

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured)

/** Tab order on /projects. The first group is the one selected on arrival. */
export const PROJECT_GROUPS: readonly ProjectGroup[] = [
  { id: 'modern-work', label: 'Modern work', period: '2025 to now' },
  { id: 'university-work', label: 'University work', period: '2021 to 2022' },
]

/**
 * What goes on each group's stage, in arrow order.
 *
 * An ordered list rather than a flag on each project, because the order is part
 * of the design and a boolean scattered across five objects cannot express it.
 * Independent of `featured`, which still means the home page.
 */
const STAGE: readonly string[] = [
  'bradwell-applications',
  'bradwell-music',
  'staniland-audio',
  'llm-seo-toolbox',
  'number-recognition',
  'hand-tracker',
]

function bySlug(slug: string): Project {
  const project = PROJECTS.find((p) => p.slug === slug)
  // Throws during the static build, so a typo in STAGE never ships.
  if (!project) throw new Error(`STAGE references unknown project "${slug}"`)
  return project
}

/** The one project the home page gives a section of its own. */
export const HOME_FEATURE: Project = bySlug('bradwell-applications')

export interface ProjectShelf {
  readonly group: ProjectGroup
  /** Stage projects, in STAGE order. */
  readonly stage: readonly Project[]
  /** Every project in the group, newest first. Includes the staged ones. */
  readonly projects: readonly Project[]
}

/** Groups with nothing in them yet are dropped, so adding a group early is safe. */
export const PROJECT_SHELVES: readonly ProjectShelf[] = PROJECT_GROUPS.map((group) => ({
  group,
  stage: STAGE.map(bySlug).filter((p) => p.group === group.id),
  projects: PROJECTS.filter((p) => p.group === group.id).toSorted(
    (a, b) => b.year - a.year,
  ),
})).filter((shelf) => shelf.projects.length > 0)
