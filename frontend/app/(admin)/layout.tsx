import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/support', label: 'Support' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/emergency', label: 'Emergency' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-base py-8">
      <PageContainer className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-3xl border border-border bg-surface-raised p-4">
          <p className="mb-3 text-sm font-semibold text-foreground-subtle">
            Admin
          </p>
          <nav className="grid gap-1">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-3 py-2 text-sm text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </PageContainer>
    </div>
  )
}
