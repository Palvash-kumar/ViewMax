import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Movie, MovieSchema } from '../movies/schemas/movie.schema';
import { Showtime, ShowtimeSchema } from '../showtimes/schemas/showtime.schema';
import { Theatre, TheatreSchema } from '../theatres/schemas/theatre.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Movie.name, schema: MovieSchema },
      { name: Showtime.name, schema: ShowtimeSchema },
      { name: Theatre.name, schema: TheatreSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
