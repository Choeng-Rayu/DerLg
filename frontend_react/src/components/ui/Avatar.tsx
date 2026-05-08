import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', fallback }) => {
  const [error, setError] = useState(false);
  const showFallback = !src || error;
  const initials = fallback?.slice(0, 2).toUpperCase() || '';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 font-medium text-gray-600',
        sizeClasses[size]
      )}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt || fallback || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
};
