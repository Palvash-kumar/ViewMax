import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TheatresController } from './theatres.controller';
import { TheatresService } from './theatres.service';
import { Theatre, TheatreSchema } from './schemas/theatre.schema';
import { Screen, ScreenSchema } from '../screens/schemas/screen.schema';
import {
  TheatreLayout,
  TheatreLayoutSchema,
} from '../theatre-design/schemas/theatre-layout.schema';
import {
  TheatreCoordinate,
  TheatreCoordinateSchema,
} from '../theatre-design/schemas/theatre-coordinate.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Theatre.name, schema: TheatreSchema },
      { name: Screen.name, schema: ScreenSchema },
      { name: TheatreLayout.name, schema: TheatreLayoutSchema },
      { name: TheatreCoordinate.name, schema: TheatreCoordinateSchema },
    ]),
    UsersModule,
  ],
  controllers: [TheatresController],
  providers: [TheatresService],
  exports: [TheatresService],
})
export class TheatresModule {}

