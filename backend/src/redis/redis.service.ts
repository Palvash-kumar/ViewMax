import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // --- Generic operations ---

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // --- Seat Locking ---

  private seatKey(showtimeId: string, seatNumber: string): string {
    return `seat:${showtimeId}:${seatNumber}`;
  }

  /**
   * Lock a seat for a user with a 10-minute TTL.
   * Uses SET NX to prevent race conditions.
   * Returns true if lock was acquired, false if already locked.
   */
  async lockSeat(
    showtimeId: string,
    seatNumber: string,
    userId: string,
    ttl: number = 600,
  ): Promise<boolean> {
    const key = this.seatKey(showtimeId, seatNumber);
    const result = await this.client.set(key, userId, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  /**
   * Unlock a seat. Only the user who locked it can unlock it.
   */
  async unlockSeat(
    showtimeId: string,
    seatNumber: string,
    userId: string,
  ): Promise<boolean> {
    const key = this.seatKey(showtimeId, seatNumber);
    const lockedBy = await this.client.get(key);

    if (lockedBy === userId) {
      await this.client.del(key);
      return true;
    }

    return false;
  }

  /**
   * Force unlock a seat (for admin / payment failure cleanup).
   */
  async forceUnlockSeat(showtimeId: string, seatNumber: string): Promise<void> {
    const key = this.seatKey(showtimeId, seatNumber);
    await this.client.del(key);
  }

  /**
   * Get who locked a specific seat.
   */
  async getSeatLock(
    showtimeId: string,
    seatNumber: string,
  ): Promise<string | null> {
    const key = this.seatKey(showtimeId, seatNumber);
    return this.client.get(key);
  }

  /**
   * Lock multiple seats atomically.
   * Returns true only if ALL seats were locked.
   * If any fail, all previously locked seats are rolled back.
   */
  async lockSeats(
    showtimeId: string,
    seatNumbers: string[],
    userId: string,
    ttl: number = 600,
  ): Promise<boolean> {
    const locked: string[] = [];

    for (const seat of seatNumbers) {
      const success = await this.lockSeat(showtimeId, seat, userId, ttl);
      if (!success) {
        // Rollback all previously locked seats
        for (const lockedSeat of locked) {
          await this.unlockSeat(showtimeId, lockedSeat, userId);
        }
        return false;
      }
      locked.push(seat);
    }

    return true;
  }

  /**
   * Unlock multiple seats for a user.
   */
  async unlockSeats(
    showtimeId: string,
    seatNumbers: string[],
    userId: string,
  ): Promise<void> {
    for (const seat of seatNumbers) {
      await this.unlockSeat(showtimeId, seat, userId);
    }
  }

  /**
   * Check if seats are available (not locked by someone else).
   */
  async areSeatsAvailable(
    showtimeId: string,
    seatNumbers: string[],
    userId?: string,
  ): Promise<boolean> {
    for (const seat of seatNumbers) {
      const lockedBy = await this.getSeatLock(showtimeId, seat);
      if (lockedBy && lockedBy !== userId) {
        return false;
      }
    }
    return true;
  }

  // --- Caching helpers ---

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, serialized, 'EX', ttl);
    } else {
      await this.client.set(key, serialized);
    }
  }

  // --- Rate Limiting ---

  /**
   * Simple sliding window rate limiter.
   * Returns the current count after increment.
   */
  async incrementRateLimit(
    key: string,
    windowSeconds: number,
  ): Promise<number> {
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    return results?.[0]?.[1] as number;
  }
}
