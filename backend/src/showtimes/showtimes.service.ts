import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Showtime, ShowtimeDocument } from './schemas/showtime.schema';
import { CreateShowtimeDto, UpdateShowtimeDto, QueryShowtimeDto } from './dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { RedisService } from '../redis/redis.service';
import { ScreensService } from '../screens/screens.service';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectModel(Showtime.name)
    private showtimeModel: Model<ShowtimeDocument>,
    private redisService: RedisService,
    private screensService: ScreensService,
  ) {}

  async create(dto: CreateShowtimeDto): Promise<ShowtimeDocument> {
    // Validate screen exists
    await this.screensService.findById(dto.screenId);

    // Check for overlapping showtimes on the same screen
    const overlap = await this.showtimeModel.findOne({
      screenId: dto.screenId,
      status: 'SCHEDULED',
      $or: [
        {
          startTime: { $lt: new Date(dto.endTime) },
          endTime: { $gt: new Date(dto.startTime) },
        },
      ],
    } as any);

    if (overlap) {
      throw new BadRequestException(
        'This screen already has a show scheduled during this time',
      );
    }

    const showtime = new this.showtimeModel(dto);
    return (await showtime.save()).populate([
      { path: 'movieId', select: 'title poster duration' },
      { path: 'theatreId', select: 'name city' },
      { path: 'screenId', select: 'name screenType' },
    ]);
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
    const showtime = await this.showtimeModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!showtime) throw new NotFoundException('Showtime not found');
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
    // screenId is populated by findById, so extract the _id from the populated object
    const screenIdRaw = showtime.screenId as any;
    const screenIdStr = screenIdRaw?._id?.toString() ?? screenIdRaw.toString();
    const screen = await this.screensService.findById(screenIdStr);

    const seatMap = screen.seatMap;
    const bookedSeats = new Set(showtime.bookedSeats);

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
      rows: screen.rows,
      columns: screen.columns,
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
