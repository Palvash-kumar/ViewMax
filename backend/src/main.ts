import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditService } from './audit/audit.service';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  // ── Compression ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Cookie parser ─────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ).split(',');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Preflight cache: 24 hours
  });

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global filters & interceptors ─────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Audit interceptor (needs DI context)
  const auditService = app.get(AuditService);
  app.useGlobalInterceptors(new AuditInterceptor(auditService));

  // ── Static file serving (local demo videos) ──────────────────────────────
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ── API prefix ────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Swagger (disabled in production) ─────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ViewMax API v4')
      .setDescription(
        'Enterprise Cinema Platform — Full Phase 4 Production API',
      )
      .setVersion('4.0.0')
      .addBearerAuth()
      // Phase 1-3
      .addTag('Auth')
      .addTag('Users')
      .addTag('Movies')
      .addTag('Theatres')
      .addTag('Screens')
      .addTag('Showtimes')
      .addTag('Bookings')
      .addTag('Payments')
      .addTag('Theatre Design')
      .addTag('Cinema Intelligence')
      // Phase 4
      .addTag('Tickets')
      .addTag('Notifications')
      .addTag('Analytics')
      .addTag('Security')
      .addTag('Search')
      .addTag('Export')
      .addTag('Health')
      .addTag('Audit Logs')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🎬 ViewMax API v4.0 running on http://localhost:${port}/api`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check at http://localhost:${port}/api/health`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start ViewMax API:', err);
  process.exit(1);
});
