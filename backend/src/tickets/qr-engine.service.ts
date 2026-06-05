import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { RedisService } from '../redis/redis.service';

export interface QRPayload {
  bookingId: string;
  userId: string;
  showtimeId: string;
  seats: string[];
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  v: number; // version
}

export interface QRGenerationResult {
  qrCodeDataUrl: string;
  verificationToken: string;
  ticketSignature: string;
  payload: QRPayload;
}

/**
 * Cryptographic QR code engine for ViewMax ticket lifecycle.
 *
 * Each ticket QR carries an HMAC-SHA256 signed payload containing:
 *   - Booking/user/showtime IDs
 *   - A unique one-time nonce persisted in Redis
 *   - Expiry timestamp (showtime start)
 *   - Protocol version (v=2)
 *
 * The verification token is structured as:
 *   base64url(JSON payload) + "." + HMAC-SHA256(payload)
 *
 * Nonces are invalidated upon check-in to prevent replay attacks.
 */
@Injectable()
export class QrEngineService {
  private readonly logger = new Logger(QrEngineService.name);

  /** Nonce TTL: 7 days — covers the longest reasonable pre-purchase window */
  private readonly NONCE_TTL = 86400 * 7;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Returns the HMAC signing secret from config.
   * Falls back to a default for local dev only.
   */
  private get secret(): string {
    return (
      this.configService.get<string>('jwt.accessSecret') ?? 'viewmax-qr-secret'
    );
  }

  /**
   * Generate a cryptographically signed QR code for a confirmed booking.
   *
   * @param bookingId  MongoDB ObjectId string of the booking
   * @param userId     MongoDB ObjectId string of the ticket owner
   * @param showtimeId MongoDB ObjectId string of the associated showtime
   * @param seats      Array of seat identifiers (e.g. ["A1","A2"])
   * @param expiresAt  When the ticket is no longer valid (showtime start time)
   * @returns QRGenerationResult with PNG data URL, signed token, and raw payload
   */
  async generateTicketQR(
    bookingId: string,
    userId: string,
    showtimeId: string,
    seats: string[],
    expiresAt: Date,
  ): Promise<QRGenerationResult> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const issuedAt = Date.now();

    const payload: QRPayload = {
      bookingId,
      userId,
      showtimeId,
      seats,
      nonce,
      issuedAt,
      expiresAt: expiresAt.getTime(),
      v: 2,
    };

    // Sign the canonical JSON representation
    const payloadStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadStr)
      .digest('hex');

    // Token = base64url(payload) + "." + hex(signature)
    const verificationToken = `${Buffer.from(payloadStr).toString('base64url')}.${signature}`;

    // Persist nonce in Redis — existence check prevents replay after invalidation
    await this.redisService.set(
      `qr:nonce:${nonce}`,
      JSON.stringify({ bookingId, used: false }),
      this.NONCE_TTL,
    );

    // Build compact JSON for QR payload (minimise QR density)
    const qrData = JSON.stringify({ v: verificationToken, b: bookingId });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // Highest redundancy — survives 30% damage
      margin: 1,
      color: {
        dark: '#0a0e1a',
        light: '#ffffff',
      },
    });

    this.logger.log(`QR generated for booking ${bookingId}`);

    return {
      qrCodeDataUrl,
      verificationToken,
      ticketSignature: signature,
      payload,
    };
  }

  /**
   * Verify a ticket verification token without consuming it (non-destructive).
   *
   * Checks:
   *  1. Token structure (base64url.hex)
   *  2. HMAC signature integrity (timing-safe comparison)
   *  3. Expiry timestamp
   *  4. Nonce existence in Redis (not already invalidated)
   *
   * @returns { valid, payload?, reason? }
   */
  async verifyToken(verificationToken: string): Promise<{
    valid: boolean;
    payload?: QRPayload;
    reason?: string;
  }> {
    try {
      const dotIndex = verificationToken.lastIndexOf('.');
      if (dotIndex === -1) {
        return { valid: false, reason: 'Malformed token: missing separator' };
      }

      const payloadB64 = verificationToken.substring(0, dotIndex);
      const signature = verificationToken.substring(dotIndex + 1);

      if (!payloadB64 || !signature) {
        return { valid: false, reason: 'Malformed token: empty segment' };
      }

      // Decode and parse payload
      const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload: QRPayload = JSON.parse(payloadStr);

      // Re-compute expected signature and compare with timing-safe equals
      const expectedSig = crypto
        .createHmac('sha256', this.secret)
        .update(payloadStr)
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'hex');
      const expectedBuf = Buffer.from(expectedSig, 'hex');

      if (
        sigBuf.length !== expectedBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expectedBuf)
      ) {
        return { valid: false, reason: 'Invalid signature' };
      }

      // Check temporal validity
      if (Date.now() > payload.expiresAt) {
        return { valid: false, reason: 'Ticket has expired' };
      }

      // Check nonce is still live in Redis
      const nonceData = await this.redisService.getJson<{
        bookingId: string;
        used: boolean;
      }>(`qr:nonce:${payload.nonce}`);

      if (!nonceData) {
        return {
          valid: false,
          reason: 'Ticket nonce expired or already invalidated',
        };
      }

      return { valid: true, payload };
    } catch (error) {
      this.logger.error('Token verification error', (error as Error).message);
      return { valid: false, reason: 'Token verification failed' };
    }
  }

  /**
   * Permanently invalidate a nonce after successful check-in.
   * This is the key anti-replay mechanism — the QR becomes useless once consumed.
   *
   * @param nonce The nonce extracted from the verified QR payload
   */
  async invalidateNonce(nonce: string): Promise<void> {
    await this.redisService.del(`qr:nonce:${nonce}`);
    this.logger.log(`Nonce invalidated: ${nonce.substring(0, 8)}...`);
  }
}
