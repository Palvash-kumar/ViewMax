import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { BookingStatus } from '../../common/constants/booking-status.enum';
import { PaymentStatus } from '../../common/constants/payment-status.enum';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Showtime',
    required: true,
  })
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

  /** HMAC-SHA256 signed token for QR verification */
  @Prop()
  ticketSignature: string;

  /** Unique nonce stored in Redis to prevent replay attacks */
  @Prop()
  verificationToken: string;

  /** When the ticket was checked in */
  @Prop()
  checkedInAt: Date;

  /** Staff member who checked in the ticket */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  checkedInBy: Types.ObjectId;

  /** If transferred, the new owner's user ID */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  transferredTo: Types.ObjectId;

  /** When the booking expires (showtime start time) */
  @Prop()
  expiresAt: Date;

  /** Stripe payment intent ID for refunds */
  @Prop()
  stripePaymentIntentId: string;

  /** Last time the QR was verified */
  @Prop()
  lastVerifiedAt: Date;

  /** Number of verification attempts */
  @Prop({ default: 0 })
  verificationAttempts: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ userId: 1 });
BookingSchema.index({ showtimeId: 1 });
BookingSchema.index({ bookingStatus: 1 });
BookingSchema.index({ stripeSessionId: 1 });
BookingSchema.index({ verificationToken: 1 });
BookingSchema.index({ expiresAt: 1 });
BookingSchema.index({ createdAt: -1 });
