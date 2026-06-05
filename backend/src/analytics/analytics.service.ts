import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { BookingStatus } from '../common/constants/booking-status.enum';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Movie') private movieModel: Model<any>,
    @InjectModel('Showtime') private showtimeModel: Model<any>,
    @InjectModel('Theatre') private theatreModel: Model<any>,
  ) {}

  async getPlatformStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers7d,
      totalBookings,
      confirmedBookings,
      revenueData,
      cancelledBookings,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel
        .countDocuments({ createdAt: { $gte: sevenDaysAgo } })
        .exec(),
      this.bookingModel.countDocuments().exec(),
      this.bookingModel
        .countDocuments({
          bookingStatus: {
            $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
          },
        })
        .exec(),
      this.bookingModel
        .aggregate([
          {
            $match: {
              bookingStatus: {
                $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.bookingModel
        .countDocuments({ bookingStatus: BookingStatus.CANCELLED })
        .exec(),
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    return {
      users: { total: totalUsers, newLast7Days: newUsers7d },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
      },
      revenue: { total: totalRevenue, currency: 'INR' },
      generatedAt: now,
    };
  }

  async getRevenueOverTime(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await this.bookingModel
      .aggregate([
        {
          $match: {
            bookingStatus: {
              $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
            },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ])
      .exec();

    return data.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
      revenue: d.revenue,
      bookings: d.bookings,
    }));
  }

  async getMovieAnalytics(limit = 10) {
    return this.bookingModel
      .aggregate([
        {
          $match: {
            bookingStatus: {
              $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
            },
          },
        },
        {
          $lookup: {
            from: 'showtimes',
            localField: 'showtimeId',
            foreignField: '_id',
            as: 'showtime',
          },
        },
        { $unwind: '$showtime' },
        {
          $lookup: {
            from: 'movies',
            localField: 'showtime.movieId',
            foreignField: '_id',
            as: 'movie',
          },
        },
        { $unwind: '$movie' },
        {
          $group: {
            _id: '$movie._id',
            title: { $first: '$movie.title' },
            poster: { $first: '$movie.poster' },
            totalRevenue: { $sum: '$totalAmount' },
            totalBookings: { $sum: 1 },
            totalSeats: { $sum: { $size: '$seatNumbers' } },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
      ])
      .exec();
  }

  async getBookingStatusDistribution() {
    return this.bookingModel
      .aggregate([
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .exec();
  }

  async getHourlyDistribution() {
    return this.bookingModel
      .aggregate([
        {
          $match: {
            bookingStatus: {
              $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
            },
          },
        },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }

  async getTopTheatres(limit = 5) {
    return this.bookingModel
      .aggregate([
        {
          $match: {
            bookingStatus: {
              $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
            },
          },
        },
        {
          $lookup: {
            from: 'showtimes',
            localField: 'showtimeId',
            foreignField: '_id',
            as: 'showtime',
          },
        },
        { $unwind: '$showtime' },
        {
          $lookup: {
            from: 'theatres',
            localField: 'showtime.theatreId',
            foreignField: '_id',
            as: 'theatre',
          },
        },
        { $unwind: '$theatre' },
        {
          $group: {
            _id: '$theatre._id',
            name: { $first: '$theatre.name' },
            city: { $first: '$theatre.city' },
            totalRevenue: { $sum: '$totalAmount' },
            totalBookings: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
      ])
      .exec();
  }
}
