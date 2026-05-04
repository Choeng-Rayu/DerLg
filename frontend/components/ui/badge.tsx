import { cn } from '@/lib/utils'

export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'default' &&
          'bg-[var(--color-surface-muted)] text-[var(--color-foreground-muted)]',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'danger' && 'bg-rose-100 text-rose-700',
      )}
    >
      {children}
    </span>
  )
}
