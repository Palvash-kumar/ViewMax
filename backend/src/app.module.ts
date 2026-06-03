import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { MongoSanitizeMiddleware } from './middleware/mongo-sanitize.middleware';

// Feature modules
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { TheatresModule } from './theatres/theatres.module';
import { ScreensModule } from './screens/screens.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { TheatreDesignModule } from './theatre-design/theatre-design.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CinemaIntelligenceModule } from './cinema-intelligence/cinema-intelligence.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Infrastructure
    RedisModule,
    CloudinaryModule,
    AuditModule,

    // Feature modules
    AuthModule,
    UsersModule,
    MoviesModule,
    TheatresModule,
    ScreensModule,
    ShowtimesModule,
    BookingsModule,
    PaymentsModule,
    TheatreDesignModule,
    CinemaIntelligenceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MongoSanitizeMiddleware).forRoutes('*');
  }
}
