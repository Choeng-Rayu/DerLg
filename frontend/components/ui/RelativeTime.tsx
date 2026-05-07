import { formatRelativeTime } from '@/lib/date-utils'

export function RelativeTime({ date }: { date: string }) {
  return <span>{formatRelativeTime(date)}</span>
}
