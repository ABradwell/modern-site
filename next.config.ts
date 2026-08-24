import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fully static output. Writes out/404.html, which is what makes the stylised
  // 404 work on Vercel, Cloudflare Pages, GitHub Pages and DigitalOcean App
  // Platform without host config.
  output: 'export',

  // Required under `output: 'export'`. The default image loader needs a server,
  // so we ship the bytes we author. Always set explicit width/height.
  images: { unoptimized: true },

  // Required by DigitalOcean App Platform, and harmless everywhere else.
  //
  // App Platform serves static sites as a plain file tree. It does NOT try
  // `<path>.html` for an extension-less request the way Vercel and Cloudflare
  // Pages do, so with the default `trailingSlash: false` the export puts the
  // skills page at out/skills.html and a request for /skills 404s on DO while
  // working fine in local preview. Setting this true emits
  // out/skills/index.html instead, which every static host resolves.
  //
  // The historical objection to this was that it relocated the 404 to
  // out/404/index.html and silently broke 404 handling. Next 16 no longer does
  // that: it writes BOTH out/404.html and out/404/index.html, so the filename
  // static hosts look for is still there. verify-export.mjs asserts it on every
  // build, so a regression here fails the build rather than the deploy.
  trailingSlash: true,

  reactStrictMode: true,
}

export default nextConfig
