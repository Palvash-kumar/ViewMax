import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { EmailLog, EmailLogSchema } from './schemas/email-log.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { QueueModule } from '../queue/queue.module';
import { RemindersSchedulerService } from './reminders-scheduler.service';

/**
 * NotificationsModule
 *
 * Self-contained module providing:
 *  - MongoDB persistence for Notification documents
 *  - REST endpoints via NotificationsController
 *  - NotificationsService exported for use by QueueModule, PaymentsModule, etc.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: EmailLog.name, schema: EmailLogSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    forwardRef(() => QueueModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, RemindersSchedulerService],
  exports: [NotificationsService, MongooseModule],
})
export class NotificationsModule {}
