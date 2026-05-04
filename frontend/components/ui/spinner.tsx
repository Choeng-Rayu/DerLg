import { LoaderCircle } from 'lucide-react'

export function Spinner() {
  return (
    <span className="inline-flex items-center justify-center text-[var(--color-foreground-muted)]">
      <LoaderCircle className="size-5 animate-spin" />
    </span>
  )
}
