import { compileBaseEmail } from './base-email.template';

export interface PaymentSuccessfulTemplateData {
  bookingId: string;
  movieTitle: string;
  seatNumbers: string[];
  totalPrice: number;
  paymentIntentId: string;
  recipientName: string;
  backendUrl: string;
}

export function compilePaymentSuccessfulEmail(
  data: PaymentSuccessfulTemplateData,
  trackingPixelUrl?: string,
): string {
  const transactionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const baseTicketPrice = data.totalPrice / data.seatNumbers.length;

  const htmlContent = `
    <!-- Top Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #059669; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            Payment Successful
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
      Receipt from ViewMax
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      Thank you for your payment. This email serves as your receipt of purchase.
    </p>

    <!-- Payment details card (Stripe style receipt) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #f8fafc; margin-bottom: 28px;">
      <!-- Total Price header -->
      <tr>
        <td style="padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #f1f5f9;">
          <div style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Amount Paid</div>
          <div style="font-size: 36px; font-weight: 850; color: #0f172a; font-family: system-ui, -apple-system, sans-serif;">
            ₹${data.totalPrice.toFixed(2)}
          </div>
        </td>
      </tr>
      
      <!-- Receipt breakdown rows -->
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 14px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Receipt Date</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${transactionDate}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Reference / Payment Intent</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${data.paymentIntentId}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Payment Status</td>
                    <td style="font-size: 14px; font-weight: 700; color: #059669; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">COMPLETED</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <!-- Itemized Breakdown -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 14px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Itemized Summary</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #0f172a; font-weight: 600;">
                      ${data.movieTitle} Ticket (${data.seatNumbers.length} seats)
                    </td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">
                      ₹${data.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #64748b; padding-top: 4px;">
                      Seats: ${data.seatNumbers.join(', ')} &times; ₹${baseTicketPrice.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; font-weight: 700; color: #0f172a;">Total Paid</td>
                    <td style="font-size: 16px; font-weight: 800; color: #1e3a8a; text-align: right;">
                      ₹${data.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA to booking page -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${data.backendUrl}/bookings/${data.bookingId}" class="btn btn-secondary">
            View Booking Details
          </a>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `Payment Receipt: ${data.bookingId}`,
    preheader: `Payment receipt of ₹${data.totalPrice.toFixed(2)} for movie booking ${data.bookingId}.`,
    trackingPixelUrl,
  });
}
