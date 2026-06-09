import { compileBaseEmail } from './base-email.template';

export interface TicketCancelledTemplateData {
  bookingId: string;
  movieTitle: string;
  seatNumbers: string[];
  totalPrice: number;
  startTime: Date;
  recipientName: string;
  backendUrl: string;
}

export function compileTicketCancelledEmail(
  data: TicketCancelledTemplateData,
  trackingPixelUrl?: string,
): string {
  const showDateStr = new Date(data.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!-- Cancelled Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #dc2626; background-color: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            Booking Cancelled
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
      Booking Cancelled
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      Hello ${data.recipientName}, your booking for <strong>${data.movieTitle}</strong> has been cancelled. If payment was made, your refund is being processed.
    </p>

    <!-- Cancellation Summary Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Booking ID</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${data.bookingId}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Movie</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${data.movieTitle}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Scheduled Showtime</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${showDateStr}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Seats Cancelled</td>
                    <td style="font-size: 14px; font-weight: 600; color: #dc2626; text-align: right;">${data.seatNumbers.join(', ')}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; font-weight: 700; color: #0f172a;">Refund Amount</td>
                    <td style="font-size: 15px; font-weight: 800; color: #1e3a8a; text-align: right;">₹${data.totalPrice.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
      <tr>
        <td>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0;">If you have questions about your refund, please contact support.</p>
          <a href="${data.backendUrl}" class="btn btn-secondary">
            Return to ViewMax
          </a>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `Booking Cancelled: ${data.movieTitle}`,
    preheader: `Your booking ${data.bookingId} has been cancelled. Refund of ₹${data.totalPrice.toFixed(2)} is being processed.`,
    trackingPixelUrl,
  });
}
