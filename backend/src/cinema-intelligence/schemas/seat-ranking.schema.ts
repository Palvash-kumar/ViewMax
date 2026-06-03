import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ScreenType } from '../../common/constants/screen-type.enum';

export interface SeatRankEntry {
  seatId: string;
  row: string;
  seatNumber: number;
  premiumExperienceScore: number;
  immersionScore: number;
  comfortScore: number;
  screenCoverageScore: number;
  category: string;
}

export interface CategoryDistribution {
  elite: number;
  excellent: number;
  recommended: number;
  average: number;
  avoid: number;
}

export type SeatRankingDocument = SeatRanking & Document;

@Schema({ timestamps: true, collection: 'seat_rankings' })
export class SeatRanking {
  @Prop({ type: Types.ObjectId, ref: 'TheatreLayout', required: true })
  layoutId: Types.ObjectId;

  @Prop({ type: String, enum: ScreenType, required: true })
  screenType: ScreenType;

  @Prop({ type: [Object], default: [] })
  top5: SeatRankEntry[];

  @Prop({ type: [Object], default: [] })
  top10: SeatRankEntry[];

  @Prop({ type: [Object], default: [] })
  topVip: SeatRankEntry[];

  @Prop({ type: [Object], default: [] })
  topValue: SeatRankEntry[];

  @Prop({ type: [Object], default: [] })
  topAccessible: SeatRankEntry[];

  @Prop({ type: Object, default: {} })
  categoryDistribution: CategoryDistribution;

  @Prop({ default: () => new Date() })
  generatedAt: Date;
}

export const SeatRankingSchema = SchemaFactory.createForClass(SeatRanking);

SeatRankingSchema.index({ layoutId: 1 }, { unique: true });
