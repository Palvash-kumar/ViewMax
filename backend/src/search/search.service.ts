import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Movie') private movieModel: Model<any>,
    @InjectModel('Theatre') private theatreModel: Model<any>,
  ) {}

  async globalSearch(query: string, type?: string, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { results: {}, query };
    }

    const q = query.trim();
    const regex = new RegExp(q, 'i');
    const results: Record<string, any[]> = {};
    const searches: Promise<void>[] = [];

    if (!type || type === 'movies') {
      searches.push(
        this.movieModel
          .find({
            $or: [{ title: regex }, { genres: regex }, { language: regex }],
          })
          .select('title poster genres releaseDate language status')
          .limit(limit)
          .exec()
          .then((r) => {
            results.movies = r;
          }),
      );
    }

    if (!type || type === 'theatres') {
      searches.push(
        this.theatreModel
          .find({ $or: [{ name: regex }, { city: regex }, { address: regex }] })
          .select('name city address status')
          .limit(limit)
          .exec()
          .then((r) => {
            results.theatres = r;
          }),
      );
    }

    if (!type || type === 'users') {
      searches.push(
        this.userModel
          .find({
            $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
          })
          .select('firstName lastName email role avatar isVerified')
          .limit(limit)
          .exec()
          .then((r) => {
            results.users = r;
          }),
      );
    }

    await Promise.all(searches);

    return { results, query: q, type };
  }
}
