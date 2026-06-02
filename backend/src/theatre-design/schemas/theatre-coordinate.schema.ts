import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TheatreCoordinateDocument = TheatreCoordinate & Document;

@Schema({ timestamps: true, collection: 'theatre_coordinates' })
export class TheatreCoordinate {
  @Prop({ type: Types.ObjectId, ref: 'TheatreLayout', required: true })
  layoutId: Types.ObjectId;

  @Prop({ required: true })
  seatId: string;

  @Prop({ required: true })
  row: string;

  @Prop({ required: true })
  seatNumber: number;

  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  z: number;

  @Prop({ default: 0 })
  rotation: number;
}

export const TheatreCoordinateSchema =
  SchemaFactory.createForClass(TheatreCoordinate);

TheatreCoordinateSchema.index({ layoutId: 1 });
TheatreCoordinateSchema.index({ layoutId: 1, seatId: 1 }, { unique: true });
