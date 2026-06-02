import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
    });
  }

  // --- Registration ---

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
    });

    // Generate email verification token
    const verificationToken = uuid();
    await this.usersService.setEmailVerificationToken(
      user._id.toString(),
      verificationToken,
    );

    // Send verification email
    await this.sendVerificationEmail(dto.email, verificationToken);

    const tokens = await this.generateTokens(user._id.toString(), user.role);
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  // --- Login ---

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.passwordHash) return null;

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) return null;

    return user;
  }

  async login(user: any) {
    const tokens = await this.generateTokens(user._id.toString(), user.role);
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  // --- Refresh Tokens ---

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findByIdWithTokens(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) {
      // Potential token theft - invalidate all tokens
      await this.usersService.updateRefreshToken(userId, null);
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(userId, user.role);
    await this.usersService.updateRefreshToken(userId, tokens.refreshToken);

    return tokens;
  }

  // --- Logout ---

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  // --- Google OAuth ---

  async validateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      user = await this.usersService.createGoogleUser(profile);
    }

    return user;
  }

  async googleLogin(user: any) {
    const tokens = await this.generateTokens(user._id.toString(), user.role);
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  // --- Password Reset ---

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = uuid();
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      resetToken,
      expires,
    );

    await this.sendPasswordResetEmail(email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid reset request');
    }

    const userWithTokens = await this.usersService.findByIdWithTokens(
      user._id.toString(),
    );

    if (
      !userWithTokens?.passwordResetToken ||
      !userWithTokens?.passwordResetExpires
    ) {
      throw new BadRequestException('No password reset was requested');
    }

    if (userWithTokens.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const isValid = await argon2.verify(
      userWithTokens.passwordResetToken,
      token,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid reset token');
    }

    await this.usersService.resetPassword(user._id.toString(), newPassword);

    return { message: 'Password has been reset successfully' };
  }

  // --- Email Verification ---

  async verifyEmail(email: string, token: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid verification request');
    }

    const userWithTokens = await this.usersService.findByIdWithTokens(
      user._id.toString(),
    );

    if (!userWithTokens?.emailVerificationToken) {
      throw new BadRequestException('No verification token found');
    }

    const isValid = await argon2.verify(
      userWithTokens.emailVerificationToken,
      token,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.usersService.verifyEmail(user._id.toString());

    return { message: 'Email verified successfully' };
  }

  // --- Token Generation ---

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiry') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiry') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // --- Email Helpers ---

  private async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('frontend.url');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}&email=${email}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('smtp.user'),
        to: email,
        subject: 'ViewMax - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">ViewMax</h1>
            <h2>Verify Your Email</h2>
            <p>Click the link below to verify your email address:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
            <p style="margin-top: 20px; color: #666;">This link will expire in 24 hours.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email', error.message);
      // Log token in dev for testing
      this.logger.debug(`Verification token for ${email}: ${token}`);
    }
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('frontend.url');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${email}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('smtp.user'),
        to: email,
        subject: 'ViewMax - Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">ViewMax</h1>
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            <p style="margin-top: 20px; color: #666;">This link will expire in 1 hour.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send reset email', error.message);
      this.logger.debug(`Reset token for ${email}: ${token}`);
    }
  }
}
