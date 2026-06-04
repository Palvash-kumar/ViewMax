import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';

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
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
