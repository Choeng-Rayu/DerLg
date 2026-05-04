import { Test, TestingModule } from '@nestjs/testing'
import { TripsService } from './trips.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('TripsService', () => {
  let service: TripsService

  const mockPrisma = {
    trip: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<TripsService>(TripsService)
    jest.clearAllMocks()
  })

  describe('getTrips', () => {
    it('should return paginated results with defaults', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { id: '1', title: 'Trip A', pricePerPersonUsd: 100 },
      ])
      mockPrisma.trip.count.mockResolvedValue(1)

      const result = await service.getTrips({})

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.perPage).toBe(20)
      expect(result.items).toHaveLength(1)
    })

    it('should apply environment filter', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      await service.getTrips({ environment: 'BEACH' })

      const where = mockPrisma.trip.findMany.mock.calls[0][0].where
      expect(where.environment).toBe('BEACH')
      expect(where.isActive).toBe(true)
    })

    it('should apply price range filter', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      await service.getTrips({ minPrice: 50, maxPrice: 200 })

      const where = mockPrisma.trip.findMany.mock.calls[0][0].where
      expect(where.pricePerPersonUsd).toEqual({ gte: 50, lte: 200 })
    })

    it('should apply duration filter', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      await service.getTrips({ minDays: 2, maxDays: 7 })

      const where = mockPrisma.trip.findMany.mock.calls[0][0].where
      expect(where.durationDays).toEqual({ gte: 2, lte: 7 })
    })

    it('should sort by price ascending', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      await service.getTrips({ sortBy: 'price', sortOrder: 'asc' })

      const orderBy = mockPrisma.trip.findMany.mock.calls[0][0].orderBy
      expect(orderBy.pricePerPersonUsd).toBe('asc')
    })

    it('should default sort by createdAt desc', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      await service.getTrips({})

      const orderBy = mockPrisma.trip.findMany.mock.calls[0][0].orderBy
      expect(orderBy.createdAt).toBe('desc')
    })

    it('should calculate correct totalPages', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(55)

      const result = await service.getTrips({ perPage: 10 })

      expect(result.pagination.totalPages).toBe(6)
    })
  })

  describe('getTripById', () => {
    it('should throw NotFoundException for non-existent trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      await expect(service.getTripById('nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should return trip with hotel and rooms included', async () => {
      const tripData = {
        id: '1',
        title: 'Angkor Wat',
        hotel: { id: 'h1', rooms: [] },
      }
      mockPrisma.trip.findUnique.mockResolvedValue(tripData)

      const result = await service.getTripById('1')

      expect(result.id).toBe('1')
      expect(result.title).toBe('Angkor Wat')
    })

    it('should map Khmer language when specified', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: '1',
        title: 'Angkor Wat',
        titleKh: 'អង្គរវត្ត',
        description: 'English desc',
        descriptionKh: 'Khmer desc',
      })

      const result = await service.getTripById('1', 'KH')

      expect(result.title).toBe('អង្គរវត្ត')
      expect(result.description).toBe('Khmer desc')
    })

    it('should map Chinese language when specified', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: '1',
        title: 'Angkor Wat',
        titleZh: '吴哥窟',
        description: 'English desc',
        descriptionZh: '中文描述',
      })

      const result = await service.getTripById('1', 'ZH')

      expect(result.title).toBe('吴哥窟')
      expect(result.description).toBe('中文描述')
    })

    it('should keep English when no translation available', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: '1',
        title: 'Angkor Wat',
        titleKh: null,
        description: 'English desc',
      })

      const result = await service.getTripById('1', 'KH')

      expect(result.title).toBe('Angkor Wat')
    })
  })

  describe('getFeaturedTrips', () => {
    it('should order by rating desc and limit results', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])

      await service.getFeaturedTrips('EN', 5)

      const args = mockPrisma.trip.findMany.mock.calls[0][0]
      expect(args.orderBy.avgRating).toBe('desc')
      expect(args.take).toBe(5)
      expect(args.where.isActive).toBe(true)
    })
  })
})
