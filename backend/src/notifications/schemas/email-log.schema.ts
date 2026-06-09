import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type EmailLogDocument = EmailLog & Document;

@Schema({ timestamps: true })
export class EmailLog {
  @Prop({ required: true, index: true })
  to: string;

  @Prop({ required: true })
  template: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', index: true })
  bookingId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['queued', 'sent', 'failed'],
    default: 'queued',
    index: true,
  })
  status: 'queued' | 'sent' | 'failed';

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  errorMessage?: string;

  @Prop()
  sentAt?: Date;

  @Prop()
  openedAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const EmailLogSchema = SchemaFactory.createForClass(EmailLog);
