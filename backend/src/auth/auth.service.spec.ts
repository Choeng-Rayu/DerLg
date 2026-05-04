import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { JwtService } from '@nestjs/jwt'
import { AppConfigService } from '../config/config.service'
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt')

describe('AuthService', () => {
  let service: AuthService

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  }

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  }

  const mockConfig = {
    jwtAccessSecret: 'access-secret-32-chars-minimum-test',
    jwtRefreshSecret: 'refresh-secret-32-chars-minimum-test',
    corsOrigins: ['http://localhost:3000'],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' })

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User',
        } as any),
      ).rejects.toThrow(ConflictException)
    })

    it('should hash password and create user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
      })

      const result = await service.register({
        email: 'new@test.com',
        password: 'Password123!',
        name: 'New User',
      } as any)

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12)
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@test.com',
            passwordHash: 'hashed-password',
            name: 'New User',
            role: 'USER',
          }),
        }),
      )
      expect(result.userId).toBe('user-1')
    })

    it('should lowercase email on register', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'test@test.com' })

      await service.register({
        email: 'TEST@TEST.COM',
        password: 'pass',
        name: 'X',
      } as any)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      })
    })
  })

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'x@x.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        passwordHash: 'hash',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        service.login({ email: 'x@x.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should return tokens and user data on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Test',
        email: 'test@test.com',
        passwordHash: 'hash',
        role: 'USER',
        preferredLanguage: 'EN',
        loyaltyPoints: 0,
        isStudent: false,
        avatarUrl: null,
        emailVerified: true,
        tokenVersion: 0,
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.login({ email: 'test@test.com', password: 'correct' })

      expect(result.accessToken).toBe('mock-token')
      expect(result.refreshToken).toBe('mock-token')
      expect(result.user.email).toBe('test@test.com')
    })
  })

  describe('refreshAccessToken', () => {
    it('should throw on invalid token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('bad') })

      await expect(service.refreshAccessToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw when Redis version mismatch', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'u1', tokenVersion: 1 })
      mockRedis.get.mockResolvedValue('5')

      await expect(service.refreshAccessToken('token')).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('requestPasswordReset', () => {
    it('should always return success (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.requestPasswordReset('nobody@test.com')
      expect(result.message).toContain('If the email exists')
    })

    it('should set reset token when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' })
      mockPrisma.user.update.mockResolvedValue({})

      await service.requestPasswordReset('real@test.com')

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
            passwordResetExpires: expect.any(Date),
          }),
        }),
      )
    })
  })

  describe('generateAccessToken', () => {
    it('should sign with correct payload', () => {
      service.generateAccessToken({
        id: 'u1',
        email: 'e@e.com',
        role: 'USER',
        preferredLanguage: 'EN',
      })

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'u1', email: 'e@e.com', role: 'USER', preferredLanguage: 'EN' },
        { secret: mockConfig.jwtAccessSecret, expiresIn: '15m' },
      )
    })
  })
})
