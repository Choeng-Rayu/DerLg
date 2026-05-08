'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => (
    <label className="grid gap-2 text-sm">
      {label ? <span className="font-medium text-foreground">{label}</span> : null}
      <span
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-2xl border bg-surface-raised px-3 transition',
          error
            ? 'border-danger'
            : 'border-border focus-within:border-primary-500',
        )}
      >
        {icon}
        <input
          ref={ref}
          className={cn(
            'w-full bg-transparent py-2.5 text-foreground outline-none placeholder:text-foreground-subtle',
            className,
          )}
          {...props}
        />
      </span>
      {error ? (
        <span className="inline-flex items-center gap-1 text-sm text-danger">
          <AlertCircle className="size-4" />
          {error}
        </span>
      ) : null}
    </label>
  ),
)

Input.displayName = 'Input'
