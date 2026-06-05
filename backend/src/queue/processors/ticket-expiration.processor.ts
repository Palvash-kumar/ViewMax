import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import {
  Booking,
  BookingDocument,
} from '../../bookings/schemas/booking.schema';
import { BookingStatus } from '../../common/constants/booking-status.enum';
import { PaymentStatus } from '../../common/constants/payment-status.enum';
import { QUEUE_NAMES } from '../queue.constants';

/**
 * BullMQ processor for the `ticket-expiration` queue.
 *
 * When a booking is created, a delayed job is enqueued via QueueService.
 * This processor fires after the delay and transitions PENDING bookings
 * to EXPIRED so seat inventory is released.
 */
@Injectable()
@Processor(QUEUE_NAMES.TICKET_EXPIRATION)
export class TicketExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(TicketExpirationProcessor.name);

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {
    super();
  }

  /**
   * Process a single ticket-expiration job.
   *
   * Job data shape: `{ bookingId: string }`
   *
   * Only acts on bookings that are still PENDING – if a payment webhook
   * already confirmed the booking between enqueue and fire time, this is
   * a no-op.
   */
  async process(job: Job<{ bookingId: string }>): Promise<void> {
    const { bookingId } = job.data;
    this.logger.log(
      `[Job ${job.id}] Processing ticket expiration for booking ${bookingId}`,
    );

    let booking: BookingDocument | null = null;

    try {
      booking = await this.bookingModel.findById(bookingId).exec();
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] DB lookup failed for booking ${bookingId}: ${error.message}`,
        error.stack,
      );
      throw error; // rethrow so BullMQ retries
    }

    if (!booking) {
      // Could have been deleted; treat as handled
      this.logger.warn(
        `[Job ${job.id}] Booking ${bookingId} not found – skipping expiration`,
      );
      return;
    }

    if (booking.bookingStatus !== BookingStatus.PENDING) {
      this.logger.debug(
        `[Job ${job.id}] Booking ${bookingId} is already in status '${booking.bookingStatus}' – no action taken`,
      );
      return;
    }

    try {
      await this.bookingModel
        .findByIdAndUpdate(bookingId, {
          bookingStatus: BookingStatus.EXPIRED,
          paymentStatus: PaymentStatus.FAILED,
        })
        .exec();

      this.logger.log(
        `[Job ${job.id}] Booking ${bookingId} successfully expired`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to expire booking ${bookingId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
