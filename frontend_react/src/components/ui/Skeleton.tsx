import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, width, height, circle }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        circle && 'rounded-full',
        !circle && 'rounded-md',
        className
      )}
      style={{ width, height }}
    />
  );
};
