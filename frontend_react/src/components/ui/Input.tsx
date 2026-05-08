import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, iconLeft, iconRight, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-derlg-primary focus:border-derlg-primary',
              iconLeft && 'pl-10',
              iconRight && 'pr-10',
              error && 'border-red-500 focus:ring-red-200 focus:border-red-500',
              !error && 'border-gray-300',
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-1 flex items-center text-sm text-red-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            {error}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
