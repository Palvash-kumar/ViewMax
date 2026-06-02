import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus } from '../../common/constants/booking-status.enum';
import { PaymentStatus } from '../../common/constants/payment-status.enum';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Showtime', required: true })
  showtimeId: Types.ObjectId;

  @Prop({ type: [String], required: true })
  seatNumbers: string[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  bookingStatus: BookingStatus;

  @Prop()
  qrCode: string;

  @Prop()
  stripeSessionId: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ userId: 1 });
BookingSchema.index({ showtimeId: 1 });
BookingSchema.index({ bookingStatus: 1 });
BookingSchema.index({ stripeSessionId: 1 });
