import { describe, expect, it } from 'vitest'
import { formatCurrency, isFutureDate } from '@/lib/date-utils'

describe('date utils', () => {
  it('formats usd currency', () => {
    expect(formatCurrency(120.5, 'USD', 'en')).toContain('$120.50')
  })

  it('detects a future date', () => {
    expect(isFutureDate('2099-01-01T00:00:00.000Z')).toBe(true)
  })
})
