import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/schemas/notification.schema';
import { QUEUE_NAMES } from '../queue.constants';

/** Shape of data stored in every notification queue job */
interface NotificationJobData {
  type: NotificationType;
  userId: string;
  data: Record<string, any>;
}

/**
 * BullMQ processor for the `notification` queue.
 *
 * Receives notification jobs dispatched by QueueService and delegates
 * to the appropriate NotificationsService convenience method.
 * All processing errors are re-thrown so BullMQ can apply the
 * configured exponential-back-off retry policy.
 */
@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  /**
   * Route a notification job to the correct persistence method.
   */
  async process(job: Job<NotificationJobData>): Promise<void> {
    const { type, userId, data } = job.data;
    this.logger.log(
      `[Job ${job.id}] Processing notification type=${type} for user=${userId}`,
    );

    try {
      await this.handleNotificationType(type, userId, data);
      this.logger.debug(
        `[Job ${job.id}] Notification ${type} persisted for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Notification processing failed (type=${type}): ${error.message}`,
        error.stack,
      );
      throw error; // let BullMQ retry
    }
  }

  // ─── Private routing helper ─────────────────────────────────────────────────

  private async handleNotificationType(
    type: NotificationType,
    userId: string,
    data: Record<string, any>,
  ): Promise<void> {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMED:
        await this.notificationsService.notifyBookingConfirmed(
          userId,
          data.bookingId,
          data.movieTitle,
        );
        break;

      case NotificationType.PAYMENT_SUCCESS:
        await this.notificationsService.notifyPaymentSuccess(
          userId,
          data.amount,
          data.bookingId,
        );
        break;

      case NotificationType.BOOKING_CANCELLED:
        await this.notificationsService.notifyBookingCancelled(userId, data.bookingId);
        break;

      case NotificationType.REFUND_PROCESSED:
        await this.notificationsService.notifyRefundProcessed(
          userId,
          data.bookingId,
          data.amount,
        );
        break;

      case NotificationType.TRANSFER_RECEIVED:
        await this.notificationsService.notifyTransferReceived(
          userId,
          data.bookingId,
          data.senderName,
          data.movieTitle,
        );
        break;

      case NotificationType.MODERATOR_ASSIGNED:
        await this.notificationsService.notifyModeratorAssigned(userId, data.theatreName);
        break;

      case NotificationType.SHOW_REMINDER:
        await this.notificationsService.notifyShowReminder(
          userId,
          data.bookingId,
          data.movieTitle,
          data.showtime,
          data.theatreName,
        );
        break;

      case NotificationType.SYSTEM_ALERT:
        await this.notificationsService.notifySystemAlert(
          userId,
          data.title,
          data.message,
          data.metadata,
        );
        break;

      case NotificationType.TICKET_EXPIRY:
        // Ticket expiry notifications are sent as a side-effect by
        // TicketExpirationProcessor; this case handles explicit dispatches.
        await this.notificationsService.notifySystemAlert(
          userId,
          'Booking Expired ⏰',
          'Your pending booking has expired because payment was not completed.',
          { bookingId: data.bookingId },
        );
        break;

      default:
        this.logger.warn(`Unhandled notification type: ${type}`);
    }
  }
}
