import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'notefinder.com.br',
        'zimaos.notefinder.com.br',
        'fly.notefinder.com.br',
      ],
    },
  },
  images: {
    unoptimized: true,
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'lh3.googleusercontent.com',
    //   },
    //   {
    //     protocol: 'https',
    //     hostname: 'notefinder-files.s3.us-east-1.amazonaws.com',
    //   },
    //   {
    //     protocol: 'https',
    //     hostname: 'files.notefinder.com.br',
    //   },
    // ],
  },
};

export default nextConfig;
