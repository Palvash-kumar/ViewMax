import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import {
  SecurityEvent,
  SecurityEventSchema,
} from './schemas/security-event.schema';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SecurityEvent.name, schema: SecurityEventSchema },
    ]),
    RedisModule,
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
