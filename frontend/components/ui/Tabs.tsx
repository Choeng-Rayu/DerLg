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
      className="inline-flex rounded-full bg-surface-muted p-1"
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
              ? 'bg-surface-raised text-foreground shadow-sm'
              : 'text-foreground-muted',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
