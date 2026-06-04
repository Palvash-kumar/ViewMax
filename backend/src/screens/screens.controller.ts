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
import { ScreensService } from './screens.service';
import { CreateScreenDto, UpdateScreenDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Screens')
@Controller()
export class ScreensController {
  constructor(private readonly screensService: ScreensService) {}

  @Get('theatres/:theatreId/screens')
  @ApiOperation({ summary: 'List screens for a theatre (public)' })
  findByTheatre(@Param('theatreId') theatreId: string) {
    return this.screensService.findByTheatre(theatreId);
  }

  @Get('screens/:id')
  @ApiOperation({ summary: 'Get screen by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.screensService.findById(id);
  }

  @Post('theatres/:theatreId/screens')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create screen (Owner/Admin)' })
  create(@Param('theatreId') theatreId: string, @Body() dto: CreateScreenDto) {
    return this.screensService.create(theatreId, dto);
  }

  @Patch('screens/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update screen (Owner/Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateScreenDto) {
    return this.screensService.update(id, dto);
  }

  @Delete('screens/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete screen (Owner/Admin)' })
  remove(@Param('id') id: string) {
    return this.screensService.delete(id);
  }
}
