import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { QueueService } from '../queue/queue.service';
import { BookingStatus } from '../common/constants/booking-status.enum';
import { NotificationType } from './schemas/notification.schema';

@Injectable()
export class RemindersSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RemindersSchedulerService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing ViewMax Showtime Reminders Scheduler...');
    // Run reminders check every 5 minutes in background
    this.intervalId = setInterval(
      () => {
        void this.checkAndSendReminders();
      },
      5 * 60 * 1000,
    );
    // Run first check after 10 seconds of server startup
    this.timeoutId = setTimeout(() => {
      void this.checkAndSendReminders();
    }, 10000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  async checkAndSendReminders() {
    this.logger.debug('Running scheduled reminders scan...');
    try {
      const now = new Date();
      // Find confirmed bookings with reminders enabled
      const bookings = await this.bookingModel
        .find({
          bookingStatus: BookingStatus.CONFIRMED,
          remindersEnabled: true,
        })
        .populate('userId')
        .populate({
          path: 'showtimeId',
          populate: [
            { path: 'movieId', select: 'title' },
            { path: 'theatreId', select: 'name address' },
            { path: 'screenId', select: 'name screenType' },
          ],
        })
        .exec();

      // Filter upcoming bookings locally where show has not started yet
      const upcomingBookings = bookings.filter((b) => {
        const showtime = b.showtimeId as any;
        return (
          showtime && showtime.startTime && new Date(showtime.startTime) > now
        );
      });

      this.logger.debug(
        `Found ${upcomingBookings.length} confirmed upcoming bookings to evaluate`,
      );

      for (const booking of upcomingBookings) {
        const showtime = booking.showtimeId as any;
        const timing = booking.reminderTiming || '2h';

        // Check if reminder for this timing has already been dispatched
        if (booking.sentReminders.includes(timing)) {
          continue;
        }

        // Map timing configuration to target timing window in minutes
        let targetMinutes = 120; // default 2 hours
        let countdownText = 'in 2 hours';

        switch (timing) {
          case '24h':
            targetMinutes = 1440;
            countdownText = 'tomorrow';
            break;
          case '6h':
            targetMinutes = 360;
            countdownText = 'in 6 hours';
            break;
          case '2h':
            targetMinutes = 120;
            countdownText = 'in 2 hours';
            break;
          case '30m':
            targetMinutes = 30;
            countdownText = 'in 30 minutes';
            break;
        }

        const showtimeStart = new Date(showtime.startTime);
        const diffMs = showtimeStart.getTime() - now.getTime();
        const diffMinutes = diffMs / (60 * 1000);

        // If current time is within the timing threshold, trigger the reminder
        if (diffMinutes <= targetMinutes && diffMinutes > 0) {
          this.logger.log(
            `Triggering ${timing} reminder for booking ${booking._id}. Showtime in ${Math.round(diffMinutes)} mins.`,
          );

          const user = booking.userId as any;
          const movie = showtime.movieId;
          const theatre = showtime.theatreId;
          const screen = showtime.screenId;

          // Record sent status first to prevent race condition double-sends
          await this.bookingModel.updateOne(
            { _id: booking._id },
            { $addToSet: { sentReminders: timing } },
          );

          // Dispatch to email delivery queue
          if (
            booking.reminderChannels.includes('EMAIL') &&
            user &&
            user.email
          ) {
            await this.queueService.enqueueEmail(
              'reminder-notification',
              user.email,
              {
                bookingId: booking._id.toString(),
                movieTitle: movie.title,
                theatreName: theatre.name,
                theatreAddress: theatre.address,
                screenName: screen.name,
                screenType: screen.screenType,
                startTime: showtimeStart,
                seatNumbers: booking.seatNumbers,
                qrCode: booking.qrCode,
                countdownText,
                recipientName: `${user.firstName} ${user.lastName}`,
              },
              booking._id.toString(),
            );
          }

          // Dispatch in-app notification
          if (booking.reminderChannels.includes('IN_APP') && user) {
            const showtimeTimeStr = showtimeStart.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            await this.queueService.enqueueNotification(
              NotificationType.SHOW_REMINDER,
              user._id.toString(),
              {
                bookingId: booking._id.toString(),
                movieTitle: movie.title,
                showtime: showtimeTimeStr,
                theatreName: theatre.name,
              },
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in reminders scheduler check: ${error.message}`,
        error.stack,
      );
    }
  }
}
