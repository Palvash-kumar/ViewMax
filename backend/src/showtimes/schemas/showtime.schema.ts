import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShowtimeStatus } from '../../common/constants/showtime-status.enum';

export type ShowtimeDocument = Showtime & Document;

@Schema({ timestamps: true })
export class Showtime {
  @Prop({ type: Types.ObjectId, ref: 'Movie', required: true })
  movieId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Theatre', required: true })
  theatreId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Screen', required: true })
  screenId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  ticketPrice: number;

  @Prop({
    type: String,
    enum: ShowtimeStatus,
    default: ShowtimeStatus.SCHEDULED,
  })
  status: ShowtimeStatus;

  @Prop({ type: [String], default: [] })
  bookedSeats: string[];
}

export const ShowtimeSchema = SchemaFactory.createForClass(Showtime);

ShowtimeSchema.index({ movieId: 1 });
ShowtimeSchema.index({ theatreId: 1 });
ShowtimeSchema.index({ screenId: 1 });
ShowtimeSchema.index({ startTime: 1 });
ShowtimeSchema.index({ screenId: 1, startTime: 1, endTime: 1 });
