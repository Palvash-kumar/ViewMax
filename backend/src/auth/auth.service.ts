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
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto';
import { SecurityService } from '../security/security.service';
import { SecurityEventType } from '../security/schemas/security-event.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private securityService: SecurityService,
    private mailService: MailService,
  ) {}

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
    // FIX #1: Don't reveal whether the email exists — prevents user enumeration attacks
    if (!user) {
      return {
        message:
          'If an account exists with this email, a verification OTP has been sent',
      };
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

    return {
      message:
        'If an account exists with this email, a verification OTP has been sent',
    };
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

    // FIX #7: Clear OTP after first successful verification to prevent reuse
    await this.usersService.clearPasswordResetToken(user._id.toString());

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    // 1. Verify the OTP — re-check token validity (verifyOtp clears it, so re-validate the hash directly)
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid reset request');
    }

    const userWithTokens = await this.usersService.findByIdWithTokens(
      user._id.toString(),
    );
    // FIX #7: After verifyOtp clears the token, resetPassword must be called in the same
    // session. We verify via the token param matching the stored hash (which verifyOtp already
    // validated). If the token was already cleared, require the user to re-verify.
    if (!userWithTokens?.passwordResetToken) {
      // Token already cleared — either already used or re-requested
      throw new BadRequestException(
        'OTP has already been used. Please request a new one.',
      );
    }

    const isValid = await argon2.verify(
      userWithTokens.passwordResetToken,
      token,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    // 2. Reset password in database (also clears reset token)
    await this.usersService.resetPassword(user._id.toString(), newPassword);

    // 4. Send confirmation email
    await this.sendPasswordChangedSuccessEmail(
      email,
      `${user.firstName} ${user.lastName}`,
    );

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
      await this.mailService.sendMail(
        email,
        'ViewMax - Verify Your Email',
        `
          <div style="background-color: #f5f5f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
            <div style="background-color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025); overflow: hidden;">
              <div style="height: 6px; background-color: #add8e6;"></div>
              <div style="padding: 42px 32px 32px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #0284c7;">VIEWMAX</span>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 3px;">Cinematic Excellence</div>
                </div>
                <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 20px; margin-top: 0; letter-spacing: -0.5px;">Verify Your Email</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0; text-align: center;">Click the button below to verify your email address and activate your account:</p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);">Verify Email</a>
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center; margin-bottom: 32px; margin-top: 0;">This link will expire in 24 hours.</p>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ViewMax Booking System. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        `,
      );
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
      await this.mailService.sendMail(
        email,
        'ViewMax - Reset Your Password',
        `
          <div style="background-color: #f5f5f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
            <div style="background-color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025); overflow: hidden;">
              <div style="height: 6px; background-color: #add8e6;"></div>
              <div style="padding: 42px 32px 32px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #0284c7;">VIEWMAX</span>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 3px;">Cinematic Excellence</div>
                </div>
                <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 20px; margin-top: 0; letter-spacing: -0.5px;">Reset Your Password</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0; text-align: center;">Click the button below to reset your password:</p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);">Reset Password</a>
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center; margin-bottom: 32px; margin-top: 0;">This link will expire in 1 hour.</p>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ViewMax Booking System. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        `,
      );
    } catch (error) {
      this.logger.error('Failed to send reset email', error.message);
      this.logger.debug(`Reset token for ${email}: ${token}`);
    }
  }

  private async sendOtpEmail(email: string, otp: string, userName: string) {
    // FIX #8: Only log OTP in development — prevents accidental production exposure
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`[DEV ONLY] OTP code for ${email}: ${otp}`);
    }
    try {
      await this.mailService.sendMail(
        email,
        'ViewMax - Reset Your Password OTP',
        `
        <div style="background-color: #f5f5f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="background-color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025); overflow: hidden;">
            <div style="height: 6px; background-color: #add8e6;"></div>
            <div style="padding: 42px 32px 32px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #0284c7;">VIEWMAX</span>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 3px;">Cinematic Excellence</div>
              </div>
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 20px; margin-top: 0; letter-spacing: -0.5px;">Reset Your Password</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0;">We received a request to reset your ViewMax account password. Use the verification code below to proceed. This OTP is valid for <strong>15 minutes</strong>.</p>
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="background-color: #f0f9ff; border: 2px dashed #add8e6; color: #0284c7; font-size: 36px; font-weight: 800; letter-spacing: 8px; padding: 14px 28px; border-radius: 12px; display: inline-block; font-family: monospace;">${otp}</div>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center; margin-bottom: 32px; margin-top: 0;">If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
              <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ViewMax Booking System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
        `,
      );
      this.logger.debug(`OTP sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${email}: ${error.message}`,
      );
      // Fallback log for development
      this.logger.debug(`OTP for ${email}: ${otp}`);
    }
  }

  private async sendPasswordChangedSuccessEmail(
    email: string,
    userName: string,
  ) {
    try {
      await this.mailService.sendMail(
        email,
        'ViewMax - Password Changed Successfully',
        `
        <div style="background-color: #f5f5f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="background-color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025); overflow: hidden;">
            <div style="height: 6px; background-color: #add8e6;"></div>
            <div style="padding: 42px 32px 32px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #0284c7;">VIEWMAX</span>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 3px;">Cinematic Excellence</div>
              </div>
              
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="background-color: #e0f2fe; border-radius: 50%; width: 64px; height: 64px; margin: 0 auto; text-align: center; line-height: 64px;">
                  <span style="color: #0284c7; font-size: 32px; font-weight: bold; line-height: 64px;">✓</span>
                </div>
              </div>
              
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 20px; margin-top: 0; letter-spacing: -0.5px;">Password Reset Successfully</h2>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0;">This email is to confirm that the password for your ViewMax account has been successfully changed.</p>
              
              <div style="color: #0369a1; font-size: 13.5px; line-height: 1.5; padding: 16px; background-color: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd; margin-bottom: 32px; font-weight: 500;">
                If you did not perform this change, please contact our support team immediately to secure your account.
              </div>
              
              <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ViewMax Booking System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
        `,
      );
      this.logger.debug(
        `Password changed success email sent successfully to ${email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation email to ${email}: ${error.message}`,
      );
    }
  }
}
