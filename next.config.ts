import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fully static output. Writes out/404.html, which is what makes the stylised
  // 404 work on Vercel, Cloudflare Pages and GitHub Pages without host config.
  output: 'export',

  // Required under `output: 'export'`. The default image loader needs a server,
  // so we ship the bytes we author. Always set explicit width/height.
  images: { unoptimized: true },

  reactStrictMode: true,

  // trailingSlash is deliberately left at its default `false`. That is what puts
  // the 404 at out/404.html, the exact filename static hosts look for. Setting it
  // true can relocate it to out/404/index.html and silently break 404 handling.
}

export default nextConfig
