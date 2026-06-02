import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { CreateMovieDto, UpdateMovieDto, QueryMovieDto } from './dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private redisService: RedisService,
  ) {}

  async create(dto: CreateMovieDto): Promise<MovieDocument> {
    const movie = new this.movieModel(dto);
    const saved = await movie.save();
    await this.redisService.del('movies:cache');
    return saved;
  }

  async findAll(query: QueryMovieDto): Promise<PaginatedResult<MovieDocument>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      status,
      genre,
      language,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (status) {
      filter.status = status;
    }
    if (genre) {
      filter.genres = { $in: [genre] };
    }
    if (language) {
      filter.language = language;
    }

    const [data, total] = await Promise.all([
      this.movieModel
        .find(filter)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.movieModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<MovieDocument> {
    // Check cache
    const cached = await this.redisService.getJson<MovieDocument>(
      `movie:${id}`,
    );
    if (cached) return cached;

    const movie = await this.movieModel.findById(id).exec();
    if (!movie) throw new NotFoundException('Movie not found');

    // Cache for 5 minutes
    await this.redisService.setJson(`movie:${id}`, movie, 300);

    return movie;
  }

  async update(id: string, dto: UpdateMovieDto): Promise<MovieDocument> {
    const movie = await this.movieModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!movie) throw new NotFoundException('Movie not found');

    await this.redisService.del(`movie:${id}`);
    await this.redisService.del('movies:cache');

    return movie;
  }

  async delete(id: string): Promise<void> {
    const result = await this.movieModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Movie not found');

    await this.redisService.del(`movie:${id}`);
    await this.redisService.del('movies:cache');
  }

  async getNowShowing(): Promise<MovieDocument[]> {
    const cached =
      await this.redisService.getJson<MovieDocument[]>('movies:now_showing');
    if (cached) return cached;

    const movies = await this.movieModel
      .find({ status: 'NOW_SHOWING' } as any)
      .sort({ releaseDate: -1 })
      .limit(20)
      .exec();

    await this.redisService.setJson('movies:now_showing', movies, 300);

    return movies;
  }
}
