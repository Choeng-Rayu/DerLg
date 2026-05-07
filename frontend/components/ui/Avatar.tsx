import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Avatar({
  src,
  alt,
  className,
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn('size-11 rounded-full object-cover', className)}
    />
  ) : (
    <span
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full bg-surface-muted text-foreground-muted',
        className,
      )}
      aria-label={alt}
    >
      <UserRound className="size-5" />
    </span>
  )
}
