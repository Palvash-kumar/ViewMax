import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ScreenType } from '../../common/constants/screen-type.enum';

export interface SeatInfo {
  seatNumber: string; // e.g. "A1"
  row: string; // e.g. "A"
  column: number; // e.g. 1
  type: 'STANDARD' | 'PREMIUM' | 'VIP' | 'WHEELCHAIR' | 'BLOCKED';
}

export type ScreenDocument = Screen & Document;

@Schema({ timestamps: true })
export class Screen {
  @Prop({ type: Types.ObjectId, ref: 'Theatre', required: true })
  theatreId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: ScreenType, required: true })
  screenType: ScreenType;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true })
  rows: number;

  @Prop({ required: true })
  columns: number;

  @Prop({ type: [[Object]], default: [] })
  seatMap: SeatInfo[][];
}

export const ScreenSchema = SchemaFactory.createForClass(Screen);

ScreenSchema.index({ theatreId: 1 });
