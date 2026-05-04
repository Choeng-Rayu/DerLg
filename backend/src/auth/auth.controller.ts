import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Throttle } from '@nestjs/throttler'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(dto)

    // Set refresh token in httpOnly cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/v1/auth/refresh',
    })

    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.['refresh_token'] as string | undefined

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token',
        code: 'UNAUTHORIZED',
      })
    }

    return this.authService.refreshAccessToken(token)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: any,
  ) {
    await this.authService.logout(user.sub)

    res.clearCookie('refresh_token', { path: '/v1/auth/refresh' })
    return { message: 'Logged out successfully' }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password)
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return user
  }
}
