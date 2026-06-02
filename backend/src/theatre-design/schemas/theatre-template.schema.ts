import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ScreenType } from '../../common/constants/screen-type.enum';

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface AisleConfig {
  leftAisle: boolean;
  rightAisle: boolean;
  centerAisles: number[];
  aisleWidth: number;
}

export type TheatreTemplateDocument = TheatreTemplate & Document;

@Schema({ timestamps: true, collection: 'theatre_templates' })
export class TheatreTemplate {
  @Prop({ required: true, unique: true, trim: true })
  templateName: string;

  @Prop({ type: String, enum: ScreenType, required: true })
  screenType: ScreenType;

  @Prop({ required: true })
  defaultScreenWidth: number;

  @Prop({ required: true })
  defaultScreenHeight: number;

  @Prop({ required: true })
  aspectRatio: string;

  @Prop({ required: true })
  defaultRows: number;

  @Prop({ required: true })
  defaultSeatsPerRow: number;

  @Prop({ type: Object, default: {} })
  aisleConfiguration: AisleConfig;

  @Prop({ required: true, default: 0.6 })
  seatSpacing: number;

  @Prop({ required: true, default: 1.0 })
  rowSpacing: number;

  @Prop({ required: true, default: 12 })
  rakeAngle: number;

  @Prop({ type: [Object], default: [] })
  cameraPresets: CameraPreset[];

  @Prop({ default: '' })
  description: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const TheatreTemplateSchema =
  SchemaFactory.createForClass(TheatreTemplate);

TheatreTemplateSchema.index({ screenType: 1 });
TheatreTemplateSchema.index({ isDefault: 1 });
