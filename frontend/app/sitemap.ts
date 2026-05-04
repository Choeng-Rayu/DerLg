import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL
  const routes = [
    '/',
    '/explore',
    '/booking',
    '/my-trip',
    '/profile',
    '/hotels',
    '/transportation',
    '/guides',
    '/festivals',
    '/contact',
    '/login',
    '/register',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }))
}
