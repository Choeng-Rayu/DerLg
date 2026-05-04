import { NextResponse } from 'next/server'

const csp = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: ws: wss:",
  "frame-src 'self' https://js.stripe.com",
].join('; ')

export function proxy() {
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
}
