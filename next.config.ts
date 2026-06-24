import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/urban-amenity-analyzer',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
