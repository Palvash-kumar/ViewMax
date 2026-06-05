import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { BookingStatus } from '../common/constants/booking-status.enum';
import { QrEngineService } from './qr-engine.service';
import { AntiFraudService } from './anti-fraud.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

/**
 * Core service for the ViewMax ticket lifecycle.
 *
 * Handles three primary operations:
 *  - verifyTicket: Non-destructive QR validation (kiosk / app preview)
 *  - checkIn:      Atomic, staff-gated check-in with replay prevention
 *  - transferTicket: Ownership handoff between registered users
 *
 * All mutating operations are audited and protected by the AntiFraudService.
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly qrEngineService: QrEngineService,
    private readonly antiFraudService: AntiFraudService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Verify a ticket QR token without consuming it.
   *
   * Performs:
   *  1. Fraud guard — rate-limits per booking + IP
   *  2. Cryptographic token verification (HMAC-SHA256)
   *  3. Token-to-booking binding assertion
   *  4. Audit counter increment (lastVerifiedAt / verificationAttempts)
   *
   * @param bookingId  MongoDB ObjectId string
   * @param token      Full verification token from the QR code
   * @param ipAddress  Originating request IP for anti-fraud tracking
   * @returns Ticket status, booking summary, and enriched showtime/user data
   * @throws BadRequestException on fraud limit or invalid token
   * @throws ForbiddenException if token does not belong to the booking
   * @throws NotFoundException if booking does not exist
   */
  async verifyTicket(
    bookingId: string,
    token: string,
    ipAddress?: string,
  ): Promise<{
    valid: boolean;
    status: BookingStatus;
    booking: Record<string, unknown>;
  }> {
    // 1. Anti-fraud rate limit
    const allowed = await this.antiFraudService.trackVerificationAttempt(
      bookingId,
      ipAddress,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Too many verification attempts. Please contact support.',
      );
    }

    // 2. Load booking with populated relations
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title poster genre duration' },
          { path: 'screenId', select: 'name screenType' },
          { path: 'theatreId', select: 'name city' },
        ],
      })
      .populate('userId', 'firstName lastName email avatar')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 3. Cryptographic verification
    const result = await this.qrEngineService.verifyToken(token);

    if (!result.valid) {
      void this.auditService.log(bookingId, 'TICKET_VERIFY_FAILED', 'Booking', {
        reason: result.reason,
        ipAddress,
      });
      throw new BadRequestException(
        `Ticket verification failed: ${result.reason}`,
      );
    }

    // 4. Assert token-to-booking binding
    if (result.payload?.bookingId !== bookingId) {
      throw new ForbiddenException(
        'Token does not match the requested booking',
      );
    }

    // 5. Update audit counters (non-blocking)
    void this.bookingModel.findByIdAndUpdate(bookingId, {
      $set: { lastVerifiedAt: new Date() },
      $inc: { verificationAttempts: 1 },
    });

    return {
      valid: true,
      status: booking.bookingStatus,
      booking: {
        id: booking._id,
        status: booking.bookingStatus,
        seats: booking.seatNumbers,
        totalAmount: booking.totalAmount,
        checkedInAt: booking.checkedInAt,
        showtime: booking.showtimeId,
        user: booking.userId,
      },
    };
  }

  /**
   * Check in a ticket, transitioning its status to CHECKED_IN.
   *
   * Only staff roles (ADMIN, THEATRE_OWNER, THEATRE_MODERATOR) may call this.
   * Enforces:
   *  - QR cryptographic validity
   *  - Booking must be CONFIRMED (not already checked in, expired, etc.)
   *  - Atomic Redis guard prevents race conditions across staff devices
   *  - Nonce invalidation after success (one-time use QR)
   *
   * @param bookingId  MongoDB ObjectId string
   * @param token      Verification token from scanned QR
   * @param staffId    Authenticated staff member's user ID
   * @param ipAddress  Originating IP for anti-fraud tracking
   * @returns Success flag, message, and timestamp
   * @throws BadRequestException if booking is not in CONFIRMED state
   */
  async checkIn(
    bookingId: string,
    token: string,
    staffId: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string; checkedInAt?: Date }> {
    // 1. Verify QR first (includes fraud guard)
    await this.verifyTicket(bookingId, token, ipAddress);

    // 2. Re-fetch booking without population for mutation
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException('Booking not found');

    // 3. Guard idempotency — already checked in
    if (booking.bookingStatus === BookingStatus.CHECKED_IN) {
      return {
        success: false,
        message: 'Ticket has already been checked in',
        checkedInAt: booking.checkedInAt,
      };
    }

    // 4. Ensure booking is in a check-in-able state
    if (booking.bookingStatus !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot check in a ticket with status: ${booking.bookingStatus}`,
      );
    }

    // 5. Atomic Redis lock — prevents simultaneous check-in from two devices
    const claimed = await this.antiFraudService.markCheckedIn(
      bookingId,
      staffId,
    );
    if (!claimed) {
      return {
        success: false,
        message: 'Ticket is being processed by another device — please retry',
      };
    }

    const checkedInAt = new Date();

    // 6. Persist state change
    await this.bookingModel.findByIdAndUpdate(bookingId, {
      bookingStatus: BookingStatus.CHECKED_IN,
      checkedInAt,
      checkedInBy: staffId,
    });

    // 7. Invalidate nonce (one-time QR consumption)
    const tokenResult = await this.qrEngineService.verifyToken(token);
    if (tokenResult.payload?.nonce) {
      await this.qrEngineService.invalidateNonce(tokenResult.payload.nonce);
    }

    // 8. Audit log
    void this.auditService.log(staffId, 'TICKET_CHECKED_IN', 'Booking', {
      bookingId,
      seats: booking.seatNumbers,
    });

    this.logger.log(`Booking ${bookingId} checked in by staff ${staffId}`);

    return {
      success: true,
      message: 'Ticket checked in successfully',
      checkedInAt,
    };
  }

  /**
   * Transfer ticket ownership to another registered user.
   *
   * Rules:
   *  - Only the current ticket owner can initiate a transfer
   *  - Booking must be CONFIRMED (not yet checked in or expired)
   *  - Recipient must be a registered ViewMax user
   *  - Self-transfer is disallowed
   *
   * After transfer the booking status becomes TRANSFERRED and userId is updated
   * to the recipient. The original owner retains the transferredTo reference.
   *
   * @param bookingId      The booking to transfer
   * @param fromUserId     Authenticated user initiating the transfer
   * @param recipientEmail Email address of the new ticket owner
   * @returns Confirmation message with recipient name
   * @throws ForbiddenException if caller is not the booking owner
   * @throws BadRequestException if booking is not transferable or self-transfer attempted
   * @throws NotFoundException if booking or recipient not found
   */
  async transferTicket(
    bookingId: string,
    fromUserId: string,
    recipientEmail: string,
  ): Promise<{ message: string; recipientEmail: string }> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException('Booking not found');

    // Ownership check
    if (booking.userId.toString() !== fromUserId) {
      throw new ForbiddenException('You can only transfer your own bookings');
    }

    // Status check
    if (booking.bookingStatus !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only CONFIRMED bookings can be transferred. Current status: ${booking.bookingStatus}`,
      );
    }

    // Resolve recipient
    const recipient = await this.usersService.findByEmail(recipientEmail);
    if (!recipient) {
      throw new NotFoundException(
        `No ViewMax account found for email: ${recipientEmail}`,
      );
    }

    // Self-transfer guard
    if (recipient._id.toString() === fromUserId) {
      throw new BadRequestException('You cannot transfer a ticket to yourself');
    }

    // Persist transfer
    await this.bookingModel.findByIdAndUpdate(bookingId, {
      userId: recipient._id,
      transferredTo: recipient._id,
      bookingStatus: BookingStatus.TRANSFERRED,
    });

    void this.auditService.log(fromUserId, 'TICKET_TRANSFERRED', 'Booking', {
      bookingId,
      recipientEmail,
      recipientId: recipient._id.toString(),
    });

    this.logger.log(
      `Booking ${bookingId} transferred from ${fromUserId} to ${recipient._id}`,
    );

    return {
      message: `Ticket successfully transferred to ${recipient.firstName} ${recipient.lastName}`,
      recipientEmail,
    };
  }

  /**
   * Paginated list of all bookings for admin dashboards.
   * Supports optional status filter and full relation population.
   *
   * @param page    1-based page number
   * @param limit   Items per page (max 100)
   * @param status  Optional BookingStatus filter string
   */
  async getAllBookingsForAdmin(page = 1, limit = 20, status?: string) {
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, unknown> = {};
    if (status) filter.bookingStatus = status;

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('userId', 'firstName lastName email avatar')
        .populate({
          path: 'showtimeId',
          populate: [
            { path: 'movieId', select: 'title posterUrl' },
            { path: 'theatreId', select: 'name city' },
            { path: 'screenId', select: 'name screenType' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
