import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type DemoVideoDocument = DemoVideo & Document;

@Schema({ timestamps: true, collection: 'demo_videos' })
export class DemoVideo {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Screen', required: true })
  screenId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  posterUrl: string;

  @Prop({ required: true })
  videoUrl: string;

  /** 'cloudinary' or 'local' — determines how to serve/delete the video */
  @Prop({ type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' })
  videoStorage: 'cloudinary' | 'local';

  /** Cloudinary public_id (only when videoStorage === 'cloudinary') */
  @Prop()
  videoPublicId?: string;

  /** Cloudinary public_id for the poster image */
  @Prop()
  posterPublicId?: string;

  @Prop({ default: 0 })
  order: number;
}

export const DemoVideoSchema = SchemaFactory.createForClass(DemoVideo);

DemoVideoSchema.index({ screenId: 1, order: 1 });
