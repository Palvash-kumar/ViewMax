import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Showtime, ShowtimeDocument } from './schemas/showtime.schema';
import { CreateShowtimeDto, UpdateShowtimeDto, QueryShowtimeDto } from './dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { RedisService } from '../redis/redis.service';
import { ScreensService } from '../screens/screens.service';
import {
  TheatreLayout,
  TheatreLayoutDocument,
} from '../theatre-design/schemas/theatre-layout.schema';
import { LayoutStatus } from '../common/constants/layout-status.enum';
import { ShowtimeStatus } from '../common/constants/showtime-status.enum';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { BookingStatus } from '../common/constants/booking-status.enum';
import { QueueService } from '../queue/queue.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { Logger } from '@nestjs/common';

@Injectable()
export class ShowtimesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShowtimesService.name);
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private cleanupTimeoutId: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Showtime.name)
    private showtimeModel: Model<ShowtimeDocument>,
    @InjectModel(TheatreLayout.name)
    private layoutModel: Model<TheatreLayoutDocument>,
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    private redisService: RedisService,
    private screensService: ScreensService,
    private queueService: QueueService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing ViewMax Showtime Completed CleanUp Scheduler...');
    // Run cleanup every 60 seconds (1 minute) in background
    this.cleanupIntervalId = setInterval(
      () => {
        void this.deleteCompletedShowtimes();
      },
      60 * 1000,
    );
    // Run first check after 5 seconds of server startup
    this.cleanupTimeoutId = setTimeout(() => {
      void this.deleteCompletedShowtimes();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
    }
  }

  async deleteCompletedShowtimes(): Promise<void> {
    try {
      const now = new Date();
      // Find showtimes whose endTime is in the past
      const completedShowtimes = await this.showtimeModel
        .find({ endTime: { $lte: now } })
        .populate('movieId')
        .populate('theatreId')
        .populate('screenId')
        .exec();

      if (completedShowtimes.length > 0) {
        this.logger.log(`Found ${completedShowtimes.length} completed showtimes to archive details and delete`);

        // Backup details in bookings associated with these showtimes
        for (const showtime of completedShowtimes) {
          const bookings = await this.bookingModel.find({ showtimeId: showtime._id }).exec();
          for (const booking of bookings) {
            if (!booking.completedShowtimeDetails) {
              booking.completedShowtimeDetails = {
                movieTitle: (showtime.movieId as any)?.title || '',
                moviePoster: (showtime.movieId as any)?.poster || '',
                movieDuration: (showtime.movieId as any)?.duration || 0,
                theatreName: (showtime.theatreId as any)?.name || '',
                theatreCity: (showtime.theatreId as any)?.city || '',
                theatreAddress: (showtime.theatreId as any)?.address || '',
                screenName: (showtime.screenId as any)?.name || '',
                screenType: (showtime.screenId as any)?.screenType || '',
                startTime: showtime.startTime,
                endTime: showtime.endTime,
                ticketPrice: showtime.ticketPrice,
              };
              await booking.save();
            }
          }
        }

        const ids = completedShowtimes.map((s) => s._id);
        const result = await this.showtimeModel.deleteMany({ _id: { $in: ids } }).exec();
        this.logger.log(`Successfully deleted ${result.deletedCount} completed showtimes`);
      }
    } catch (error) {
      this.logger.error(`Error deleting completed showtimes: ${error.message}`, error.stack);
    }
  }

  async create(
    dto: CreateShowtimeDto,
  ): Promise<ShowtimeDocument | ShowtimeDocument[]> {
    // Validate screen exists
    await this.screensService.findById(dto.screenId);

    const showtimesToCreate: any[] = [];
    const bufferMs = 10 * 60 * 1000;

    if (dto.isRecurring && dto.recurringEndDate) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      const recurringEnd = new Date(dto.recurringEndDate);

      const durationMs = end.getTime() - start.getTime();
      const currentStart = new Date(start);

      while (currentStart <= recurringEnd) {
        const currentEnd = new Date(currentStart.getTime() + durationMs);

        // Check overlap for this specific day (including 10-minute buffer)
        const checkStart = new Date(currentStart.getTime() - bufferMs);
        const checkEnd = new Date(currentEnd.getTime() + bufferMs);

        const overlap = await this.showtimeModel.findOne({
          screenId: dto.screenId,
          status: ShowtimeStatus.SCHEDULED,
          startTime: { $lt: checkEnd },
          endTime: { $gt: checkStart },
        });

        if (overlap) {
          const dateStr = currentStart.toLocaleDateString('en-IN', {
            dateStyle: 'medium',
          });
          throw new BadRequestException(
            `Conflict detected on ${dateStr}: Screen is already scheduled/unavailable during this time (including 10-minute buffer).`,
          );
        }

        showtimesToCreate.push({
          movieId: new Types.ObjectId(dto.movieId),
          theatreId: new Types.ObjectId(dto.theatreId),
          screenId: new Types.ObjectId(dto.screenId),
          startTime: new Date(currentStart),
          endTime: new Date(currentEnd),
          ticketPrice: dto.ticketPrice,
          status: ShowtimeStatus.SCHEDULED,
          bookedSeats: [],
        });

        // Advance to next day
        currentStart.setDate(currentStart.getDate() + 1);
      }
    } else {
      // Single showtime logic
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      const checkStart = new Date(start.getTime() - bufferMs);
      const checkEnd = new Date(end.getTime() + bufferMs);

      const overlap = await this.showtimeModel.findOne({
        screenId: dto.screenId,
        status: ShowtimeStatus.SCHEDULED,
        startTime: { $lt: checkEnd },
        endTime: { $gt: checkStart },
      });

      if (overlap) {
        throw new BadRequestException(
          'This screen already has a show scheduled during this time (including 10-minute buffer)',
        );
      }

      showtimesToCreate.push({
        movieId: new Types.ObjectId(dto.movieId),
        theatreId: new Types.ObjectId(dto.theatreId),
        screenId: new Types.ObjectId(dto.screenId),
        startTime: start,
        endTime: end,
        ticketPrice: dto.ticketPrice,
        status: ShowtimeStatus.SCHEDULED,
        bookedSeats: [],
      });
    }

    if (showtimesToCreate.length === 0) {
      throw new BadRequestException(
        'No showtimes generated. Check your start date and recurring end date.',
      );
    }

    const createdDocs = await this.showtimeModel.insertMany(showtimesToCreate);
    const populated = await this.showtimeModel.populate(createdDocs, [
      { path: 'movieId', select: 'title poster duration' },
      { path: 'theatreId', select: 'name city' },
      { path: 'screenId', select: 'name screenType' },
    ]);

    return dto.isRecurring ? populated : populated[0];
  }

  async findAll(
    query: QueryShowtimeDto,
  ): Promise<PaginatedResult<ShowtimeDocument>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      movieId,
      theatreId,
      date,
      status,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (movieId) filter.movieId = movieId;
    if (theatreId) filter.theatreId = theatreId;
    if (status) filter.status = status;
    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.startTime = { $gte: dayStart, $lt: dayEnd };
    }

    const [data, total] = await Promise.all([
      this.showtimeModel
        .find(filter)
        .populate('movieId', 'title poster duration genres')
        .populate('theatreId', 'name city')
        .populate('screenId', 'name screenType capacity')
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.showtimeModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<ShowtimeDocument> {
    const showtime = await this.showtimeModel
      .findById(id)
      .populate('movieId', 'title poster duration genres language')
      .populate('theatreId', 'name city address')
      .populate('screenId')
      .exec();
    if (!showtime) throw new NotFoundException('Showtime not found');
    return showtime;
  }

  async update(id: string, dto: UpdateShowtimeDto): Promise<ShowtimeDocument> {
    const originalShowtime = await this.showtimeModel.findById(id);
    if (!originalShowtime) throw new NotFoundException('Showtime not found');
    const oldStartTime = originalShowtime.startTime;

    // If updating startTime or endTime, validate the overlap
    if (dto.startTime || dto.endTime) {
      const startTime = dto.startTime
        ? new Date(dto.startTime)
        : originalShowtime.startTime;
      const endTime = dto.endTime
        ? new Date(dto.endTime)
        : originalShowtime.endTime;
      const screenId = originalShowtime.screenId.toString();

      const bufferMs = 10 * 60 * 1000;
      const checkStart = new Date(startTime.getTime() - bufferMs);
      const checkEnd = new Date(endTime.getTime() + bufferMs);

      const overlap = await this.showtimeModel.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        screenId: new Types.ObjectId(screenId),
        status: ShowtimeStatus.SCHEDULED,
        startTime: { $lt: checkEnd },
        endTime: { $gt: checkStart },
      });

      if (overlap) {
        throw new BadRequestException(
          'This screen already has a show scheduled during this time (including 10-minute buffer)',
        );
      }
    }

    const showtime = await this.showtimeModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('movieId', 'title')
      .populate('theatreId', 'name')
      .exec();

    if (!showtime) throw new NotFoundException('Showtime not found');

    // If startTime has changed, notify all users with confirmed bookings
    if (
      dto.startTime &&
      new Date(dto.startTime).getTime() !== new Date(oldStartTime).getTime()
    ) {
      try {
        const bookings = await this.bookingModel
          .find({
            showtimeId: id,
            bookingStatus: BookingStatus.CONFIRMED,
          })
          .populate('userId')
          .exec();

        const movie = showtime.movieId as any;
        const theatre = showtime.theatreId as any;

        for (const booking of bookings) {
          const user = booking.userId as any;
          if (!user) continue;

          // Clear sentReminders and update expiresAt so they will receive reminders based on the new time
          booking.sentReminders = [];
          booking.expiresAt = showtime.startTime;
          await booking.save();

          // Enqueue Showtime Changed Email
          await this.queueService.enqueueEmail(
            'showtime-changed',
            user.email,
            {
              bookingId: booking._id.toString(),
              movieTitle: movie.title,
              oldStartTime,
              newStartTime: showtime.startTime,
              theatreName: theatre.name,
              seatNumbers: booking.seatNumbers,
              recipientName: `${user.firstName} ${user.lastName}`,
            },
            booking._id.toString(),
          );

          // Enqueue In-App Notification
          await this.queueService.enqueueNotification(
            NotificationType.SYSTEM_ALERT,
            user._id.toString(),
            {
              title: 'Showtime Rescheduled ⏰',
              message: `Your show for "${movie.title}" has been rescheduled to ${showtime.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${showtime.startTime.toLocaleDateString()}.`,
            },
          );
        }
        this.logger.log(
          `Notified ${bookings.length} confirmed users about showtime rescheduled for showtime ${id}`,
        );
      } catch (err) {
        this.logger.error(
          `Error notifying users of showtime change: ${err.message}`,
          err.stack,
        );
      }
    }

    return showtime;
  }

  async delete(id: string): Promise<void> {
    const result = await this.showtimeModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Showtime not found');
  }

  /**
   * Get seat availability for a showtime.
   * Combines permanently booked seats with temporarily locked seats from Redis.
   */
  async getSeatAvailability(showtimeId: string) {
    const showtime = await this.findById(showtimeId);
    const screenIdRaw = showtime.screenId as any;
    const screenIdStr = screenIdRaw?._id?.toString() ?? screenIdRaw.toString();
    const screen = await this.screensService.findById(screenIdStr);

    const bookedSeats = new Set(showtime.bookedSeats);

    // Try to find the most recent published layout for this screen to build custom categories
    let seatMap = screen.seatMap;
    const layout = await this.layoutModel
      .findOne({
        screenId: new Types.ObjectId(screenIdStr),
        status: LayoutStatus.PUBLISHED,
      })
      .sort({ publishedAt: -1 })
      .exec();

    if (layout && layout.seatMap && layout.seatMap.length > 0) {
      // Group layout's flat seatMap by row label
      const seatsByRow = new Map<string, any[]>();
      for (const seat of layout.seatMap) {
        let rowSeats = seatsByRow.get(seat.row);
        if (!rowSeats) {
          rowSeats = [];
          seatsByRow.set(seat.row, rowSeats);
        }
        rowSeats.push(seat);
      }

      // Sort rows by order
      const sortedRows = [...layout.rows].sort((a, b) => a.order - b.order);

      const seatMap2D: any[][] = [];
      for (const rowConfig of sortedRows) {
        const rowLabel = rowConfig.label;
        const seatsInRow = seatsByRow.get(rowLabel) || [];
        const sortedSeats = [...seatsInRow].sort(
          (a, b) => a.seatNumber - b.seatNumber,
        );

        const rowSeats = sortedSeats.map((seat) => {
          let type = seat.category;
          if (seat.status === 'BLOCKED' || seat.status === 'REMOVED') {
            type = 'BLOCKED';
          }
          return {
            seatNumber: seat.id,
            row: seat.row,
            column: seat.seatNumber,
            type,
          };
        });

        if (rowSeats.length > 0) {
          seatMap2D.push(rowSeats);
        }
      }

      if (seatMap2D.length > 0) {
        seatMap = seatMap2D;
      }
    }

    // Build availability map
    const availability: any[][] = [];

    for (const row of seatMap) {
      const rowAvailability: any[] = [];
      for (const seat of row) {
        const isBooked = bookedSeats.has(seat.seatNumber);
        const lockedBy = await this.redisService.getSeatLock(
          showtimeId,
          seat.seatNumber,
        );
        const isLocked = !!lockedBy;

        rowAvailability.push({
          seatNumber: seat.seatNumber,
          row: seat.row,
          column: seat.column,
          type: seat.type,
          isBooked,
          isLocked,
          isAvailable: !isBooked && !isLocked && seat.type !== 'BLOCKED',
        });
      }
      availability.push(rowAvailability);
    }

    return {
      showtimeId,
      screenName: screen.name,
      screenType: screen.screenType,
      rows: seatMap.length,
      columns:
        seatMap.length > 0
          ? Math.max(
              ...seatMap.flatMap((r) => r).map((s) => Number(s.column) || 0),
            )
          : screen.columns,
      ticketPrice: showtime.ticketPrice,
      seatAvailability: availability,
    };
  }

  async addBookedSeats(showtimeId: string, seats: string[]): Promise<void> {
    await this.showtimeModel.findByIdAndUpdate(showtimeId, {
      $addToSet: { bookedSeats: { $each: seats } },
    });
  }

  async removeBookedSeats(showtimeId: string, seats: string[]): Promise<void> {
    await this.showtimeModel.findByIdAndUpdate(showtimeId, {
      $pullAll: { bookedSeats: seats },
    });
  }
}
