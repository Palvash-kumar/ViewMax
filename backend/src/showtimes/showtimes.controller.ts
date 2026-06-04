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
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto, UpdateShowtimeDto, QueryShowtimeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get()
  @ApiOperation({ summary: 'List showtimes (public)' })
  findAll(@Query() query: QueryShowtimeDto) {
    return this.showtimesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get showtime by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.showtimesService.findById(id);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'Get seat availability (public)' })
  getSeatAvailability(@Param('id') id: string) {
    return this.showtimesService.getSeatAvailability(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.THEATRE_OWNER,
    Role.THEATRE_MODERATOR,
    Role.ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create showtime (Owner/Moderator)' })
  create(@Body() dto: CreateShowtimeDto) {
    return this.showtimesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.THEATRE_OWNER,
    Role.THEATRE_MODERATOR,
    Role.ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update showtime (Owner/Moderator)' })
  update(@Param('id') id: string, @Body() dto: UpdateShowtimeDto) {
    return this.showtimesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.THEATRE_OWNER,
    Role.THEATRE_MODERATOR,
    Role.ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete showtime (Owner/Moderator)' })
  remove(@Param('id') id: string) {
    return this.showtimesService.delete(id);
  }
}
