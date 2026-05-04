import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { JwtService } from '@nestjs/jwt'
import { SupabaseService } from './supabase/supabase.service'
import { AppConfigService } from '../config/config.service'
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'

describe('AuthService', () => {
  let service: AuthService

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
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

  const mockSupabase = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    deleteUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  }

  const mockConfig = {
    jwtAccessSecret: 'access-secret-32-chars-minimum-for-testing',
    jwtRefreshSecret: 'refresh-secret-32-chars-minimum-for-testing',
    corsOrigins: ['http://localhost:3000'],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' })

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User',
        } as any),
      ).rejects.toThrow(ConflictException)
    })

    it('should create user in Supabase then in DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockSupabase.signUp.mockResolvedValue({
        data: { user: { id: 'sb-user-123' } },
        error: null,
      })
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
      })

      const result = await service.register({
        email: 'new@test.com',
        password: 'Password123!',
        name: 'New User',
      } as any)

      expect(result.userId).toBe('user-1')
      expect(result.message).toContain('Registration successful')
      expect(mockSupabase.signUp).toHaveBeenCalledWith(
        'new@test.com',
        'Password123!',
      )
    })
  })

  describe('login', () => {
    it('should throw UnauthorizedException when Supabase auth fails', async () => {
      mockSupabase.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should return tokens and user data on successful login', async () => {
      mockSupabase.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'sb-user-1' } },
        error: null,
      })
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'USER',
        preferredLanguage: 'EN',
        loyaltyPoints: 100,
        isStudent: false,
        avatarUrl: null,
        tokenVersion: 0,
      })

      const result = await service.login({
        email: 'test@test.com',
        password: 'correct',
      })

      expect(result.accessToken).toBe('mock-token')
      expect(result.refreshToken).toBe('mock-token')
      expect(result.user.id).toBe('user-1')
      expect(result.user.email).toBe('test@test.com')
    })

    it('should throw UnauthorizedException when user not in database', async () => {
      mockSupabase.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'sb-user-1' } },
        error: null,
      })
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'test@test.com', password: 'correct' }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('refreshAccessToken', () => {
    it('should throw UnauthorizedException on invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid token')
      })

      await expect(
        service.refreshAccessToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when token version mismatch', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', tokenVersion: 1 })
      mockRedis.get.mockResolvedValue('2') // stored version is higher
      
      await expect(
        service.refreshAccessToken('valid-token'),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    it('should increment token version and call Supabase deleteUser', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', tokenVersion: 2 })
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        supabaseUid: 'sb-uid-1',
      })
      mockSupabase.deleteUser.mockResolvedValue({})
      mockRedis.set.mockResolvedValue('OK')

      await service.logout('user-1')

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      })
    })
  })

  describe('requestPasswordReset', () => {
    it('should always return success message to prevent email enumeration', async () => {
      mockSupabase.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await service.requestPasswordReset('test@test.com')

      expect(result.message).toContain('If the email exists')
    })
  })

  describe('generateAccessToken', () => {
    it('should include sub, email, role, and preferredLanguage', () => {
      const user = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'USER',
        preferredLanguage: 'EN',
      }

      service.generateAccessToken(user)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          email: 'test@test.com',
          role: 'USER',
          preferredLanguage: 'EN',
        },
        {
          secret: mockConfig.jwtAccessSecret,
          expiresIn: '15m',
        },
      )
    })
  })

  describe('generateRefreshToken', () => {
    it('should include sub and tokenVersion', () => {
      const user = { id: 'user-1', tokenVersion: 3 }

      service.generateRefreshToken(user)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'user-1', tokenVersion: 3 },
        {
          secret: mockConfig.jwtRefreshSecret,
          expiresIn: '7d',
        },
      )
    })
  })
})
