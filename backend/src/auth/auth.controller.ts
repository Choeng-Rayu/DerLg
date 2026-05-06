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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login user and receive access token + refresh cookie' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(dto);

    // Set refresh token in httpOnly cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/v1/auth/refresh',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiCookieAuth('refresh_token')
  @ApiOkResponse({ description: 'New access token issued' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.['refresh_token'] as string | undefined;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token',
        code: 'UNAUTHORIZED',
      });
    }

    return this.authService.refreshAccessToken(token);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user (invalidate refresh token)' })
  @ApiOkResponse({ description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: any) {
    await this.authService.logout(user.sub);

    res.clearCookie('refresh_token', { path: '/v1/auth/refresh' });
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ schema: { example: { email: 'user@example.com' } } })
  @ApiOkResponse({ description: 'Reset email sent if user exists' })
  @ApiBadRequestResponse({ description: 'Invalid email' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ schema: { example: { token: 'jwt...', password: 'NewPass123!' } } })
  @ApiOkResponse({ description: 'Password reset successful' })
  @ApiBadRequestResponse({ description: 'Invalid token or password' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @ApiOperation({ summary: 'Verify email address using token' })
  @ApiQuery({ name: 'token', description: 'Email verification JWT token' })
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile returned' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  // -- Google OAuth --

  @ApiOperation({ summary: 'Initiate Google OAuth 2.0 login' })
  @ApiOkResponse({ description: 'Redirects to Google authorization page' })
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // guard redirects to Google
  }

  @ApiOperation({ summary: 'Google OAuth 2.0 callback' })
  @ApiOkResponse({ description: 'OAuth login successful, returns tokens' })
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.googleAuth(req.user);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/v1/auth/refresh',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Authenticate using Telegram Mini App data' })
  @ApiBody({ type: TelegramAuthDto })
  @ApiOkResponse({ description: 'Telegram login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid Telegram data' })
  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TelegramAuthGuard)
  async telegramAuth(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.telegramAuth(req.user);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/v1/auth/refresh',
    });
    return { accessToken: result.accessToken, user: result.user };
  }
}
