import type { SiteConfig } from './types'

export const SITE: SiteConfig = {
  name: 'Aiden Stevenson Bradwell',
  shortName: 'Aiden Bradwell',
  title: 'Engineering Team Lead',
  // Always lowercase. It is a house style rule, not a typo.
  company: 'zally',
  location: 'Manchester, UK',
  url: 'https://aidenbradwell.com',
  description:
    'Engineering Team Lead at zally in Manchester. Biometric authentication, AWS architecture, and the systems that hold them up.',
  email: 'aidenbradwell@gmail.com',
  github: 'https://github.com/ABradwell',
  // Corrected from the ca. subdomain the old site linked, which is not where
  // the live profile is.
  linkedin: 'https://uk.linkedin.com/in/aiden-bradwell',
  // ONE contact label for the whole site. Nav, hero and footer use this exact
  // string, so the page never offers three differently worded routes to the
  // same inbox.
  contactLabel: 'Get in touch',
} as const

/** Eighteen words. The hero subtext cap is twenty. */
export const HERO_SUBTEXT =
  'Engineering Team Lead at zally in Manchester. I build biometric authentication systems and the cloud they run on.'

export const ABOUT = [
  'I am a software engineer in Manchester, working on biometric authentication. I joined zally as a founding member of the development team and now lead it.',
  'Before that I read Computer Science and Psychology at the University of Ottawa, which is a less unusual pairing than it sounds: most of what makes authentication hard is human, not cryptographic.',
  'Away from work I write and perform music, climb, and read. If you want to talk about any of that, or about work, the door is open.',
] as const
