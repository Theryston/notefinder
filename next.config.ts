import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  expireTime: 31536000, // 1 year
  experimental: { useCache: true },
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
