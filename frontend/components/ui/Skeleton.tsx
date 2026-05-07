import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-[linear-gradient(110deg,var(--color-surface-muted),var(--color-surface-raised),var(--color-surface-muted))] bg-[length:200%_100%]',
        className,
      )}
    />
  )
}
