import type { NextConfig } from 'next';

// The Rapid Slush site: a static export (every route is a plain HTML file in out/), so it hosts anywhere and the
// taste-skill checks run on the built pages. When the plan's API routes land here (§10), switch to a server build.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // /privacy/ -> privacy/index.html: works on any static host
  images: { unoptimized: true }, // no image server in a static export; frames are pre-sized in public/img
  turbopack: { root: __dirname },
};

export default nextConfig;
