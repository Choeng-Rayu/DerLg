import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-surface-base)] p-6">
      <Card className="max-w-lg text-center">
        <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-primary-600)]">
          <Compass className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
          That route does not exist in this itinerary. Let&apos;s get you back to somewhere useful.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/explore">Explore trips</Link>
          </Button>
        </div>
      </Card>
    </main>
  )
}
