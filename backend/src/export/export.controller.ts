import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('bookings/csv')
  @ApiOperation({ summary: 'Export all bookings as CSV' })
  @ApiQuery({ name: 'status', required: false })
  async exportBookingsCsv(
    @Res() res: Response,
    @Query('status') status?: string,
  ) {
    const buffer = await this.exportService.exportBookingsToCsv({ status });
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="viewmax-bookings-${Date.now()}.csv"`,
    });
    res.end(buffer);
  }

  @Get('bookings/excel')
  @ApiOperation({ summary: 'Export all bookings as Excel' })
  @ApiQuery({ name: 'status', required: false })
  async exportBookingsExcel(
    @Res() res: Response,
    @Query('status') status?: string,
  ) {
    const buffer = await this.exportService.exportBookingsToExcel({ status });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="viewmax-bookings-${Date.now()}.xlsx"`,
    });
    res.end(buffer);
  }

  @Get('users/csv')
  @ApiOperation({ summary: 'Export all users as CSV' })
  async exportUsersCsv(@Res() res: Response) {
    const buffer = await this.exportService.exportUsersToCsv();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="viewmax-users-${Date.now()}.csv"`,
    });
    res.end(buffer);
  }

  @Get('audit-logs/csv')
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportAuditLogsCsv(
    @Res() res: Response,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.exportService.exportAuditLogsToCsv({ action, startDate, endDate });
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="viewmax-audit-${Date.now()}.csv"`,
    });
    res.end(buffer);
  }
}
