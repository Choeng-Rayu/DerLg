import type { Metadata } from 'next'
import { Inter, Noto_Sans_Khmer } from 'next/font/google'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const khmer = Noto_Sans_Khmer({
  subsets: ['khmer'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-khmer',
})

export const metadata: Metadata = {
  title: {
    default: 'DerLg',
    template: '%s | DerLg',
  },
  description:
    'Travel planning and booking for Cambodia, with guided itineraries, hotels, transport, festivals, and live support.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${khmer.variable}`}>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
