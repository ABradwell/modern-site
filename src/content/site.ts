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
  /**
   * NEEDS THE OWNER'S NUMBER. Left null on purpose rather than filled with
   * something plausible, because a made-up number on a public page rings a real
   * stranger. The contact section renders a phone row only when this is set, so
   * nothing is broken meanwhile. Fill both halves:
   *
   *   phone: { e164: '+447700900123', display: '+44 7700 900123' },
   */
  phone: null,
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
  'Extensive hands-on experience with Ml-Ops, Scalable Pipeline, API Security Automation, Codebase Security Suites, Biometric Authentication, App Development, and more'

export const ABOUT = [
  'I am a Manchester-based full-stack engineer, who is currently working within the biometric authentication industry. I am pursuing positions which have a strong sense of ownership, and a chance to lead and grow a team. As a founding member of my current engineering team, I have had the opportunity to learn with, grow with, and eventually lead our many diverse engineering functions.',
  'These opportunities included SDK development, OAuth compliant development, Flink/Kafka pipelines, OpenAPI & OWASP security compliance, Dashboards & Interfaces, and a range of ML-Ops operations. I have helped oversee our companies transition into a fully AI-powered development team, while championing modern engineering mindsets and the shift from ticket-focus to outcome-focused.',
  "Away from work I write and perform music (its deceivingly sad, don't google it), boulder (classic tech bro behaviour), and read. Appreciate you stopping by the site, please do reach out on LinkedIn!",
] as const
