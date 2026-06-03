import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ViewingPreference = 'IMMERSION' | 'COMFORT' | 'BALANCED';
export type PositionPreference = 'FRONT' | 'MIDDLE' | 'BACK';
export type PriorityPreference = 'AUDIO' | 'VISUALS' | 'BOTH';
export type WatchingWith = 'ALONE' | 'COUPLE' | 'GROUP' | 'FAMILY';

export type UserPreferenceDocument = UserPreference & Document;

@Schema({ timestamps: true, collection: 'user_preferences' })
export class UserPreference {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['IMMERSION', 'COMFORT', 'BALANCED'],
    default: 'BALANCED',
  })
  viewingPreference: ViewingPreference;

  @Prop({
    type: String,
    enum: ['FRONT', 'MIDDLE', 'BACK'],
    default: 'MIDDLE',
  })
  positionPreference: PositionPreference;

  @Prop({
    type: String,
    enum: ['AUDIO', 'VISUALS', 'BOTH'],
    default: 'BOTH',
  })
  priorityPreference: PriorityPreference;

  @Prop({
    type: String,
    enum: ['ALONE', 'COUPLE', 'GROUP', 'FAMILY'],
    default: 'ALONE',
  })
  watchingWith: WatchingWith;
}

export const UserPreferenceSchema =
  SchemaFactory.createForClass(UserPreference);

UserPreferenceSchema.index({ userId: 1 }, { unique: true });
