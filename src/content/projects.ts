import type { Project } from './types'

/**
 * Five, curated. The older work is undergraduate coursework and is presented as
 * such: real dates, real repositories, and no inflation. Where a project leans
 * on someone else's model or library, `credit` says so on the card rather than
 * in a footnote nobody reads.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'bradwell-music',
    name: 'Bradwell Music',
    year: 2025,
    summary:
      'A player for ten original tracks, built around a gramophone transport and shareable links.',
    detail:
      'A personal favourite of mine, a Vite & React web app which includes a cute record player, and streams a recently recorded album.',
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
