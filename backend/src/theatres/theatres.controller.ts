import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TheatresService } from './theatres.service';
import {
  CreateTheatreDto,
  UpdateTheatreDto,
  UpdateTheatreStatusDto,
  AddModeratorDto,
  QueryTheatreDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Theatres')
@Controller('theatres')
export class TheatresController {
  constructor(private readonly theatresService: TheatresService) {}

  @Get()
  @ApiOperation({ summary: 'List theatres (public)' })
  findAll(@Query() query: QueryTheatreDto) {
    return this.theatresService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own theatres (Owner)' })
  findMyTheatres(@CurrentUser('_id') userId: string) {
    return this.theatresService.findByOwner(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theatre by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.theatresService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create theatre (Owner/Admin)' })
  create(@CurrentUser() user: any, @Body() dto: CreateTheatreDto) {
    return this.theatresService.create(user._id.toString(), dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update theatre (Owner/Admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTheatreDto,
  ) {
    return this.theatresService.update(id, dto, user._id.toString(), user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete theatre (Owner/Admin)' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.theatresService.delete(id, user._id.toString(), user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve/reject theatre (Admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTheatreStatusDto) {
    return this.theatresService.updateStatus(id, dto);
  }

  @Post(':id/moderators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add moderator to theatre (Owner)' })
  addModerator(
    @Param('id') theatreId: string,
    @CurrentUser() user: any,
    @Body() dto: AddModeratorDto,
  ) {
    return this.theatresService.addModerator(
      theatreId,
      dto.userId,
      user._id.toString(),
      user.role,
    );
  }

  @Delete(':id/moderators/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove moderator from theatre (Owner)' })
  removeModerator(
    @Param('id') theatreId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.theatresService.removeModerator(
      theatreId,
      userId,
      user._id.toString(),
      user.role,
    );
  }
}
