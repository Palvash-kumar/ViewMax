import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketExpirationProcessor } from './processors/ticket-expiration.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { QueueService } from './queue.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { QUEUE_NAMES } from './queue.constants';

/**
 * QueueModule
 *
 * Configures BullMQ with the application's Redis instance and registers:
 *  - Four named queues (ticket-expiration, email, notification, analytics)
 *  - Two WorkerHost processors (TicketExpirationProcessor, NotificationProcessor)
 *  - QueueService façade (exported for use by other modules)
 *
 * The Booking model is registered here (in addition to BookingsModule) so
 * TicketExpirationProcessor can perform direct DB writes without a circular
 * dependency on BookingsService.
 */
@Module({
  imports: [
    // BullMQ global configuration derived from the redis.* config namespace
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
          // Lazily connect so startup doesn't fail if Redis is momentarily unavailable
          lazyConnect: false,
          maxRetriesPerRequest: null, // required by BullMQ
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2_000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Register all queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.TICKET_EXPIRATION },
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.ANALYTICS },
    ),

    // Booking schema registered directly to avoid circular dependency
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),

    // NotificationsModule provides NotificationsService to NotificationProcessor
    NotificationsModule,
  ],
  providers: [TicketExpirationProcessor, NotificationProcessor, QueueService],
  exports: [
    QueueService,
    // Export BullModule so modules that inject specific queues via @InjectQueue
    // do not need to re-import BullModule themselves
    BullModule,
  ],
})
export class QueueModule {}
