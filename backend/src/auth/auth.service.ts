import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { AppConfigService } from '../config/config.service'
import { RedisKeys } from '../redis/redis-keys'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

const BCRYPT_ROUNDS = 12

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (existingUser) {
      throw new ConflictException({
        message: 'Email already registered',
        code: 'DUPLICATE_RECORD',
      })
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const emailVerifyToken = crypto.randomBytes(32).toString('hex')

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone ?? null,
        preferredLanguage: dto.preferredLanguage ?? 'EN',
        role: 'USER',
        emailVerifyToken,
        emailVerified: false,
      },
    })

    this.logger.log(`User registered: ${user.id} (${user.email})`)

    // TODO: send verification email via Resend using emailVerifyToken
    return {
      userId: user.id,
      message: 'Registration successful. Please verify your email.',
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'UNAUTHORIZED',
      })
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!passwordValid) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'UNAUTHORIZED',
      })
    }

    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    this.logger.log(`User logged in: ${user.id}`)

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        loyaltyPoints: user.loyaltyPoints,
        isStudent: user.isStudent,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      })

      // Redis token version check (fast invalidation)
      const storedVersion = await this.redis.get(
        RedisKeys.refreshTokenVersion(payload.sub),
      )

      if (storedVersion !== null && parseInt(storedVersion) !== payload.tokenVersion) {
        throw new UnauthorizedException({
          message: 'Token has been revoked',
          code: 'TOKEN_INVALID',
        })
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException({
          message: 'Token version mismatch',
          code: 'TOKEN_INVALID',
        })
      }

      return { accessToken: this.generateAccessToken(user) }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: 'TOKEN_INVALID',
      })
    }
  }

  async logout(userId: string) {
    await this.incrementTokenVersion(userId)
    this.logger.log(`User logged out: ${userId}`)
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpires: expires,
        },
      })

      this.logger.log(`Password reset token generated for user ${user.id}`)
      // TODO: send email via Resend with token link
    }

    // Always return success to prevent email enumeration
    return { message: 'If the email exists, a reset link has been sent.' }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    })

    if (!user) {
      throw new BadRequestException({
        message: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN',
      })
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: { increment: 1 },
      },
    })

    this.logger.log(`Password reset completed for user ${user.id}`)
    return { message: 'Password reset successful. Please log in.' }
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    })

    if (!user) {
      throw new BadRequestException({
        message: 'Invalid verification token',
        code: 'INVALID_TOKEN',
      })
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    })

    return { message: 'Email verified successfully.' }
  }

  generateAccessToken(user: any): string {
    return this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
      {
        secret: this.config.jwtAccessSecret,
        expiresIn: '15m',
      },
    )
  }

  generateRefreshToken(user: any): string {
    return this.jwt.sign(
      { sub: user.id, tokenVersion: user.tokenVersion },
      {
        secret: this.config.jwtRefreshSecret,
        expiresIn: '7d',
      },
    )
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    })

    await this.redis.set(
      RedisKeys.refreshTokenVersion(userId),
      String(user.tokenVersion),
    )
  }
}
