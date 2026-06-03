import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ScreenType } from '../../common/constants/screen-type.enum';

export interface RecommendationScores {
  immersion: number;
  comfort: number;
  coverage: number;
  overall: number;
}

export type RecommendationHistoryDocument = RecommendationHistory & Document;

@Schema({ timestamps: true, collection: 'recommendation_history' })
export class RecommendationHistory {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TheatreLayout', required: true })
  layoutId: Types.ObjectId;

  @Prop({ required: true })
  seatId: string;

  @Prop({ type: String, enum: ScreenType, required: true })
  screenType: ScreenType;

  @Prop({ required: true })
  recommendation: string;

  @Prop({ type: Object, required: true })
  scores: RecommendationScores;
}

export const RecommendationHistorySchema =
  SchemaFactory.createForClass(RecommendationHistory);

RecommendationHistorySchema.index({ userId: 1 });
RecommendationHistorySchema.index({ layoutId: 1, userId: 1 });
