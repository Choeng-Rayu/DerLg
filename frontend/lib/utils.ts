import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function toTitleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}
