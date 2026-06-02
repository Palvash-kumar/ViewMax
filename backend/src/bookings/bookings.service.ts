import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { RedisService } from '../redis/redis.service';
import { ShowtimesService } from '../showtimes/showtimes.service';
import { PaymentsService } from '../payments/payments.service';
import { BookingStatus } from '../common/constants/booking-status.enum';
import { PaymentStatus } from '../common/constants/payment-status.enum';
import { PaginatedResult } from '../common/dto/pagination.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private redisService: RedisService,
    private showtimesService: ShowtimesService,
    private paymentsService: PaymentsService,
  ) {}

  async createBooking(
    userId: string,
    showtimeId: string,
    seatNumbers: string[],
  ) {
    // 1. Validate showtime
    const showtime = await this.showtimesService.findById(showtimeId);

    // 2. Check seats are not already booked
    const alreadyBooked = seatNumbers.filter((s) =>
      showtime.bookedSeats.includes(s),
    );
    if (alreadyBooked.length > 0) {
      throw new BadRequestException(
        `Seats already booked: ${alreadyBooked.join(', ')}`,
      );
    }

    // 3. Lock seats in Redis
    const locked = await this.redisService.lockSeats(
      showtimeId,
      seatNumbers,
      userId,
      600, // 10 minutes
    );

    if (!locked) {
      throw new BadRequestException(
        'Some seats are currently held by another user. Please try different seats.',
      );
    }

    // 4. Calculate total
    const totalAmount = seatNumbers.length * showtime.ticketPrice;

    // 5. Create booking draft
    const booking = new this.bookingModel({
      userId,
      showtimeId,
      seatNumbers,
      totalAmount,
      paymentStatus: PaymentStatus.PENDING,
      bookingStatus: BookingStatus.PENDING,
    });
    const savedBooking = await booking.save();

    // 6. Create Stripe checkout session
    const session = await this.paymentsService.createCheckoutSession(
      savedBooking._id.toString(),
      totalAmount,
      seatNumbers,
      showtime,
    );

    // 7. Store stripe session ID on booking
    savedBooking.stripeSessionId = session.id;
    await savedBooking.save();

    return {
      booking: savedBooking,
      checkoutUrl: session.url,
    };
  }

  async confirmBooking(stripeSessionId: string) {
    const booking = await this.bookingModel.findOne({ stripeSessionId }).exec();

    if (!booking) {
      this.logger.error(`No booking found for session: ${stripeSessionId}`);
      return;
    }

    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      return; // Already confirmed (idempotent)
    }

    // 1. Generate QR code
    const qrData = JSON.stringify({
      bookingId: booking._id,
      seats: booking.seatNumbers,
      showtimeId: booking.showtimeId,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // 2. Update booking
    booking.bookingStatus = BookingStatus.CONFIRMED;
    booking.paymentStatus = PaymentStatus.COMPLETED;
    booking.qrCode = qrCode;
    await booking.save();

    // 3. Add seats to showtime's booked list
    await this.showtimesService.addBookedSeats(
      booking.showtimeId.toString(),
      booking.seatNumbers,
    );

    // 4. Release Redis locks
    await this.redisService.unlockSeats(
      booking.showtimeId.toString(),
      booking.seatNumbers,
      booking.userId.toString(),
    );

    this.logger.log(`Booking ${booking._id} confirmed`);
  }

  async handlePaymentFailure(stripeSessionId: string) {
    const booking = await this.bookingModel.findOne({ stripeSessionId }).exec();

    if (!booking) return;

    // Release locks
    await this.redisService.unlockSeats(
      booking.showtimeId.toString(),
      booking.seatNumbers,
      booking.userId.toString(),
    );

    booking.bookingStatus = BookingStatus.EXPIRED;
    booking.paymentStatus = PaymentStatus.FAILED;
    await booking.save();

    this.logger.log(`Booking ${booking._id} expired due to payment failure`);
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.userId.toString() !== userId) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // Remove seats from showtime booked list
    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      await this.showtimesService.removeBookedSeats(
        booking.showtimeId.toString(),
        booking.seatNumbers,
      );
    }

    // Release any Redis locks
    await this.redisService.unlockSeats(
      booking.showtimeId.toString(),
      booking.seatNumbers,
      userId,
    );

    booking.bookingStatus = BookingStatus.CANCELLED;
    await booking.save();

    return booking;
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<BookingDocument>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.bookingModel
        .find({ userId })
        .populate({
          path: 'showtimeId',
          populate: [
            { path: 'movieId', select: 'title poster' },
            { path: 'theatreId', select: 'name city' },
            { path: 'screenId', select: 'name screenType' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments({ userId }).exec(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title poster duration genres' },
          { path: 'theatreId', select: 'name city address' },
          { path: 'screenId', select: 'name screenType' },
        ],
      })
      .exec();
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
