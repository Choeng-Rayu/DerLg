'use client'

import { cn } from '@/lib/utils'

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div
      role="tablist"
      className="inline-flex rounded-full bg-[var(--color-surface-muted)] p-1"
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'min-h-11 rounded-full px-4 text-sm font-medium transition',
            value === item.value
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--color-foreground-muted)]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
