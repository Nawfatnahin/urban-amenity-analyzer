import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Always static export — no server-side features needed
  output: 'export',
  // GitHub Pages needs the repo subpath; Cloudflare serves at root
  basePath: process.env.GITHUB_PAGES ? '/urban-amenity-analyzer' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
