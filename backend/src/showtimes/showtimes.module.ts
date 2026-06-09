import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesService } from './showtimes.service';
import { Showtime, ShowtimeSchema } from './schemas/showtime.schema';
import { ScreensModule } from '../screens/screens.module';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { QueueModule } from '../queue/queue.module';
import {
  TheatreLayout,
  TheatreLayoutSchema,
} from '../theatre-design/schemas/theatre-layout.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Showtime.name, schema: ShowtimeSchema },
      { name: TheatreLayout.name, schema: TheatreLayoutSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    ScreensModule,
    QueueModule,
  ],
  controllers: [ShowtimesController],
  providers: [ShowtimesService],
  exports: [ShowtimesService],
})
export class ShowtimesModule {}
