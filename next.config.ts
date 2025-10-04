import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '10mb', // Increased from default 1mb to allow larger file uploads
    },
  },
  /* config options here */
};

export default nextConfig;
