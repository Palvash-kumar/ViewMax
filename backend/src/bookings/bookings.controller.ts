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
import { CreateBookingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking (lock seats + create checkout)' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(
      user._id.toString(),
      dto.showtimeId,
      dto.seatNumbers,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get own booking history' })
  findAll(
    @CurrentUser('_id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.findByUser(userId, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  cancel(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.bookingsService.cancelBooking(id, userId);
  }

  @Patch(':id/reminders')
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

  @Get(':id/calendar/ics')
  @ApiOperation({ summary: 'Download ICS calendar file for the show' })
  async downloadIcs(@Param('id') id: string, @Res() res: any) {
    const icsContent = await this.bookingsService.generateBookingIcs(id);
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=viewmax-booking-${id}.ics`,
    );
    return res.send(icsContent);
  }
}
