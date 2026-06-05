import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScreensController } from './screens.controller';
import { ScreensService } from './screens.service';
import { Screen, ScreenSchema } from './schemas/screen.schema';
import { DemoVideo, DemoVideoSchema } from './schemas/demo-video.schema';
import { DemoVideosController } from './demo-videos.controller';
import { DemoVideosService } from './demo-videos.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Screen.name, schema: ScreenSchema },
      { name: DemoVideo.name, schema: DemoVideoSchema },
    ]),
  ],
  controllers: [ScreensController, DemoVideosController],
  providers: [ScreensService, DemoVideosService],
  exports: [ScreensService],
})
export class ScreensModule {}

