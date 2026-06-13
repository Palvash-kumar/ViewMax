import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto';
import { SecurityService } from '../security/security.service';
import { SecurityEventType } from '../security/schemas/security-event.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private securityService: SecurityService,
    private mailService: MailService,
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

  async register(
    dto: RegisterDto,
    sessionDetails?: { ipAddress?: string; userAgent?: string },
  ) {
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

    let sessionId: string | undefined;
    if (sessionDetails) {
      const userAgent = sessionDetails.userAgent || 'Unknown';
      const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop';
      let browser = 'Unknown Browser';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
        browser = 'Safari';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      sessionId = await this.securityService.createSession(
        user._id.toString(),
        {
          device,
          browser,
          ipAddress: sessionDetails.ipAddress || '127.0.0.1',
          createdAt: new Date(),
          lastActive: new Date(),
        },
      );

      await this.securityService.logSecurityEvent(
        user._id.toString(),
        SecurityEventType.LOGIN_SUCCESS,
        {
          ipAddress: sessionDetails.ipAddress,
          userAgent: sessionDetails.userAgent,
        },
      );
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.role,
      sessionId,
    );
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

  async validateUser(
    email: string,
    password: string,
    sessionDetails?: { ipAddress?: string; userAgent?: string },
  ): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;
    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }
    if (!user.passwordHash) return null;

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      if (sessionDetails) {
        await this.securityService.logSecurityEvent(
          user._id.toString(),
          SecurityEventType.LOGIN_FAILED,
          {
            ipAddress: sessionDetails.ipAddress,
            userAgent: sessionDetails.userAgent,
          },
        );
      }
      return null;
    }

    return user;
  }

  async login(
    user: any,
    sessionDetails?: { ipAddress?: string; userAgent?: string },
  ) {
    let sessionId: string | undefined;
    if (sessionDetails) {
      const userAgent = sessionDetails.userAgent || 'Unknown';
      const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop';
      let browser = 'Unknown Browser';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
        browser = 'Safari';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      sessionId = await this.securityService.createSession(
        user._id.toString(),
        {
          device,
          browser,
          ipAddress: sessionDetails.ipAddress || '127.0.0.1',
          createdAt: new Date(),
          lastActive: new Date(),
        },
      );

      await this.securityService.logSecurityEvent(
        user._id.toString(),
        SecurityEventType.LOGIN_SUCCESS,
        {
          ipAddress: sessionDetails.ipAddress,
          userAgent: sessionDetails.userAgent,
        },
      );
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.role,
      sessionId,
    );
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
    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
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

  async logout(userId: string, sessionId?: string) {
    await this.usersService.updateRefreshToken(userId, null);
    if (sessionId) {
      await this.securityService.terminateSession(userId, sessionId);
    }
    await this.securityService.logSecurityEvent(
      userId,
      SecurityEventType.LOGOUT,
      {},
    );
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

  async googleLogin(
    user: any,
    sessionDetails?: { ipAddress?: string; userAgent?: string },
  ) {
    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }
    let sessionId: string | undefined;
    if (sessionDetails) {
      const userAgent = sessionDetails.userAgent || 'Unknown';
      const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop';
      let browser = 'Unknown Browser';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
        browser = 'Safari';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      sessionId = await this.securityService.createSession(
        user._id.toString(),
        {
          device,
          browser,
          ipAddress: sessionDetails.ipAddress || '127.0.0.1',
          createdAt: new Date(),
          lastActive: new Date(),
        },
      );

      await this.securityService.logSecurityEvent(
        user._id.toString(),
        SecurityEventType.LOGIN_SUCCESS,
        {
          ipAddress: sessionDetails.ipAddress,
          userAgent: sessionDetails.userAgent,
        },
      );
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.role,
      sessionId,
    );
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
      throw new NotFoundException('No account associated with this email address');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      otp,
      expires,
    );

    await this.sendOtpEmail(email, otp, `${user.firstName} ${user.lastName}`);

    return { message: 'Verification OTP has been sent to your email' };
  }

  async verifyOtp(email: string, token: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
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
      throw new BadRequestException('OTP code has expired');
    }

    const isValid = await argon2.verify(
      userWithTokens.passwordResetToken,
      token,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    // 1. Verify the OTP first
    await this.verifyOtp(email, token);

    // 2. Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid reset request');
    }

    // 3. Reset password in database
    await this.usersService.resetPassword(user._id.toString(), newPassword);

    // 4. Send confirmation email
    await this.sendPasswordChangedSuccessEmail(email, `${user.firstName} ${user.lastName}`);

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

  private async generateTokens(
    userId: string,
    role: string,
    sessionId?: string,
  ) {
    const payload = { sub: userId, role, sid: sessionId };

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

  private async sendOtpEmail(email: string, otp: string, userName: string) {
    this.logger.debug(`[DEV ONLY] OTP code for ${email}: ${otp}`);
    try {
      await this.mailService.sendMail(
        email,
        'ViewMax - Reset Your Password OTP',
        `
        <div style="background-color: #0c0a09; color: #f5f5f4; font-family: 'Outfit', 'Inter', Arial, sans-serif; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(245, 158, 11, 0.2); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">VIEWMAX</div>
            <div style="font-size: 12px; color: #a8a29e; margin-top: 5px; text-transform: uppercase; letter-spacing: 4px;">Cinematic Excellence</div>
          </div>
          
          <h2 style="color: #f5f5f4; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #d6d3d1; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #d6d3d1; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">We received a request to reset your ViewMax account password. Use the verification code below to proceed. This OTP is valid for <strong>15 minutes</strong>.</p>
          
          <div style="text-align: center; margin-bottom: 35px;">
            <div style="background-color: rgba(245, 158, 11, 0.1); border: 2px dashed #f59e0b; color: #f59e0b; font-size: 36px; font-weight: 800; letter-spacing: 10px; padding: 15px 30px; border-radius: 12px; display: inline-block; font-family: monospace;">${otp}</div>
          </div>
          
          <p style="color: #a8a29e; font-size: 13px; line-height: 1.6; text-align: center; margin-bottom: 30px;">If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <div style="border-top: 1px solid rgba(245, 158, 11, 0.1); padding-top: 20px; text-align: center;">
            <p style="color: #78716c; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ViewMax Booking System. All rights reserved.</p>
          </div>
        </div>
        `
      );
      this.logger.debug(`OTP sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
      // Fallback log for development
      this.logger.debug(`OTP for ${email}: ${otp}`);
    }
  }

  private async sendPasswordChangedSuccessEmail(email: string, userName: string) {
    try {
      await this.mailService.sendMail(
        email,
        'ViewMax - Password Changed Successfully',
        `
        <div style="background-color: #0c0a09; color: #f5f5f4; font-family: 'Outfit', 'Inter', Arial, sans-serif; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(245, 158, 11, 0.2); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">VIEWMAX</div>
            <div style="font-size: 12px; color: #a8a29e; margin-top: 5px; text-transform: uppercase; letter-spacing: 4px;">Cinematic Excellence</div>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: rgba(34, 197, 94, 0.1); border: 2px solid #22c55e; border-radius: 50%; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: #22c55e; font-size: 30px; font-weight: bold; line-height: 60px;">✓</span>
            </div>
          </div>
          
          <h2 style="color: #f5f5f4; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 20px;">Password Changed Successfully</h2>
          
          <p style="color: #d6d3d1; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #d6d3d1; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">This email is to confirm that the password for your ViewMax account has been successfully changed.</p>
          
          <p style="color: #ea580c; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 30px; padding: 10px; background-color: rgba(234, 88, 12, 0.1); border-radius: 8px; border: 1px solid rgba(234, 88, 12, 0.2);">
            If you did not perform this change, please contact our support team immediately to secure your account.
          </p>
          
          <div style="border-top: 1px solid rgba(245, 158, 11, 0.1); padding-top: 20px; text-align: center;">
            <p style="color: #78716c; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ViewMax Booking System. All rights reserved.</p>
          </div>
        </div>
        `
      );
      this.logger.debug(`Password changed success email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset confirmation email to ${email}: ${error.message}`);
    }
  }
}
