import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SecurityEvent,
  SecurityEventDocument,
  SecurityEventType,
  SecuritySeverity,
} from './schemas/security-event.schema';
import { RedisService } from '../redis/redis.service';
import * as crypto from 'crypto';

export interface SessionInfo {
  sessionId: string;
  device: string;
  browser: string;
  ipAddress: string;
  location?: string;
  createdAt: Date;
  lastActive: Date;
  isCurrent?: boolean;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectModel(SecurityEvent.name)
    private securityEventModel: Model<SecurityEventDocument>,
    private redisService: RedisService,
  ) {}

  async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    details: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      metadata?: Record<string, any>;
      severity?: SecuritySeverity;
    },
  ) {
    try {
      await new this.securityEventModel({
        userId: new Types.ObjectId(userId),
        eventType,
        severity: details.severity || this.getSeverity(eventType),
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        location: details.location,
        metadata: details.metadata,
      }).save();
    } catch (error) {
      this.logger.error('Failed to log security event', error.message);
    }
  }

  private getSeverity(eventType: SecurityEventType): SecuritySeverity {
    const highSeverity = [SecurityEventType.SUSPICIOUS_ACTIVITY, SecurityEventType.SESSION_TERMINATED];
    const mediumSeverity = [SecurityEventType.LOGIN_FAILED, SecurityEventType.DEVICE_CHANGE];
    if (highSeverity.includes(eventType)) return SecuritySeverity.HIGH;
    if (mediumSeverity.includes(eventType)) return SecuritySeverity.MEDIUM;
    return SecuritySeverity.LOW;
  }

  async createSession(userId: string, sessionInfo: Omit<SessionInfo, 'sessionId'>): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData: SessionInfo = { sessionId, ...sessionInfo };
    const key = `session:${userId}:${sessionId}`;
    await this.redisService.setJson(key, sessionData, 7 * 24 * 3600);
    return sessionId;
  }

  async getActiveSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const client = this.redisService.getClient();
    const pattern = `session:${userId}:*`;
    const keys = await client.keys(pattern);

    const sessions: SessionInfo[] = [];
    for (const key of keys) {
      const data = await this.redisService.getJson<SessionInfo>(key);
      if (data) {
        sessions.push({ ...data, isCurrent: data.sessionId === currentSessionId });
      }
    }

    return sessions.sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
    );
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    const key = `session:${userId}:${sessionId}`;
    await this.redisService.del(key);
    await this.logSecurityEvent(userId, SecurityEventType.SESSION_TERMINATED, {
      metadata: { sessionId },
      severity: SecuritySeverity.MEDIUM,
    });
  }

  async terminateAllSessions(userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const pattern = `session:${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  async getSecurityEvents(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.securityEventModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.securityEventModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDashboard(userId: string) {
    const [events, failedLogins] = await Promise.all([
      this.securityEventModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec(),
      this.securityEventModel.countDocuments({
        userId: new Types.ObjectId(userId),
        eventType: SecurityEventType.LOGIN_FAILED,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      }).exec(),
    ]);

    return {
      recentEvents: events,
      failedLoginsLast7Days: failedLogins,
      riskLevel: failedLogins > 5 ? 'HIGH' : failedLogins > 2 ? 'MEDIUM' : 'LOW',
    };
  }

  /**
   * Admin: get platform-wide security overview
   */
  async getAdminSecurityOverview() {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const [totalEvents, recentFailedLogins, suspiciousActivity, recentEvents] = await Promise.all([
      this.securityEventModel.countDocuments().exec(),
      this.securityEventModel.countDocuments({
        eventType: SecurityEventType.LOGIN_FAILED,
        createdAt: { $gte: oneDayAgo },
      }).exec(),
      this.securityEventModel.countDocuments({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        resolved: false,
      }).exec(),
      this.securityEventModel
        .find({ severity: { $in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] } })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(20)
        .exec(),
    ]);

    return {
      totalEvents,
      recentFailedLogins,
      suspiciousActivity,
      recentHighSeverityEvents: recentEvents,
    };
  }
}
