import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Movie, MovieSchema } from '../movies/schemas/movie.schema';
import { ShowtimesModule } from '../showtimes/showtimes.module';
import { PaymentsModule } from '../payments/payments.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Movie.name, schema: MovieSchema },
    ]),
    ShowtimesModule,
    forwardRef(() => PaymentsModule),
    QueueModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
