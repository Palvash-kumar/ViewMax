import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MovieStatus } from '../../common/constants/movie-status.enum';

export type MovieDocument = Movie & Document;

@Schema({ timestamps: true })
export class Movie {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  poster: string;

  @Prop()
  trailer: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  releaseDate: Date;

  @Prop({ type: String, enum: MovieStatus, default: MovieStatus.UPCOMING })
  status: MovieStatus;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

MovieSchema.index({ title: 'text', description: 'text' });
MovieSchema.index({ status: 1 });
MovieSchema.index({ releaseDate: 1 });
MovieSchema.index({ genres: 1 });
