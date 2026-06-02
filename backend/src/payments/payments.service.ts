import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { PaymentStatus } from '../common/constants/payment-status.enum';

@Injectable()
export class PaymentsService {
  private stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('stripe.secretKey')!,
    );
  }

  async createCheckoutSession(
    bookingId: string,
    amount: number,
    seatNumbers: string[],
    showtime: any,
  ) {
    const frontendUrl = this.configService.get<string>('frontend.url');

    const movieTitle =
      showtime.movieId?.title || showtime.movieId || 'Movie Ticket';
    const theatreName =
      showtime.theatreId?.name || showtime.theatreId || 'Theatre';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${movieTitle} - ${theatreName}`,
              description: `Seats: ${seatNumbers.join(', ')}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
      },
      success_url: `${frontendUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/booking/cancel?session_id={CHECKOUT_SESSION_ID}`,
    });

    await new this.paymentModel({
      bookingId,
      stripeSessionId: session.id,
      amount,
      currency: 'inr',
      status: PaymentStatus.PENDING,
    }).save();

    return session;
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    )!;

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw err;
    }

    return event;
  }

  async updatePaymentStatus(stripeSessionId: string, status: PaymentStatus) {
    await this.paymentModel.findOneAndUpdate({ stripeSessionId }, { status });
  }

  async findByBookingId(bookingId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ bookingId }).exec();
  }
}
