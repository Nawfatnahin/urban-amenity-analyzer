import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Cloudflare, export for GitHub Pages
  output: process.env.CF_PAGES ? 'standalone' : 'export',
  // Cloudflare hosts at root, GitHub Pages hosts at subpath
  basePath: process.env.CF_PAGES ? '' : '/urban-amenity-analyzer',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
