import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TheatreDesignController } from './theatre-design.controller';
import { TheatreDesignService } from './theatre-design.service';
import {
  TheatreTemplate,
  TheatreTemplateSchema,
} from './schemas/theatre-template.schema';
import {
  TheatreLayout,
  TheatreLayoutSchema,
} from './schemas/theatre-layout.schema';
import {
  TheatreCoordinate,
  TheatreCoordinateSchema,
} from './schemas/theatre-coordinate.schema';
import { TheatresModule } from '../theatres/theatres.module';
import { ScreensModule } from '../screens/screens.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TheatreTemplate.name, schema: TheatreTemplateSchema },
      { name: TheatreLayout.name, schema: TheatreLayoutSchema },
      { name: TheatreCoordinate.name, schema: TheatreCoordinateSchema },
    ]),
    TheatresModule,
    ScreensModule,
  ],
  controllers: [TheatreDesignController],
  providers: [TheatreDesignService],
  exports: [TheatreDesignService],
})
export class TheatreDesignModule {}
