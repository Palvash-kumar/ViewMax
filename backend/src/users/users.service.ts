import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UpdateRoleDto } from './dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import * as argon2 from 'argon2';
import { QueueService } from '../queue/queue.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly queueService: QueueService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { password, ...rest } = createUserDto;
    const passwordHash = await argon2.hash(password);
    const user = new this.userModel({ ...rest, passwordHash });
    return user.save();
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<UserDocument>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+passwordHash +refreshToken')
      .exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;
    user.role = updateRoleDto.role;
    const savedUser = await user.save();

    // 1. Enqueue in-app notification
    await this.queueService.enqueueNotification(
      NotificationType.SYSTEM_ALERT,
      id,
      {
        title: 'Account Role Updated 🛡️',
        message: `Your account role has been updated from ${oldRole} to ${updateRoleDto.role}.`,
        metadata: { oldRole, newRole: updateRoleDto.role },
      },
    );

    // 2. Enqueue email notification
    await this.queueService.enqueueEmail(
      'user-account-activity',
      savedUser.email,
      {
        activityType: 'ROLE_CHANGED',
        recipientName: `${savedUser.firstName} ${savedUser.lastName}`,
        email: savedUser.email,
        newRole: updateRoleDto.role,
        subject: 'ViewMax Account - Role Updated',
      },
    );

    return savedUser;
  }

  async updateBlockStatus(
    id: string,
    isBlocked: boolean,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    user.isBlocked = isBlocked;
    const savedUser = await user.save();

    if (isBlocked) {
      // 1. Enqueue in-app notification
      await this.queueService.enqueueNotification(
        NotificationType.SYSTEM_ALERT,
        id,
        {
          title: 'Account Blocked 🚫',
          message: 'Your account has been blocked by an administrator.',
          metadata: { isBlocked },
        },
      );

      // 2. Enqueue email notification
      await this.queueService.enqueueEmail(
        'user-account-activity',
        savedUser.email,
        {
          activityType: 'BLOCKED',
          recipientName: `${savedUser.firstName} ${savedUser.lastName}`,
          email: savedUser.email,
          reason: 'Violation of platform terms or administrative action',
          subject: 'Your ViewMax Account Has Been Blocked',
        },
      );
    } else {
      // 1. Enqueue in-app notification
      await this.queueService.enqueueNotification(
        NotificationType.SYSTEM_ALERT,
        id,
        {
          title: 'Account Restored ✅',
          message: 'Your account has been restored. You can now log in.',
          metadata: { isBlocked },
        },
      );

      // 2. Enqueue email notification
      await this.queueService.enqueueEmail(
        'user-account-activity',
        savedUser.email,
        {
          activityType: 'RESTORED',
          recipientName: `${savedUser.firstName} ${savedUser.lastName}`,
          email: savedUser.email,
          subject: 'Your ViewMax Account Has Been Restored',
        },
      );
    }

    return savedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    // 1. Enqueue email notification prior to deletion
    await this.queueService.enqueueEmail(
      'user-account-activity',
      user.email,
      {
        activityType: 'REMOVED',
        recipientName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        subject: 'Your ViewMax Account Has Been Removed',
      },
    );

    // 2. Perform deletion
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('User not found');
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedToken = refreshToken ? await argon2.hash(refreshToken) : null;
    await this.userModel.findByIdAndUpdate(id, {
      refreshToken: hashedToken,
    });
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    const hashedToken = await argon2.hash(token);
    await this.userModel.findByIdAndUpdate(id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    });
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await argon2.hash(newPassword);
    await this.userModel.findByIdAndUpdate(id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async setEmailVerificationToken(id: string, token: string): Promise<void> {
    const hashedToken = await argon2.hash(token);
    await this.userModel.findByIdAndUpdate(id, {
      emailVerificationToken: hashedToken,
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      isVerified: true,
      emailVerificationToken: null,
    });
  }

  async findByIdWithTokens(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .select(
        '+refreshToken +passwordResetToken +emailVerificationToken +passwordHash',
      )
      .exec();
  }

  async createGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<UserDocument> {
    const user = new this.userModel({
      ...profile,
      provider: 'google',
      isVerified: true,
    });
    return user.save();
  }
}
