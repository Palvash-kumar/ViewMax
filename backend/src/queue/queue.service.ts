import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';
import { NotificationType } from '../notifications/schemas/notification.schema';

/**
 * QueueService
 *
 * Central façade for enqueuing jobs into BullMQ queues.
 * Other services (BookingsService, PaymentsService, etc.) should inject this
 * instead of directly interacting with Queue instances.
 *
 * Available queues:
 *  - `ticket-expiration`  Delayed jobs that expire PENDING bookings
 *  - `notification`       Async notification persistence jobs
 *  - `analytics`          Fire-and-forget analytics event jobs
 *  - `email`              (Reserved) Email delivery jobs
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.TICKET_EXPIRATION)
    private readonly ticketExpirationQueue: Queue,

    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private readonly notificationQueue: Queue,

    @InjectQueue(QUEUE_NAMES.ANALYTICS)
    private readonly analyticsQueue: Queue,

    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue: Queue,
  ) {}

  // ─── Ticket Expiration ───────────────────────────────────────────────────────

  /**
   * Schedule a delayed job that will expire a PENDING booking if payment is
   * not completed within the given window.
   *
   * Uses `jobId: expire:<bookingId>` to deduplicate – a second call with the
   * same bookingId will NOT add a second job.
   *
   * @param bookingId  MongoDB ObjectId string
   * @param delayMs    Delay before expiration fires (default 30 minutes)
   */
  async enqueueTicketExpiration(
    bookingId: string,
    delayMs: number = 30 * 60 * 1_000,
  ): Promise<void> {
    try {
      await this.ticketExpirationQueue.add(
        'expire-ticket',
        { bookingId },
        {
          delay: delayMs,
          jobId: `expire:${bookingId}`, // idempotency key
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );
      this.logger.debug(
        `Enqueued ticket expiration for booking ${bookingId} in ${delayMs}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue expiration for booking ${bookingId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cancel a previously scheduled ticket expiration job.
   * Call this when a booking is confirmed via payment webhook.
   */
  async cancelTicketExpiration(bookingId: string): Promise<void> {
    try {
      const job = await this.ticketExpirationQueue.getJob(
        `expire:${bookingId}`,
      );
      if (job) {
        await job.remove();
        this.logger.debug(`Cancelled expiration job for booking ${bookingId}`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not cancel expiration job for booking ${bookingId}: ${error.message}`,
      );
    }
  }

  // ─── Notifications ───────────────────────────────────────────────────────────

  /**
   * Enqueue an async notification job.
   * Decouples the caller from direct DB writes for notification persistence.
   *
   * @param type    Notification type enum value
   * @param userId  Target user's ObjectId string
   * @param data    Notification-type-specific payload
   */
  async enqueueNotification(
    type: NotificationType,
    userId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await this.notificationQueue.add(
        'send-notification',
        { type, userId, data },
        { attempts: 3, removeOnComplete: 100, removeOnFail: 50 },
      );
      this.logger.debug(
        `Enqueued notification type=${type} for user=${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue notification (type=${type}) for user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  /**
   * Fire-and-forget analytics event.
   *
   * @param event  Event name (e.g. 'booking.created', 'payment.success')
   * @param data   Event payload
   */
  async enqueueAnalyticsEvent(
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await this.analyticsQueue.add(
        'analytics-event',
        { event, data, timestamp: Date.now() },
        { removeOnComplete: 200, removeOnFail: 50 },
      );
      this.logger.debug(`Enqueued analytics event: ${event}`);
    } catch (error) {
      // Analytics failures must never bubble up and break the primary flow
      this.logger.warn(`Analytics enqueue failed (${event}): ${error.message}`);
    }
  }

  // ─── Email (reserved) ────────────────────────────────────────────────────────

  /**
   * Enqueue a transactional email job.
   *
   * @param template  Email template identifier
   * @param to        Recipient email address
   * @param context   Template variable context
   * @param bookingId Optional associated booking ID
   */
  async enqueueEmail(
    template: string,
    to: string,
    context: Record<string, any>,
    bookingId?: string,
  ): Promise<void> {
    try {
      await this.emailQueue.add(
        'send-email',
        { template, to, context, bookingId },
        { attempts: 5, removeOnComplete: 100, removeOnFail: 100 },
      );
      this.logger.debug(`Enqueued email template=${template} to=${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue email to ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  // ─── Queue Health ────────────────────────────────────────────────────────────

  /**
   * Retrieve basic health metrics for all managed queues.
   * Useful for an admin health-check endpoint.
   */
  async getQueueHealth(): Promise<Record<string, Record<string, number>>> {
    const queues = [
      {
        name: QUEUE_NAMES.TICKET_EXPIRATION,
        queue: this.ticketExpirationQueue,
      },
      { name: QUEUE_NAMES.NOTIFICATION, queue: this.notificationQueue },
      { name: QUEUE_NAMES.ANALYTICS, queue: this.analyticsQueue },
      { name: QUEUE_NAMES.EMAIL, queue: this.emailQueue },
    ];

    const health: Record<string, Record<string, number>> = {};

    await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all(
          [
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
          ],
        );
        health[name] = { waiting, active, completed, failed, delayed };
      }),
    );

    return health;
  }
}
