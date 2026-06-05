import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { DemoVideosService } from './demo-videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Demo Videos')
@Controller()
export class DemoVideosController {
  constructor(private readonly demoVideosService: DemoVideosService) {}

  @Get('screens/:screenId/demo-videos')
  @ApiOperation({ summary: 'List demo videos for a screen (public)' })
  findByScreen(@Param('screenId') screenId: string) {
    return this.demoVideosService.findByScreen(screenId);
  }

  @Post('screens/:screenId/demo-videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload demo video (Owner/Admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'poster', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 500 * 1024 * 1024, // 500 MB max (local storage handles big files)
        },
      },
    ),
  )
  async uploadDemoVideo(
    @Param('screenId') screenId: string,
    @Body('title') title: string,
    @UploadedFiles()
    files: {
      poster?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ) {
    return this.demoVideosService.create(
      screenId,
      title || 'Demo Video',
      files.poster?.[0] as Express.Multer.File,
      files.video?.[0] as Express.Multer.File,
    );
  }

  @Delete('demo-videos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete demo video (Owner/Admin)' })
  async deleteDemoVideo(@Param('id') id: string) {
    await this.demoVideosService.delete(id);
    return { message: 'Demo video deleted' };
  }
}
