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
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentStatus } from '../common/constants/payment-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
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
        (req as any).rawBody, // raw body
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

  @Post('verify-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify stripe session and confirm booking' })
  async verifySession(@Body('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    const session = await this.paymentsService.retrieveCheckoutSession(sessionId);

    if (session.payment_status === 'paid') {
      await this.paymentsService.updatePaymentStatus(
        sessionId,
        PaymentStatus.COMPLETED,
      );
      await this.bookingsService.confirmBooking(sessionId);
      return { success: true, status: 'paid' };
    }

    return { success: false, status: session.payment_status };
  }
}
