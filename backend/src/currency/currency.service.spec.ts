import { Test, TestingModule } from '@nestjs/testing'
import { CurrencyService } from './currency.service'
import { RedisService } from '../redis/redis.service'

describe('CurrencyService', () => {
  let service: CurrencyService

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile()

    service = module.get<CurrencyService>(CurrencyService)
    jest.clearAllMocks()
  })

  describe('getRates', () => {
    it('should return cached rates when available', async () => {
      const cached = {
        base: 'USD',
        rates: { USD: 1, KHR: 4100, CNY: 7.25 },
        lastUpdated: '2026-05-01T00:00:00Z',
      }
      mockRedis.get.mockResolvedValue(JSON.stringify(cached))

      const result = await service.getRates()

      expect(result.base).toBe('USD')
      expect(result.rates.KHR).toBe(4100)
      expect(mockRedis.setex).not.toHaveBeenCalled()
    })

    it('should fetch and cache rates when cache is empty', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await service.getRates()

      expect(result.base).toBe('USD')
      expect(result.rates.KHR).toBe(4100)
      expect(mockRedis.setex).toHaveBeenCalled()
    })
  })

  describe('convertAmount', () => {
    const rates = {
      base: 'USD',
      rates: { USD: 1, KHR: 4100, CNY: 7.25 },
      lastUpdated: '2026-05-01T00:00:00Z',
    }

    it('should convert USD to all currencies', () => {
      const result = service.convertAmount(100, rates)

      expect(result.usd).toBe(100)
      expect(result.khr).toBe(410000) // 100 * 4100
      expect(result.cny).toBe(725) // 100 * 7.25
    })

    it('should handle zero amount', () => {
      const result = service.convertAmount(0, rates)

      expect(result.usd).toBe(0)
      expect(result.khr).toBe(0)
      expect(result.cny).toBe(0)
    })

    it('should round KHR to integers', () => {
      const result = service.convertAmount(1.5, rates)

      expect(Number.isInteger(result.khr)).toBe(true)
    })

    it('should round CNY to 2 decimal places', () => {
      const result = service.convertAmount(3.33, rates)

      const decimalPlaces = result.cny.toString().split('.')[1]?.length || 0
      expect(decimalPlaces).toBeLessThanOrEqual(2)
    })
  })
})
