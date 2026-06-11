import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import {
  EmailLog,
  EmailLogDocument,
} from '../../notifications/schemas/email-log.schema';
import { MailService } from '../../mail/mail.service';

// Import template compilers
import { compileBookingConfirmationEmail } from '../../notifications/templates/booking-confirmation.template';
import { compilePaymentSuccessfulEmail } from '../../notifications/templates/payment-successful.template';
import { compileReminderNotificationEmail } from '../../notifications/templates/reminder-notification.template';
import { compileTicketCancelledEmail } from '../../notifications/templates/ticket-cancelled.template';
import { compileTicketRefundedEmail } from '../../notifications/templates/ticket-refunded.template';
import { compileShowtimeChangedEmail } from '../../notifications/templates/showtime-changed.template';
import { generateIcsString } from '../../common/utils/calendar.utils';

interface EmailJobData {
  template: string;
  to: string;
  context: Record<string, any>;
  bookingId?: string;
}

@Injectable()
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(EmailLog.name)
    private readonly emailLogModel: Model<EmailLogDocument>,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { template, to, context, bookingId } = job.data;
    this.logger.log(`[Job ${job.id}] Sending email [${template}] to ${to}`);

    // 1. Create a pending EmailLog record in MongoDB
    const emailLog = new this.emailLogModel({
      to,
      template,
      bookingId: bookingId ? new Types.ObjectId(bookingId) : undefined,
      status: 'queued',
      attempts: job.attemptsMade + 1,
      metadata: { jobId: job.id },
    });
    await emailLog.save();

    try {
      const backendUrl =
        this.configService.get<string>('backend.url') ||
        'http://localhost:4000';

      const trackingPixelUrl = `${backendUrl}/api/notifications/track-email/${emailLog._id.toString()}/open`;

      // 2. Render HTML template using context and track pixel URL
      let html = '';
      let subject = '';
      let attachments: any[] | undefined = undefined;

      switch (template) {
        case 'booking-confirmation': {
          let qrCodeUrl = context.qrCode;
          const currentAttachments: any[] = [];

          if (context.qrCode && context.qrCode.startsWith('data:image/')) {
            const parts = context.qrCode.split(',');
            if (parts.length > 1) {
              const base64Data = parts[1];
              const contentType =
                parts[0].split(';')[0].split(':')[1] || 'image/png';
              const ext = contentType.split('/')[1] || 'png';
              currentAttachments.push({
                filename: `ticket-qr.${ext}`,
                content: Buffer.from(base64Data, 'base64'),
                contentType,
                cid: 'ticket-qrcode',
              });
              qrCodeUrl = 'cid:ticket-qrcode';
            }
          }

          // Dynamic invite.ics calendar attachment
          try {
            const startTime = new Date(context.startTime);
            const duration = Number(context.duration) || 120;
            const endTime = new Date(
              startTime.getTime() + duration * 60 * 1000,
            );
            const calDescription = `Your premium movie ticket for ${context.movieTitle} is confirmed!\n\nBooking ID: ${context.bookingId}\nSeats: ${context.seatNumbers?.join(', ') || ''}\nScreen: ${context.screenName || ''} (${context.screenType || ''})\n\nBooked via ViewMax`;

            const calendarOptions = {
              title: `${context.movieTitle} - ViewMax Cinema`,
              description: calDescription,
              location: `${context.theatreName || ''}, ${context.theatreAddress || ''}`,
              startTime,
              endTime,
              uid: context.bookingId,
            };

            const icsString = generateIcsString(calendarOptions);
            currentAttachments.push({
              filename: 'invite.ics',
              content: icsString,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            });
          } catch (calErr) {
            this.logger.error(
              `Failed to generate calendar invite attachment: ${calErr.message}`,
            );
          }

          if (currentAttachments.length > 0) {
            attachments = currentAttachments;
          }

          html = compileBookingConfirmationEmail(
            {
              bookingId: context.bookingId,
              movieTitle: context.movieTitle,
              moviePoster: context.moviePoster,
              theatreName: context.theatreName,
              theatreAddress: context.theatreAddress,
              screenName: context.screenName,
              screenType: context.screenType,
              startTime: new Date(context.startTime),
              duration: context.duration,
              seatNumbers: context.seatNumbers,
              totalPrice: context.totalPrice,
              paymentStatus: context.paymentStatus,
              qrCodeUrl,
              backendUrl,
              recipientName: context.recipientName,
            },
            trackingPixelUrl,
          );
          subject = `Your ViewMax Booking Confirmation: ${context.movieTitle}`;
          break;
        }

        case 'payment-successful':
          html = compilePaymentSuccessfulEmail(
            {
              bookingId: context.bookingId,
              movieTitle: context.movieTitle,
              seatNumbers: context.seatNumbers,
              totalPrice: context.totalPrice,
              paymentIntentId: context.paymentIntentId || 'pi_mock_transaction',
              recipientName: context.recipientName,
              backendUrl,
            },
            trackingPixelUrl,
          );
          subject = `Receipt from ViewMax - Booking #${context.bookingId}`;
          break;

        case 'reminder-notification': {
          let qrCodeUrl = context.qrCode;
          const currentAttachments: any[] = [];

          if (context.qrCode && context.qrCode.startsWith('data:image/')) {
            const parts = context.qrCode.split(',');
            if (parts.length > 1) {
              const base64Data = parts[1];
              const contentType =
                parts[0].split(';')[0].split(':')[1] || 'image/png';
              const ext = contentType.split('/')[1] || 'png';
              currentAttachments.push({
                filename: `ticket-qr.${ext}`,
                content: Buffer.from(base64Data, 'base64'),
                contentType,
                cid: 'ticket-qrcode',
              });
              qrCodeUrl = 'cid:ticket-qrcode';
            }
          }

          if (currentAttachments.length > 0) {
            attachments = currentAttachments;
          }

          html = compileReminderNotificationEmail(
            {
              bookingId: context.bookingId,
              movieTitle: context.movieTitle,
              theatreName: context.theatreName,
              theatreAddress: context.theatreAddress,
              screenName: context.screenName,
              screenType: context.screenType,
              startTime: new Date(context.startTime),
              seatNumbers: context.seatNumbers,
              qrCodeUrl,
              countdownText: context.countdownText || 'in 2 hours',
              recipientName: context.recipientName,
              backendUrl,
            },
            trackingPixelUrl,
          );
          subject = `Reminder: ${context.movieTitle} starts ${context.countdownText}!`;
          break;
        }

        case 'ticket-cancelled':
          html = compileTicketCancelledEmail(
            {
              bookingId: context.bookingId,
              movieTitle: context.movieTitle,
              seatNumbers: context.seatNumbers,
              totalPrice: context.totalPrice,
              startTime: new Date(context.startTime),
              recipientName: context.recipientName,
              backendUrl,
            },
            trackingPixelUrl,
          );
          subject = `Booking Cancelled: ${context.movieTitle}`;
          break;

        case 'ticket-refunded':
          html = compileTicketRefundedEmail(
            {
              bookingId: context.bookingId,
              movieTitle: context.movieTitle,
              refundAmount: context.refundAmount,
              paymentIntentId: context.paymentIntentId || 'pi_mock_refund',
              recipientName: context.recipientName,
              backendUrl,
            },
            trackingPixelUrl,
          );
          subject = `Refund Processed - Booking #${context.bookingId}`;
          break;

        case 'showtime-changed':
          html = compileShowtimeChangedEmail(
            {
              bookingId: context.bookingId,
              movieTitle: context.movieTitle,
              oldStartTime: new Date(context.oldStartTime),
              newStartTime: new Date(context.newStartTime),
              theatreName: context.theatreName,
              seatNumbers: context.seatNumbers,
              recipientName: context.recipientName,
              backendUrl,
            },
            trackingPixelUrl,
          );
          subject = `Schedule Update: ${context.movieTitle} Showtime Changed`;
          break;

        default:
          throw new Error(`Unsupported email template: ${template}`);
      }

      // 3. Dispatch email using the MailService
      await this.mailService.sendMail(to, subject, html, attachments);

      // 4. Update log to sent
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();

      this.logger.log(
        `[Job ${job.id}] Email [${template}] successfully sent to ${to}`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to dispatch email to ${to}: ${error.message}`,
        error.stack,
      );

      // 5. Update log to failed
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();

      throw error; // Re-throw to trigger BullMQ retry backoff
    }
  }
}
