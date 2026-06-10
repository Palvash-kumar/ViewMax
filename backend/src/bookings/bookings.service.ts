import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Movie, MovieDocument } from '../movies/schemas/movie.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RedisService } from '../redis/redis.service';
import { ShowtimesService } from '../showtimes/showtimes.service';
import { PaymentsService } from '../payments/payments.service';
import { BookingStatus } from '../common/constants/booking-status.enum';
import { PaymentStatus } from '../common/constants/payment-status.enum';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { QueueService } from '../queue/queue.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { generateIcsString } from '../common/utils/calendar.utils';
import { QrEngineService } from '../tickets/qr-engine.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private redisService: RedisService,
    private showtimesService: ShowtimesService,
    private paymentsService: PaymentsService,
    private queueService: QueueService,
    private cloudinaryService: CloudinaryService,
    private qrEngineService: QrEngineService,
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
    const booking = await this.bookingModel
      .findOne({ stripeSessionId })
      .populate('userId')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title poster duration' },
          { path: 'theatreId', select: 'name city address' },
          { path: 'screenId', select: 'name screenType' },
        ],
      })
      .exec();

    if (!booking) {
      this.logger.error(`No booking found for session: ${stripeSessionId}`);
      return;
    }

    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      return; // Already confirmed (idempotent)
    }

    const showtimeIdStr =
      (booking.showtimeId as any)._id?.toString() ||
      booking.showtimeId.toString();
    const userIdStr =
      (booking.userId as any)._id?.toString() || booking.userId.toString();

    // 1. Generate QR code using QrEngineService
    const showtime = booking.showtimeId as any;
    const qrResult = await this.qrEngineService.generateTicketQR(
      booking._id.toString(),
      userIdStr,
      showtimeIdStr,
      booking.seatNumbers,
      new Date(booking.expiresAt || showtime.startTime),
    );

    let qrCodeUrl = qrResult.qrCodeDataUrl;
    try {
      const uploadRes = await this.cloudinaryService.uploadBase64(
        qrResult.qrCodeDataUrl,
        `viewmax/qrcodes/${booking._id}`,
      );
      qrCodeUrl = uploadRes.secure_url;
      this.logger.log(`Uploaded QR code to Cloudinary: ${qrCodeUrl}`);
    } catch (err) {
      this.logger.error(
        `Failed to upload QR code to Cloudinary, falling back to base64: ${err.message}`,
      );
    }

    // 2. Update booking
    booking.bookingStatus = BookingStatus.CONFIRMED;
    booking.paymentStatus = PaymentStatus.COMPLETED;
    booking.qrCode = qrCodeUrl;
    booking.ticketSignature = qrResult.ticketSignature;
    booking.verificationToken = qrResult.verificationToken;

    const showtimeObj = booking.showtimeId as any;
    if (showtimeObj) {
      booking.completedShowtimeDetails = {
        movieTitle: showtimeObj.movieId?.title || '',
        moviePoster: showtimeObj.movieId?.poster || '',
        movieDuration: showtimeObj.movieId?.duration || 0,
        theatreName: showtimeObj.theatreId?.name || '',
        theatreCity: showtimeObj.theatreId?.city || '',
        theatreAddress: showtimeObj.theatreId?.address || '',
        screenName: showtimeObj.screenId?.name || '',
        screenType: showtimeObj.screenId?.screenType || '',
        startTime: showtimeObj.startTime,
        endTime: showtimeObj.endTime,
        ticketPrice: showtimeObj.ticketPrice,
      };
    }
    await booking.save();

    // 3. Add seats to showtime's booked list
    await this.showtimesService.addBookedSeats(
      showtimeIdStr,
      booking.seatNumbers,
    );

    // 4. Release Redis locks
    await this.redisService.unlockSeats(
      showtimeIdStr,
      booking.seatNumbers,
      userIdStr,
    );

    this.logger.log(`Booking ${booking._id} confirmed`);

    // 5. Send Transactional Emails and Notifications via Queue
    try {
      const user = booking.userId as any;
      const showtime = booking.showtimeId as any;
      const movie = showtime.movieId;
      const theatre = showtime.theatreId;
      const screen = showtime.screenId;

      // Check if movie poster is base64 and upload to Cloudinary
      let moviePosterUrl = movie?.poster;
      if (movie && movie.poster && movie.poster.startsWith('data:image/')) {
        try {
          const uploadRes = await this.cloudinaryService.uploadBase64(
            movie.poster,
            `viewmax/posters/${movie._id}`,
          );
          moviePosterUrl = uploadRes.secure_url;
          await this.movieModel.updateOne(
            { _id: movie._id },
            { poster: moviePosterUrl },
          );
          movie.poster = moviePosterUrl; // update populated object
          this.logger.log(
            `Uploaded movie poster to Cloudinary and updated movie: ${moviePosterUrl}`,
          );
        } catch (err) {
          this.logger.error(
            `Failed to upload movie poster to Cloudinary: ${err.message}`,
          );
        }
      }

      // Enqueue Booking Confirmation Email
      await this.queueService.enqueueEmail(
        'booking-confirmation',
        user.email,
        {
          bookingId: booking._id.toString(),
          movieTitle: movie.title,
          moviePoster: moviePosterUrl,
          theatreName: theatre.name,
          theatreAddress: theatre.address,
          screenName: screen.name,
          screenType: screen.screenType,
          startTime: showtime.startTime,
          duration: movie.duration,
          seatNumbers: booking.seatNumbers,
          totalPrice: booking.totalAmount,
          paymentStatus: booking.paymentStatus,
          qrCode: qrCodeUrl,
          recipientName: `${user.firstName} ${user.lastName}`,
        },
        booking._id.toString(),
      );

      // Enqueue Payment Receipt Email
      await this.queueService.enqueueEmail(
        'payment-successful',
        user.email,
        {
          bookingId: booking._id.toString(),
          movieTitle: movie.title,
          seatNumbers: booking.seatNumbers,
          totalPrice: booking.totalAmount,
          paymentIntentId:
            booking.stripePaymentIntentId || 'pi_stripe_completed',
          recipientName: `${user.firstName} ${user.lastName}`,
        },
        booking._id.toString(),
      );

      // Enqueue In-App Notifications
      await this.queueService.enqueueNotification(
        NotificationType.BOOKING_CONFIRMED,
        userIdStr,
        { bookingId: booking._id.toString(), movieTitle: movie.title },
      );

      await this.queueService.enqueueNotification(
        NotificationType.PAYMENT_SUCCESS,
        userIdStr,
        { amount: booking.totalAmount, bookingId: booking._id.toString() },
      );

      this.logger.debug(
        `Booking dispatches completed for booking ${booking._id}`,
      );
    } catch (err) {
      this.logger.error(
        `Error enqueuing confirmation flows: ${err.message}`,
        err.stack,
      );
    }
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
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('userId')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title' },
          { path: 'theatreId', select: 'name' },
        ],
      })
      .exec();

    if (!booking) throw new NotFoundException('Booking not found');

    if (!booking.showtimeId) {
      throw new BadRequestException(
        'Cannot cancel booking for a completed showtime.',
      );
    }

    const showtime = booking.showtimeId as any;
    if (showtime.endTime && new Date(showtime.endTime) < new Date()) {
      throw new BadRequestException(
        'Cannot cancel booking for a completed showtime.',
      );
    }

    const showtimeIdStr =
      (booking.showtimeId as any)._id?.toString() ||
      booking.showtimeId.toString();
    const userIdStr =
      (booking.userId as any)._id?.toString() || booking.userId.toString();

    if (userIdStr !== userId) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // Remove seats from showtime booked list
    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      await this.showtimesService.removeBookedSeats(
        showtimeIdStr,
        booking.seatNumbers,
      );
    }

    // Release any Redis locks
    await this.redisService.unlockSeats(
      showtimeIdStr,
      booking.seatNumbers,
      userId,
    );

    booking.bookingStatus = BookingStatus.CANCELLED;
    booking.paymentStatus = PaymentStatus.REFUNDED;
    await booking.save();

    this.logger.log(`Booking ${booking._id} cancelled`);

    // Send Cancellation & Refund Emails and Notifications
    try {
      const user = booking.userId as any;
      const showtime = booking.showtimeId as any;
      const movie = showtime.movieId;

      // Enqueue Ticket Cancelled Email
      await this.queueService.enqueueEmail(
        'ticket-cancelled',
        user.email,
        {
          bookingId: booking._id.toString(),
          movieTitle: movie.title,
          seatNumbers: booking.seatNumbers,
          totalPrice: booking.totalAmount,
          startTime: showtime.startTime,
          recipientName: `${user.firstName} ${user.lastName}`,
        },
        booking._id.toString(),
      );

      // Enqueue Ticket Refunded Email
      await this.queueService.enqueueEmail(
        'ticket-refunded',
        user.email,
        {
          bookingId: booking._id.toString(),
          movieTitle: movie.title,
          refundAmount: booking.totalAmount,
          paymentIntentId:
            booking.stripePaymentIntentId || 'pi_stripe_refunded',
          recipientName: `${user.firstName} ${user.lastName}`,
        },
        booking._id.toString(),
      );

      // Enqueue In-App Notifications
      await this.queueService.enqueueNotification(
        NotificationType.BOOKING_CANCELLED,
        userIdStr,
        { bookingId: booking._id.toString() },
      );

      await this.queueService.enqueueNotification(
        NotificationType.REFUND_PROCESSED,
        userIdStr,
        { bookingId: booking._id.toString(), amount: booking.totalAmount },
      );
    } catch (err) {
      this.logger.error(
        `Error enqueuing cancellation flows: ${err.message}`,
        err.stack,
      );
    }

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

    const mappedData = data.map((b) => {
      const bookingObj = b.toObject ? b.toObject() : b;
      if (!bookingObj.showtimeId && bookingObj.completedShowtimeDetails) {
        bookingObj.showtimeId = {
          _id: null as any,
          startTime: bookingObj.completedShowtimeDetails.startTime,
          endTime: bookingObj.completedShowtimeDetails.endTime,
          ticketPrice: bookingObj.completedShowtimeDetails.ticketPrice,
          movieId: {
            title: bookingObj.completedShowtimeDetails.movieTitle,
            poster: bookingObj.completedShowtimeDetails.moviePoster,
            duration: bookingObj.completedShowtimeDetails.movieDuration,
          },
          theatreId: {
            name: bookingObj.completedShowtimeDetails.theatreName,
            city: bookingObj.completedShowtimeDetails.theatreCity,
            address: bookingObj.completedShowtimeDetails.theatreAddress,
          },
          screenId: {
            name: bookingObj.completedShowtimeDetails.screenName,
            screenType: bookingObj.completedShowtimeDetails.screenType,
          },
        } as any;
      }
      return bookingObj;
    });

    return {
      data: mappedData as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    const bookingObj = booking.toObject ? booking.toObject() : booking;
    if (!bookingObj.showtimeId && bookingObj.completedShowtimeDetails) {
      bookingObj.showtimeId = {
        _id: null as any,
        startTime: bookingObj.completedShowtimeDetails.startTime,
        endTime: bookingObj.completedShowtimeDetails.endTime,
        ticketPrice: bookingObj.completedShowtimeDetails.ticketPrice,
        movieId: {
          title: bookingObj.completedShowtimeDetails.movieTitle,
          poster: bookingObj.completedShowtimeDetails.moviePoster,
          duration: bookingObj.completedShowtimeDetails.movieDuration,
        },
        theatreId: {
          name: bookingObj.completedShowtimeDetails.theatreName,
          city: bookingObj.completedShowtimeDetails.theatreCity,
          address: bookingObj.completedShowtimeDetails.theatreAddress,
        },
        screenId: {
          name: bookingObj.completedShowtimeDetails.screenName,
          screenType: bookingObj.completedShowtimeDetails.screenType,
        },
      } as any;
    }
    return bookingObj as any;
  }

  async updateReminderSettings(
    bookingId: string,
    userId: string,
    dto: {
      remindersEnabled: boolean;
      reminderTiming?: '24h' | '6h' | '2h' | '30m';
    },
  ) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException('Booking not found');

    const userIdStr = booking.userId.toString();
    if (userIdStr !== userId) {
      throw new BadRequestException(
        'You can only update reminders for your own bookings',
      );
    }

    booking.remindersEnabled = dto.remindersEnabled;
    if (dto.reminderTiming) {
      booking.reminderTiming = dto.reminderTiming;
      booking.sentReminders = []; // Reset sent reminders to allow newly chosen window to fire
    }
    await booking.save();
    return booking;
  }

  async generateBookingIcs(bookingId: string): Promise<string> {
    const booking = await this.findById(bookingId);
    const showtime = booking.showtimeId as any;
    if (!showtime) {
      throw new BadRequestException(
        'Cannot generate calendar invite for a completed showtime that has been deleted.',
      );
    }
    const movie = showtime.movieId;
    const theatre = showtime.theatreId;
    const screen = showtime.screenId;

    const endTime = new Date(
      showtime.startTime.getTime() + movie.duration * 60 * 1000,
    );

    const description = `Your premium movie ticket for ${movie.title} is confirmed!\n\nBooking ID: ${booking._id}\nSeats: ${booking.seatNumbers.join(', ')}\nScreen: ${screen.name} (${screen.screenType})\n\nBooked via ViewMax`;

    return generateIcsString({
      title: `${movie.title} - ViewMax Cinema`,
      description,
      location: `${theatre.name}, ${theatre.address}, ${theatre.city}`,
      startTime: showtime.startTime,
      endTime,
      uid: booking._id.toString(),
    });
  }
}
