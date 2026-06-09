import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Req() req: any, @Body() dto: RegisterDto) {
    let ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    if (ipAddress === '::1') ipAddress = '127.0.0.1';
    if (ipAddress.startsWith('::ffff:')) ipAddress = ipAddress.substring(7);
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, { ipAddress, userAgent });
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Req() req: any) {
    let ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    if (ipAddress === '::1') ipAddress = '127.0.0.1';
    if (ipAddress.startsWith('::ffff:')) ipAddress = ipAddress.substring(7);
    const userAgent = req.headers['user-agent'];
    return this.authService.login(req.user, { ipAddress, userAgent });
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Req() req: any) {
    const user = req.user;
    return this.authService.refreshTokens(user.sub, user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  logout(
    @CurrentUser('_id') userId: string,
    @CurrentUser('sid') sessionId?: string,
  ) {
    return this.authService.logout(userId, sessionId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.token,
      dto.newPassword,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.token);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: any, @Res() res: any) {
    let ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    if (ipAddress === '::1') ipAddress = '127.0.0.1';
    if (ipAddress.startsWith('::ffff:')) ipAddress = ipAddress.substring(7);
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.googleLogin(req.user, {
      ipAddress,
      userAgent,
    });
    const frontendUrl = this.configService.get<string>('frontend.url');

    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: any) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    };
  }
}
