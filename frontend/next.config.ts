import type { NextConfig } from 'next'

const apiHost = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).hostname
  : 'localhost'

const cdnHost = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: apiHost },
      ...(cdnHost ? [{ protocol: 'https' as const, hostname: cdnHost }] : []),
    ],
  },
}

export default nextConfig
