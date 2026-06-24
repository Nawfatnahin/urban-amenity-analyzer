import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use export for GitHub Pages, standalone for Cloudflare Workers/Vercel
  output: process.env.GITHUB_PAGES ? 'export' : 'standalone',
  // GitHub Pages hosts at subpath, Cloudflare hosts at root
  basePath: process.env.GITHUB_PAGES ? '/urban-amenity-analyzer' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
