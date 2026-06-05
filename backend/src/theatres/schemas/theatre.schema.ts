import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { TheatreStatus } from '../../common/constants/theatre-status.enum';

export type TheatreDocument = Theatre & Document;

@Schema({ timestamps: true })
export class Theatre {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ type: String, enum: TheatreStatus, default: TheatreStatus.PENDING })
  status: TheatreStatus;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  moderators: Types.ObjectId[];
}

export const TheatreSchema = SchemaFactory.createForClass(Theatre);

TheatreSchema.index({ ownerId: 1 });
TheatreSchema.index({ city: 1 });
TheatreSchema.index({ status: 1 });
TheatreSchema.index({ name: 'text', city: 'text' });
