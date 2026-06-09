import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from '../redis/redis.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private connection: Connection,
    private redisService: RedisService,
  ) {}

  async check() {
    const start = Date.now();

    // Check MongoDB
    const mongoStart = Date.now();
    let mongoStatus = 'healthy';
    let mongoLatency = 0;
    try {
      await this.connection.db?.admin().ping();
      mongoLatency = Date.now() - mongoStart;
    } catch {
      mongoStatus = 'unhealthy';
    }

    // Check Redis
    const redisStart = Date.now();
    let redisStatus = 'healthy';
    let redisLatency = 0;
    try {
      const client = this.redisService.getClient();
      await client.ping();
      redisLatency = Date.now() - redisStart;
    } catch {
      redisStatus = 'unhealthy';
    }

    const overallHealthy =
      mongoStatus === 'healthy' && redisStatus === 'healthy';
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      status: overallHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '4.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: mongoStatus,
          latency: mongoLatency,
          readyState: this.connection.readyState,
        },
        redis: {
          status: redisStatus,
          latency: redisLatency,
        },
      },
      system: {
        cpus: os.cpus().length,
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
        freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
        memoryUsage: Math.round((usedMemory / totalMemory) * 100),
      },
    };
  }

  getLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async getReadiness() {
    const mongoReady = this.connection.readyState === 1;
    let redisReady = true;
    try {
      const client = this.redisService.getClient();
      await client.ping();
    } catch {
      redisReady = false;
    }

    const ready = mongoReady && redisReady;
    return {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        mongo: mongoReady ? 'ok' : 'fail',
        redis: redisReady ? 'ok' : 'fail',
      },
    };
  }
}
