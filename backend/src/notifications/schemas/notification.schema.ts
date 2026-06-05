import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

/**
 * Enum representing all notification types in ViewMax.
 */
export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SHOW_REMINDER = 'SHOW_REMINDER',
  TICKET_EXPIRY = 'TICKET_EXPIRY',
  MODERATOR_ASSIGNED = 'MODERATOR_ASSIGNED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  TRANSFER_RECEIVED = 'TRANSFER_RECEIVED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
}

/**
 * Delivery channels for notifications.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}

/**
 * Notification document schema.
 * Stores per-user notifications for the in-app notification center.
 */
@Schema({ timestamps: true })
export class Notification {
  /** The user who should receive this notification */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Categorical type used to drive frontend icons/copy */
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  /** Short notification heading shown in the notification center */
  @Prop({ required: true })
  title: string;

  /** Body text of the notification */
  @Prop({ required: true })
  message: string;

  /** Whether the user has dismissed / read this notification */
  @Prop({ default: false, index: true })
  isRead: boolean;

  /** Delivery channel – defaults to IN_APP */
  @Prop({
    type: String,
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  /** Arbitrary structured payload (bookingId, movieTitle, amount, etc.) */
  @Prop({ type: Object })
  metadata: Record<string, any>;

  /** Optional deep-link URL rendered in the frontend */
  @Prop()
  link: string;

  /** Icon identifier string (maps to a frontend icon set key) */
  @Prop({ type: String })
  icon: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound indexes for the most common query patterns
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
