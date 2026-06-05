import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TheatreDesignService } from './theatre-design.service';
import { CreateTemplateDto, CreateLayoutDto, UpdateLayoutDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Theatre Design')
@Controller('theatre-design')
export class TheatreDesignController {
  constructor(private readonly designService: TheatreDesignService) {}

  // ─── Templates (mostly public) ────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'List all theatre templates (public)' })
  findAllTemplates() {
    return this.designService.findAllTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID (public)' })
  findTemplate(@Param('id') id: string) {
    return this.designService.findTemplateById(id);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create theatre template (Admin)' })
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.designService.createTemplate(dto);
  }

  // ─── Layouts ──────────────────────────────────────────────────────────────

  @Post('layouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create layout (Owner/Admin)' })
  createLayout(@Body() dto: CreateLayoutDto, @CurrentUser() user: any) {
    return this.designService.createLayout(dto, user._id.toString(), user.role);
  }

  @Get('layouts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get layout by ID (Owner/Moderator)' })
  findLayout(@Param('id') id: string) {
    return this.designService.findLayoutById(id);
  }

  @Patch('layouts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update layout (Owner/Admin)' })
  updateLayout(
    @Param('id') id: string,
    @Body() dto: UpdateLayoutDto,
    @CurrentUser() user: any,
  ) {
    return this.designService.updateLayout(
      id,
      dto,
      user._id.toString(),
      user.role,
    );
  }

  @Delete('layouts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete layout (Owner/Admin)' })
  deleteLayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.designService.deleteLayout(id, user._id.toString(), user.role);
  }

  @Post('layouts/:id/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 3D data + coordinates (Owner/Admin)' })
  generate3D(@Param('id') id: string, @CurrentUser() user: any) {
    return this.designService.generate3D(id, user._id.toString(), user.role);
  }

  @Get('layouts/:id/coordinates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coordinates for layout (Owner/Moderator)' })
  getCoordinates(@Param('id') id: string) {
    return this.designService.getCoordinates(id);
  }

  @Get('layouts/:id/3d-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 3D scene data (Owner/Moderator)' })
  get3DData(@Param('id') id: string) {
    return this.designService.get3DData(id);
  }

  @Post('layouts/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish layout (Owner/Admin)' })
  publishLayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.designService.publishLayout(id, user._id.toString(), user.role);
  }

  @Get('theatres/:theatreId/layouts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List layouts for a theatre (Owner/Moderator)' })
  findLayoutsByTheatre(@Param('theatreId') theatreId: string) {
    return this.designService.findLayoutsByTheatre(theatreId);
  }

  // ─── Public 3D Viewer ────────────────────────────────────────────────────

  @Get('public/layouts/:id/3d-data')
  @ApiOperation({ summary: 'Get published 3D data (public)' })
  getPublic3DData(@Param('id') id: string) {
    return this.designService.getPublic3DData(id);
  }

  @Get('public/screens/:screenId/layout')
  @ApiOperation({ summary: 'Get published layout for a screen (public)' })
  getPublicLayoutByScreen(@Param('screenId') screenId: string) {
    return this.designService.findPublishedLayoutByScreen(screenId);
  }
}
