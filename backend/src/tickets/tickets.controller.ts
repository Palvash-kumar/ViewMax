import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { TicketsService } from './tickets.service';
import {
  VerifyTicketDto,
  CheckInTicketDto,
  TransferTicketDto,
} from './dto/verify-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

/**
 * REST controller for the ViewMax ticket lifecycle.
 *
 * Public routes (no auth required):
 *   POST /tickets/verify        — validate a QR code
 *
 * Authenticated routes:
 *   POST /tickets/check-in      — staff check-in (ADMIN / THEATRE_OWNER / THEATRE_MODERATOR)
 *   POST /tickets/:id/transfer  — customer ticket transfer
 *   GET  /tickets/admin/all     — admin booking list
 */
@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Public
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Verify a ticket QR token.
   * Does NOT require authentication — designed for kiosk / gate-scanner use.
   * Anti-fraud rate limiting is applied per booking ID.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a ticket QR code (public)',
    description:
      'Validates the cryptographic token and returns ticket status. Does not consume the ticket.',
  })
  @ApiResponse({ status: 200, description: 'Ticket verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyTicket(@Body() dto: VerifyTicketDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
      req.ip ??
      'unknown';
    return this.ticketsService.verifyTicket(dto.bookingId, dto.token, ip);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Staff
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check in a ticket (theatre staff only).
   * Atomically transitions the booking to CHECKED_IN and invalidates the QR nonce.
   */
  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.THEATRE_OWNER, Role.THEATRE_MODERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check in a ticket (staff only)',
    description:
      'Marks a CONFIRMED booking as CHECKED_IN. Invalidates the QR nonce to prevent reuse.',
  })
  @ApiResponse({ status: 200, description: 'Check-in result' })
  @ApiResponse({ status: 400, description: 'Booking not in CONFIRMED state or fraud detected' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async checkIn(@Body() dto: CheckInTicketDto, @Req() req: Request & { user: { sub: string } }) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
      req.ip ??
      'unknown';
    return this.ticketsService.checkIn(dto.bookingId, dto.token, req.user.sub, ip);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Customer
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Transfer ticket ownership to another registered user.
   * Only the current ticket owner may call this endpoint.
   */
  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transfer a ticket to another user',
    description:
      'Transfers a CONFIRMED booking to any registered ViewMax user by email.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID to transfer' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Invalid transfer (wrong status, self-transfer, etc.)' })
  @ApiResponse({ status: 403, description: 'Not the ticket owner' })
  @ApiResponse({ status: 404, description: 'Booking or recipient not found' })
  async transferTicket(
    @Param('id') id: string,
    @Body() dto: TransferTicketDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.ticketsService.transferTicket(id, req.user.sub, dto.recipientEmail);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Retrieve all bookings with full population (admin dashboard).
   * Supports optional status filtering and pagination.
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all bookings (admin)',
    description: 'Returns a paginated list of all bookings with enriched showtime and user data.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by BookingStatus value' })
  @ApiResponse({ status: 200, description: 'Paginated booking list' })
  async getAllBookings(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.ticketsService.getAllBookingsForAdmin(page, limit, status);
  }
}
