import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
