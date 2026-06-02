import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Log an action. Fire-and-forget — doesn't throw on failure.
   */
  async log(
    actorId: string,
    action: string,
    resource: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await new this.auditLogModel({
        actorId,
        action,
        resource,
        metadata,
      }).save();
    } catch (error) {
      // Silent fail — audit logging should never break the main flow
      console.error('Audit log failed:', error.message);
    }
  }

  async findAll(
    page = 1,
    limit = 20,
    action?: string,
    resource?: string,
  ): Promise<PaginatedResult<AuditLogDocument>> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate('actorId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
