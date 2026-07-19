import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, AdminBookingHistoryQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create booking (lock seats + create checkout)' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(
      user._id.toString(),
      dto.showtimeId,
      dto.seatNumbers,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own booking history' })
  findAll(
    @CurrentUser('_id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.findByUser(userId, page || 1, limit || 10);
  }

  @Get('admin/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings history (Admin only)' })
  findAllAdmin(@Query() query: AdminBookingHistoryQueryDto) {
    return this.bookingsService.findAllAdmin(query);
  }

  // FIX #4: Pass userId for ownership check — prevents IDOR
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking details' })
  findOne(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.bookingsService.findById(id, userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel booking' })
  cancel(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.bookingsService.cancelBooking(id, userId);
  }

  @Patch(':id/reminders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update reminder preferences' })
  updateReminders(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body()
    dto: {
      remindersEnabled: boolean;
      reminderTiming?: '24h' | '6h' | '2h' | '30m';
    },
  ) {
    return this.bookingsService.updateReminderSettings(id, userId, dto);
  }

  // FIX #5: Was completely unauthenticated — anyone could download calendar files for any booking
  @Get(':id/calendar/ics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download ICS calendar file for the show' })
  async downloadIcs(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Res() res: any,
  ) {
    const icsContent = await this.bookingsService.generateBookingIcs(id, userId);
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=viewmax-booking-${id}.ics`,
    );
    return res.send(icsContent);
  }
}
