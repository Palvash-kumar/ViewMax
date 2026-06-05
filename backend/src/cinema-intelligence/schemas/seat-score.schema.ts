import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ScreenType } from '../../common/constants/screen-type.enum';

export type SeatScoreDocument = SeatScore & Document;

export type SeatQualityCategory =
  | 'ELITE'
  | 'EXCELLENT'
  | 'RECOMMENDED'
  | 'AVERAGE'
  | 'AVOID';

@Schema({ timestamps: true, collection: 'seat_scores' })
export class SeatScore {
  @Prop({ type: Types.ObjectId, ref: 'TheatreLayout', required: true })
  layoutId: Types.ObjectId;

  @Prop({ required: true })
  seatId: string;

  @Prop({ type: String, enum: ScreenType, required: true })
  screenType: ScreenType;

  // ─── Individual Metrics (0–100) ───────────────────────────────────────────

  @Prop({ required: true, min: 0, max: 100 })
  distanceScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  horizontalAngleScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  verticalAngleScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  centerAlignmentScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  screenCoverageScore: number;

  // ─── Composite Scores (0–100) ─────────────────────────────────────────────

  @Prop({ required: true, min: 0, max: 100 })
  immersionScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  comfortScore: number;

  @Prop({ required: true, min: 0, max: 100 })
  premiumExperienceScore: number;

  // ─── Raw Measurements ─────────────────────────────────────────────────────

  @Prop({ required: true })
  neckStrainDegrees: number;

  @Prop({ required: true })
  distanceMeters: number;

  @Prop({ required: true })
  horizontalAngleDegrees: number;

  @Prop({ required: true })
  verticalAngleDegrees: number;

  @Prop({ required: true })
  screenCoverageFovPercent: number;

  // ─── Classification ───────────────────────────────────────────────────────

  @Prop({
    type: String,
    enum: ['ELITE', 'EXCELLENT', 'RECOMMENDED', 'AVERAGE', 'AVOID'],
    required: true,
  })
  category: SeatQualityCategory;

  @Prop({ required: true })
  heatmapColor: string;

  // ─── Seat Metadata (denormalized for fast reads) ──────────────────────────

  @Prop({ required: true })
  row: string;

  @Prop({ required: true })
  seatNumber: number;
}

export const SeatScoreSchema = SchemaFactory.createForClass(SeatScore);

SeatScoreSchema.index({ layoutId: 1 });
SeatScoreSchema.index({ layoutId: 1, seatId: 1 }, { unique: true });
SeatScoreSchema.index({ layoutId: 1, category: 1 });
SeatScoreSchema.index({ layoutId: 1, premiumExperienceScore: -1 });
