import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Select({
  className,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ label: string; value: string }>
}) {
  return (
    <span className="relative block">
      <select
        className={cn(
          'min-h-11 w-full appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 pr-10 text-sm text-[var(--color-foreground)] outline-none',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-foreground-muted)]" />
    </span>
  )
}
