import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
  NotificationChannel,
} from './schemas/notification.schema';

/** DTO for creating a single notification record */
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
  link?: string;
  icon?: string;
}

/** Paginated response shape for notification lists */
export interface PaginatedNotificationsResult {
  data: NotificationDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

/**
 * Core service for ViewMax's Notification Center.
 *
 * Responsibilities:
 *  - Persisting notification records to MongoDB
 *  - Querying / paginating notifications per user
 *  - Marking individual or all notifications as read
 *  - Convenience factory methods called by BullMQ processors and other services
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  // ─── Core CRUD ───────────────────────────────────────────────────────────────

  /**
   * Persist a new notification to the database.
   * @param dto  Notification creation payload
   * @returns    Saved document
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    try {
      const notification = new this.notificationModel({
        userId: new Types.ObjectId(dto.userId),
        type: dto.type,
        title: dto.title,
        message: dto.message,
        channel: dto.channel ?? NotificationChannel.IN_APP,
        metadata: dto.metadata ?? {},
        link: dto.link,
        icon: dto.icon,
      });
      const saved = await notification.save();
      this.logger.debug(
        `Notification created [${dto.type}] for user ${dto.userId} – id: ${saved._id}`,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create notification for user ${dto.userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieve paginated notifications for a given user.
   * @param userId      Hex string user ObjectId
   * @param page        1-based page number
   * @param limit       Documents per page
   * @param unreadOnly  If true, filters to unread notifications only
   */
  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<PaginatedNotificationsResult> {
    const skip = (page - 1) * limit;
    const baseFilter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    const queryFilter = unreadOnly ? { ...baseFilter, isRead: false } : baseFilter;

    const [data, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(queryFilter).exec(),
      this.notificationModel
        .countDocuments({ userId: new Types.ObjectId(userId), isRead: false })
        .exec(),
    ]);

    return {
      data: data as NotificationDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Return only the unread notification count for the notification badge.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId: new Types.ObjectId(userId), isRead: false })
      .exec();
  }

  /**
   * Mark a single notification as read.
   * Validates ownership so one user cannot read another user's notification.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId: new Types.ObjectId(userId) },
        { isRead: true },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException(
        `Notification ${notificationId} not found for user ${userId}`,
      );
    }
  }

  /**
   * Bulk-mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRead: false },
        { isRead: true },
      )
      .exec();
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a specific notification. Validates ownership.
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationModel
      .findOneAndDelete({
        _id: notificationId,
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!result) {
      throw new NotFoundException(
        `Notification ${notificationId} not found for user ${userId}`,
      );
    }
  }

  // ─── Convenience Notification Builders ──────────────────────────────────────
  // These are called directly from services OR via the notification BullMQ processor.

  /**
   * Notify a user that their booking is confirmed.
   */
  async notifyBookingConfirmed(
    userId: string,
    bookingId: string,
    movieTitle: string,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed! 🎬',
      message: `Your tickets for "${movieTitle}" are confirmed. View your QR code.`,
      link: `/bookings/${bookingId}`,
      icon: 'ticket',
      metadata: { bookingId, movieTitle },
    });
  }

  /**
   * Notify a user that their payment was successful.
   */
  async notifyPaymentSuccess(
    userId: string,
    amount: number,
    bookingId: string,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful ✅',
      message: `Payment of ₹${amount} processed successfully.`,
      link: `/bookings/${bookingId}`,
      icon: 'check-circle',
      metadata: { amount, bookingId },
    });
  }

  /**
   * Notify a user that their booking was cancelled.
   */
  async notifyBookingCancelled(userId: string, bookingId: string): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: 'Your booking has been cancelled successfully.',
      link: `/bookings`,
      icon: 'x-circle',
      metadata: { bookingId },
    });
  }

  /**
   * Notify a user that a refund has been processed for their booking.
   */
  async notifyRefundProcessed(
    userId: string,
    bookingId: string,
    amount: number,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.REFUND_PROCESSED,
      title: 'Refund Initiated 💰',
      message: `A refund of ₹${amount} is being processed for your cancelled booking.`,
      link: `/bookings/${bookingId}`,
      icon: 'refresh-cw',
      metadata: { bookingId, amount },
    });
  }

  /**
   * Notify a user that they received a transferred ticket.
   */
  async notifyTransferReceived(
    userId: string,
    bookingId: string,
    senderName: string,
    movieTitle: string,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.TRANSFER_RECEIVED,
      title: 'Ticket Received 🎟️',
      message: `${senderName} transferred tickets for "${movieTitle}" to you.`,
      link: `/bookings/${bookingId}`,
      icon: 'send',
      metadata: { bookingId, senderName, movieTitle },
    });
  }

  /**
   * Notify a user that they have been assigned as a theatre moderator.
   */
  async notifyModeratorAssigned(userId: string, theatreName: string): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.MODERATOR_ASSIGNED,
      title: 'Moderator Access Granted 🛡️',
      message: `You have been assigned as moderator for "${theatreName}".`,
      icon: 'shield',
      metadata: { theatreName },
    });
  }

  /**
   * Send a generic system-level alert to a user.
   */
  async notifySystemAlert(
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
      icon: 'bell',
      metadata,
    });
  }

  /**
   * Remind a user about an upcoming showtime.
   */
  async notifyShowReminder(
    userId: string,
    bookingId: string,
    movieTitle: string,
    showtime: string,
    theatreName: string,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.SHOW_REMINDER,
      title: 'Show Starting Soon ⏰',
      message: `"${movieTitle}" at ${theatreName} starts at ${showtime}. Don't be late!`,
      link: `/bookings/${bookingId}`,
      icon: 'clock',
      metadata: { bookingId, movieTitle, showtime, theatreName },
    });
  }
}
