import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { QrEngineService } from './qr-engine.service';
import { AntiFraudService } from './anti-fraud.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';

/**
 * TicketsModule encapsulates the complete ViewMax ticket lifecycle:
 *
 *  Services exported for cross-module use:
 *   - TicketsService   — verify / check-in / transfer operations
 *   - QrEngineService  — QR generation and cryptographic verification
 *
 *  Dependencies:
 *   - Booking model  (from BookingsModule schema, registered locally)
 *   - AuditModule    — fire-and-forget audit log
 *   - UsersModule    — recipient lookup for transfers
 *   - RedisModule    — nonce store + rate limiting
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    AuditModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService, QrEngineService, AntiFraudService],
  exports: [TicketsService, QrEngineService],
})
export class TicketsModule {}
