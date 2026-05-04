import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SupabaseService } from './supabase/supabase.service';
import { AppConfigService } from '../config/config.service';
import { RedisKeys } from '../redis/redis-keys';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly supabase: SupabaseService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'Email already registered',
        code: 'DUPLICATE_RECORD',
      });
    }

    // Create Supabase Auth account
    const { data: supabaseData, error: supabaseError } =
      await this.supabase.signUp(dto.email, dto.password);

    if (supabaseError) {
      this.logger.error(`Supabase signup failed: ${supabaseError.message}`);
      throw new BadRequestException({
        message: supabaseError.message,
        code: 'REGISTRATION_FAILED',
      });
    }

    // Create user row in database
    const user = await this.prisma.user.create({
      data: {
        supabaseUid: supabaseData.user.id,
        email: dto.email,
        name: dto.name,
        phone: dto.phone || null,
        preferredLanguage: dto.preferredLanguage || 'EN',
        role: 'USER',
      },
    });

    this.logger.log(`User registered: ${user.id} (${user.email})`);

    return {
      userId: user.id,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async login(dto: LoginDto) {
    // Authenticate via Supabase
    const { data: supabaseData, error: supabaseError } =
      await this.supabase.signInWithPassword(dto.email, dto.password);

    if (supabaseError) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'UNAUTHORIZED',
      });
    }

    // Get user from database
    const user = await this.prisma.user.findUnique({
      where: { supabaseUid: supabaseData.user.id },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'User account not found',
        code: 'UNAUTHORIZED',
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

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
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });

      // Check token version
      const storedVersion = await this.redis.get(
        RedisKeys.refreshTokenVersion(payload.sub),
      );

      if (
        storedVersion !== null &&
        parseInt(storedVersion) !== payload.tokenVersion
      ) {
        throw new UnauthorizedException({
          message: 'Token has been revoked. Please log in again.',
          code: 'TOKEN_INVALID',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found',
          code: 'TOKEN_INVALID',
        });
      }

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException({
          message: 'Token version mismatch. Please log in again.',
          code: 'TOKEN_INVALID',
        });
      }

      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: 'TOKEN_INVALID',
      });
    }
  }

  async logout(userId: string) {
    // Increment token version to invalidate all refresh tokens
    await this.incrementTokenVersion(userId);

    // Sign out from Supabase
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      // Sign out via Supabase admin
      try {
        await this.supabase.deleteUser(user.supabaseUid);
      } catch (e) {
        this.logger.warn(`Failed to sign out Supabase user: ${e}`);
      }
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  async requestPasswordReset(email: string) {
    const { error } = await this.supabase.resetPasswordForEmail(
      email,
      `${this.config.corsOrigins[0]}/auth/reset-password`,
    );

    if (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
    }

    // Always return success to prevent email enumeration
    return { message: 'If the email exists, a reset link has been sent.' };
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
    );
  }

  generateRefreshToken(user: any): string {
    return this.jwt.sign(
      {
        sub: user.id,
        tokenVersion: user.tokenVersion,
      },
      {
        secret: this.config.jwtRefreshSecret,
        expiresIn: '7d',
      },
    );
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    await this.redis.set(
      RedisKeys.refreshTokenVersion(userId),
      String(user.tokenVersion),
    );
  }
}
