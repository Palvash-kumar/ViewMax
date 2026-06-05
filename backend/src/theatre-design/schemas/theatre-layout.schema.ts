import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LayoutStatus } from '../../common/constants/layout-status.enum';
import { SeatCategory } from '../../common/constants/seat-category.enum';
import { ZoneType } from '../../common/constants/zone-type.enum';

export interface LayoutRow {
  label: string;
  order: number;
  seatCount: number;
  category: SeatCategory;
  offset: number;
}

export interface SeatMapItem {
  id: string;
  row: string;
  seatNumber: number;
  category: SeatCategory;
  status: 'ACTIVE' | 'BLOCKED' | 'REMOVED';
}

export interface LayoutAisle {
  position: number;
  type: 'LEFT' | 'RIGHT' | 'CENTER';
  width: number;
}

export interface LayoutZone {
  name: string;
  type: ZoneType;
  rows: string[];
  color: string;
}

export interface ScreenConfig {
  width: number;
  height: number;
  aspectRatio: string;
  elevation: number;
}

export interface GeometryData {
  totalWidth: number;
  totalDepth: number;
  maxElevation: number;
  screenPosition: [number, number, number];
  stageDepth: number;
}

export interface CameraPresetData {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface Generated3DData {
  screen: {
    position: [number, number, number];
    width: number;
    height: number;
    curvature: number;
  };
  floor: {
    width: number;
    depth: number;
    segments: { y: number; zStart: number; zEnd: number }[];
  };
  stage: {
    width: number;
    depth: number;
    position: [number, number, number];
  };
  lighting: {
    ambient: number;
    spots: { position: [number, number, number]; intensity: number }[];
  };
  cameraPresets: CameraPresetData[];
}

export type TheatreLayoutDocument = TheatreLayout & Document;

@Schema({ timestamps: true, collection: 'theatre_layouts' })
export class TheatreLayout {
  @Prop({ type: Types.ObjectId, ref: 'Theatre', required: true })
  theatreId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Screen', required: true })
  screenId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TheatreTemplate' })
  templateId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  layoutName: string;

  @Prop({
    type: String,
    enum: LayoutStatus,
    default: LayoutStatus.DRAFT,
  })
  status: LayoutStatus;

  @Prop({ type: [Object], default: [] })
  rows: LayoutRow[];

  @Prop({ type: [Object], default: [] })
  seatMap: SeatMapItem[];

  @Prop({ type: [Object], default: [] })
  aisles: LayoutAisle[];

  @Prop({ type: [Object], default: [] })
  zones: LayoutZone[];

  @Prop({ type: Object, default: {} })
  screenConfig: ScreenConfig;

  @Prop({ type: Object })
  geometryData: GeometryData;

  @Prop({ type: Object })
  generated3DData: Generated3DData;

  @Prop()
  publishedAt: Date;

  // Denormalized for fast queries
  @Prop({ default: 0 })
  totalCapacity: number;

  @Prop({ default: 0 })
  totalRows: number;
}

export const TheatreLayoutSchema = SchemaFactory.createForClass(TheatreLayout);

TheatreLayoutSchema.index({ theatreId: 1 });
TheatreLayoutSchema.index({ screenId: 1 });
TheatreLayoutSchema.index({ status: 1 });
TheatreLayoutSchema.index({ theatreId: 1, screenId: 1 });
