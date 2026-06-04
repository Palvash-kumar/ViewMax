import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { MongoSanitizeMiddleware } from './middleware/mongo-sanitize.middleware';

// Infrastructure modules
import { RedisModule } from './redis/redis.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AuditModule } from './audit/audit.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';

// Feature modules (Phase 1-3)
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { TheatresModule } from './theatres/theatres.module';
import { ScreensModule } from './screens/screens.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { TheatreDesignModule } from './theatre-design/theatre-design.module';
import { CinemaIntelligenceModule } from './cinema-intelligence/cinema-intelligence.module';

// Phase 4 modules
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SecurityModule } from './security/security.module';
import { SearchModule } from './search/search.module';
import { ExportModule } from './export/export.module';

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
        connectionFactory: (connection: any) => {
          // MongoDB Atlas optimizations
          connection.set('maxPoolSize', 10);
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting — tiered limits
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),

    // Infrastructure
    RedisModule,
    CloudinaryModule,
    AuditModule,
    QueueModule,
    HealthModule,

    // Feature modules (Phase 1-3)
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

    // Phase 4 modules
    TicketsModule,
    NotificationsModule,
    AnalyticsModule,
    SecurityModule,
    SearchModule,
    ExportModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MongoSanitizeMiddleware).forRoutes('*');
  }
}
