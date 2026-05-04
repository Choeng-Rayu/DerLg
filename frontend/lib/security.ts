import DOMPurify from 'dompurify'

export function sanitizeHtml(value: string) {
  return DOMPurify.sanitize(value)
}

export function maskSensitiveValue(value?: string | null) {
  if (!value) return ''
  if (value.length <= 4) return '****'
  return `${'*'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`
}
