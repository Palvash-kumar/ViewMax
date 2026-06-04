import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SecurityEventDocument = SecurityEvent & Document;

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  DEVICE_CHANGE = 'DEVICE_CHANGE',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Schema({ timestamps: true })
export class SecurityEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: SecurityEventType, required: true })
  eventType: SecurityEventType;

  @Prop({ type: String, enum: SecuritySeverity, default: SecuritySeverity.LOW })
  severity: SecuritySeverity;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  location: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: false })
  resolved: boolean;
}

export const SecurityEventSchema = SchemaFactory.createForClass(SecurityEvent);

SecurityEventSchema.index({ userId: 1, createdAt: -1 });
SecurityEventSchema.index({ eventType: 1 });
SecurityEventSchema.index({ severity: 1, resolved: 1 });
