import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/constants/roles.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ select: false })
  passwordHash: string;

  @Prop({ type: String, enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Prop()
  avatar: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 'local', enum: ['local', 'google'] })
  provider: string;

  @Prop({ select: false })
  refreshToken: string;

  @Prop({ select: false })
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  @Prop({ select: false })
  emailVerificationToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ role: 1 });
