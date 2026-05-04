'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="grid min-h-screen place-items-center bg-[var(--color-surface-base)] p-6">
        <Card className="max-w-lg text-center">
          <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
            We hit a rough patch loading this part of DerLg. Your data is still here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Go back
            </Button>
          </div>
        </Card>
      </body>
    </html>
  )
}
