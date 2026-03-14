import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Required for Server Actions with Supabase SSR
    serverActions: { allowedOrigins: ['localhost:3000', process.env.NEXT_PUBLIC_APP_URL ?? ''] },
  },
};

export default nextConfig;
