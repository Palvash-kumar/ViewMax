import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TheatresController } from './theatres.controller';
import { TheatresService } from './theatres.service';
import { Theatre, TheatreSchema } from './schemas/theatre.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Theatre.name, schema: TheatreSchema }]),
    UsersModule,
  ],
  controllers: [TheatresController],
  providers: [TheatresService],
  exports: [TheatresService],
})
export class TheatresModule {}
