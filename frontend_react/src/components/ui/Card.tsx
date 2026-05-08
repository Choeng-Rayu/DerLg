import React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn('border-b border-gray-100 p-4', className)}>{children}</div>;
};

export const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn('p-4', className)}>{children}</div>;
};

export const CardFooter = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn('border-t border-gray-100 p-4', className)}>{children}</div>;
};
