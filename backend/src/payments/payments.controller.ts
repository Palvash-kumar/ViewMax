import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentStatus } from '../common/constants/payment-status.enum';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    try {
      const event = await this.paymentsService.handleWebhook(
        req.body, // raw body
        signature,
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          this.logger.log(`Payment successful for session: ${session.id}`);
          await this.paymentsService.updatePaymentStatus(
            session.id,
            PaymentStatus.COMPLETED,
          );
          await this.bookingsService.confirmBooking(session.id);
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object;
          this.logger.log(`Payment expired for session: ${session.id}`);
          await this.paymentsService.updatePaymentStatus(
            session.id,
            PaymentStatus.FAILED,
          );
          await this.bookingsService.handlePaymentFailure(session.id);
          break;
        }
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      this.logger.error(`Webhook error: ${err.message}`);
      res.status(400).json({ error: 'Webhook error' });
    }
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get payment status for a booking' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBookingId(bookingId);
  }
}
