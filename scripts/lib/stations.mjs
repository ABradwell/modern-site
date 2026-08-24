/**
 * Route list, duplicated from src/content/stations.ts because build scripts run
 * in plain Node and cannot import TypeScript. Kept to bare strings so the
 * duplication is trivial to eyeball, and verify-export.mjs fails loudly if a
 * route here has no corresponding HTML file, which is what catches drift.
 */
export const STATIONS = ['/', '/skills', '/experience', '/projects', '/articles']
