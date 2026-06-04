import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue over time' })
  @ApiQuery({ name: 'days', required: false })
  async getRevenue(@Query('days') days = 30) {
    return this.analyticsService.getRevenueOverTime(+days);
  }

  @Get('movies')
  @ApiOperation({ summary: 'Get top movies by revenue' })
  @ApiQuery({ name: 'limit', required: false })
  async getMovieAnalytics(@Query('limit') limit = 10) {
    return this.analyticsService.getMovieAnalytics(+limit);
  }

  @Get('bookings/distribution')
  @ApiOperation({ summary: 'Get booking status distribution' })
  async getBookingDistribution() {
    return this.analyticsService.getBookingStatusDistribution();
  }

  @Get('bookings/hourly')
  @ApiOperation({ summary: 'Get hourly booking pattern' })
  async getHourlyDistribution() {
    return this.analyticsService.getHourlyDistribution();
  }

  @Get('theatres/top')
  @ApiOperation({ summary: 'Get top theatres by revenue' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopTheatres(@Query('limit') limit = 5) {
    return this.analyticsService.getTopTheatres(+limit);
  }
}
