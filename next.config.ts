import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: { cacheComponents: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
