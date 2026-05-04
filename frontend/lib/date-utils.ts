import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns'
import type { Locale } from '@/types'

const localeMap = {
  en: 'en-US',
  kh: 'km-KH',
  zh: 'zh-CN',
} as const

export function formatDate(
  date: string | Date,
  locale: Locale = 'en',
  options?: Intl.DateTimeFormatOptions,
) {
  const value = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(localeMap[locale], {
    dateStyle: 'medium',
    ...(options || {}),
  }).format(value)
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale: Locale = 'en',
) {
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KHR' ? 0 : 2,
  }).format(amount)
}

export function formatRelativeTime(date: string | Date) {
  const value = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(value, {
    addSuffix: true,
  })
}

export function isFutureDate(value: string) {
  return isAfter(parseISO(value), new Date())
}

export function isPastDate(value: string) {
  return isBefore(parseISO(value), new Date())
}

export function toDateInputValue(date: Date) {
  return format(date, 'yyyy-MM-dd')
}
