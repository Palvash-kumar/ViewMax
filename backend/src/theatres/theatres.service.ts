import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Theatre, TheatreDocument } from './schemas/theatre.schema';
import { Screen, ScreenDocument } from '../screens/schemas/screen.schema';
import {
  TheatreLayout,
  TheatreLayoutDocument,
} from '../theatre-design/schemas/theatre-layout.schema';
import {
  TheatreCoordinate,
  TheatreCoordinateDocument,
} from '../theatre-design/schemas/theatre-coordinate.schema';
import {
  CreateTheatreDto,
  UpdateTheatreDto,
  UpdateTheatreStatusDto,
  QueryTheatreDto,
} from './dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { Role } from '../common/constants/roles.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class TheatresService {
  constructor(
    @InjectModel(Theatre.name) private theatreModel: Model<TheatreDocument>,
    @InjectModel(Screen.name) private screenModel: Model<ScreenDocument>,
    @InjectModel(TheatreLayout.name)
    private layoutModel: Model<TheatreLayoutDocument>,
    @InjectModel(TheatreCoordinate.name)
    private coordinateModel: Model<TheatreCoordinateDocument>,
    private usersService: UsersService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateTheatreDto,
  ): Promise<TheatreDocument> {
    const theatre = new this.theatreModel({
      ...dto,
      ownerId: new Types.ObjectId(ownerId),
    });
    return theatre.save();
  }

  async findAll(
    query: QueryTheatreDto,
  ): Promise<PaginatedResult<TheatreDocument>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      city,
      status,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      this.theatreModel
        .find(filter)
        .populate('ownerId', 'firstName lastName email')
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.theatreModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<TheatreDocument> {
    const theatre = await this.theatreModel
      .findById(id)
      .populate('ownerId', 'firstName lastName email')
      .populate('moderators', 'firstName lastName email')
      .exec();
    if (!theatre) throw new NotFoundException('Theatre not found');
    return theatre;
  }

  async findByOwner(ownerId: string): Promise<TheatreDocument[]> {
    return this.theatreModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateTheatreDto,
    userId: string,
    userRole: Role,
  ): Promise<TheatreDocument> {
    const theatre = await this.findById(id);
    this.checkOwnershipOrAdmin(theatre, userId, userRole);

    const updated = await this.theatreModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    return updated!;
  }

  async delete(id: string, userId: string, userRole: Role): Promise<void> {
    const theatre = await this.findById(id);
    this.checkOwnershipOrAdmin(theatre, userId, userRole);

    // Delete all coordinates for layouts of this theatre
    const layouts = await this.layoutModel
      .find({ theatreId: new Types.ObjectId(id) })
      .select('_id')
      .exec();
    const layoutIds = layouts.map((l) => l._id);
    if (layoutIds.length > 0) {
      await this.coordinateModel
        .deleteMany({ layoutId: { $in: layoutIds } })
        .exec();
    }
    // Delete all layouts for this theatre
    await this.layoutModel
      .deleteMany({ theatreId: new Types.ObjectId(id) })
      .exec();
    // Delete all screens for this theatre
    await this.screenModel
      .deleteMany({ theatreId: new Types.ObjectId(id) })
      .exec();
    // Delete the theatre itself
    const result = await this.theatreModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Theatre not found');
  }

  async updateStatus(
    id: string,
    dto: UpdateTheatreStatusDto,
  ): Promise<TheatreDocument> {
    const theatre = await this.theatreModel
      .findByIdAndUpdate(id, { status: dto.status }, { new: true })
      .exec();
    if (!theatre) throw new NotFoundException('Theatre not found');
    return theatre;
  }

  async addModerator(
    theatreId: string,
    userId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<TheatreDocument> {
    const theatre = await this.findById(theatreId);
    this.checkOwnershipOrAdmin(theatre, requesterId, requesterRole);

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (theatre.moderators.some((m) => m.toString() === userId)) {
      throw new BadRequestException('User is already a moderator');
    }

    // Update user role to THEATRE_MODERATOR
    await this.usersService.updateRole(userId, {
      role: Role.THEATRE_MODERATOR,
    });

    const updated = await this.theatreModel
      .findByIdAndUpdate(
        theatreId,
        { $addToSet: { moderators: new Types.ObjectId(userId) } },
        { new: true },
      )
      .populate('moderators', 'firstName lastName email')
      .exec();

    return updated!;
  }

  async removeModerator(
    theatreId: string,
    userId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<TheatreDocument> {
    const theatre = await this.findById(theatreId);
    this.checkOwnershipOrAdmin(theatre, requesterId, requesterRole);

    const updated = await this.theatreModel
      .findByIdAndUpdate(
        theatreId,
        { $pull: { moderators: new Types.ObjectId(userId) } },
        { new: true },
      )
      .populate('moderators', 'firstName lastName email')
      .exec();

    // Reset user role back to customer
    await this.usersService.updateRole(userId, { role: Role.CUSTOMER });

    return updated!;
  }

  // Check if user is a moderator of the theatre
  async isModeratorOf(theatreId: string, userId: string): Promise<boolean> {
    const theatre = await this.theatreModel.findById(theatreId).exec();
    if (!theatre) return false;
    return (
      theatre.ownerId.toString() === userId ||
      theatre.moderators.some((m) => m.toString() === userId)
    );
  }

  private checkOwnershipOrAdmin(
    theatre: TheatreDocument,
    userId: string,
    userRole: Role,
  ) {
    if (userRole === Role.ADMIN) return;

    const ownerIdStr = (theatre.ownerId as any)?._id
      ? (theatre.ownerId as any)._id.toString()
      : (theatre.ownerId as any)?.toString();

    if (ownerIdStr !== userId) {
      throw new ForbiddenException('You do not own this theatre');
    }
  }
}
