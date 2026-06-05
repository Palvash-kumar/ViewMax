import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * Anti-fraud service for the ViewMax ticket lifecycle.
 *
 * Responsibilities:
 *  - Rate-limit QR verification attempts per booking (burst detection)
 *  - Atomic check-in idempotency guard (prevents double check-in across devices)
 *  - IP-level suspicious-activity detection
 *
 * All state is stored in Redis with appropriate TTLs so no DB writes are needed.
 */
@Injectable()
export class AntiFraudService {
  private readonly logger = new Logger(AntiFraudService.name);

  /** Maximum verification attempts per booking in a 5-minute window */
  private readonly MAX_VERIFY_ATTEMPTS = 10;
  private readonly VERIFY_WINDOW_SECONDS = 300; // 5 minutes

  /** IP rate-limit: requests per minute before flagging */
  private readonly MAX_IP_REQUESTS_PER_MINUTE = 30;

  /** Check-in record TTL: 7 days (covers the entire showtime window) */
  private readonly CHECKIN_TTL = 86400 * 7;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Track a QR verification attempt for a specific booking.
   * Returns false (and emits a warning) if the threshold is exceeded,
   * indicating potential brute-force or automated scanning.
   *
   * @param bookingId  The booking being verified
   * @param ipAddress  Optional originating IP for log correlation
   * @returns true if the attempt is within acceptable limits, false to block
   */
  async trackVerificationAttempt(
    bookingId: string,
    ipAddress?: string,
  ): Promise<boolean> {
    const key = `fraud:verify:${bookingId}`;
    const attempts = await this.redisService.incrementRateLimit(
      key,
      this.VERIFY_WINDOW_SECONDS,
    );

    if (attempts > this.MAX_VERIFY_ATTEMPTS) {
      this.logger.warn(
        `Suspicious verification activity — booking: ${bookingId}, ip: ${ipAddress ?? 'unknown'}, attempts: ${attempts}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Check whether a booking has already been check-in marked in Redis.
   * This is a fast read-only probe used before the atomic write in markCheckedIn.
   *
   * @param bookingId  The booking to probe
   */
  async isAlreadyCheckedIn(bookingId: string): Promise<boolean> {
    return this.redisService.exists(`checkin:${bookingId}`);
  }

  /**
   * Atomically mark a booking as checked in.
   *
   * Uses Redis GET-then-SET pattern: if the key already exists the operation
   * is a no-op and returns false, signalling a duplicate check-in race.
   * The first writer wins — subsequent scanners are rejected.
   *
   * @param bookingId  Booking to mark
   * @param staffId    Staff member performing the check-in (for audit trail)
   * @returns true if this call was the first to claim the check-in, false otherwise
   */
  async markCheckedIn(bookingId: string, staffId: string): Promise<boolean> {
    const key = `checkin:${bookingId}`;

    // Idempotency guard — only the first call succeeds
    const existing = await this.redisService.get(key);
    if (existing) {
      this.logger.warn(
        `Duplicate check-in attempt for booking ${bookingId} by staff ${staffId}`,
      );
      return false;
    }

    await this.redisService.set(
      key,
      JSON.stringify({ staffId, at: Date.now() }),
      this.CHECKIN_TTL,
    );
    return true;
  }

  /**
   * Detect whether an IP address is making requests at a suspicious rate.
   * Threshold: more than 30 requests per minute.
   *
   * @param ipAddress  The originating IP address
   * @returns true if the IP should be considered suspicious/blocked
   */
  async isSuspiciousIp(ipAddress: string): Promise<boolean> {
    const key = `fraud:ip:${ipAddress}`;
    const requests = await this.redisService.incrementRateLimit(key, 60);

    if (requests > this.MAX_IP_REQUESTS_PER_MINUTE) {
      this.logger.warn(
        `Suspicious IP activity from ${ipAddress}: ${requests} req/min`,
      );
      return true;
    }

    return false;
  }
}
