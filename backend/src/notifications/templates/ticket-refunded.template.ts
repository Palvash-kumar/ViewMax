import { compileBaseEmail } from './base-email.template';

export interface TicketRefundedTemplateData {
  bookingId: string;
  movieTitle: string;
  refundAmount: number;
  paymentIntentId: string;
  recipientName: string;
  backendUrl: string;
}

export function compileTicketRefundedEmail(
  data: TicketRefundedTemplateData,
  trackingPixelUrl?: string,
): string {
  const transactionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!-- Refund Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #d97706; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            Refund Processed
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
      Refund Initiated
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      Hello ${data.recipientName}, we have successfully initiated a refund for your cancelled booking of <strong>${data.movieTitle}</strong>.
    </p>

    <!-- Refund Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #f1f5f9;">
          <div style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Refunded Amount</div>
          <div style="font-size: 36px; font-weight: 850; color: #1e3a8a; font-family: system-ui, -apple-system, sans-serif;">
            ₹${data.refundAmount.toFixed(2)}
          </div>
        </td>
      </tr>
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
                    <td style="font-size: 14px; color: #64748b;">Refund Date</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${transactionDate}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Transaction Reference</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${data.paymentIntentId}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 14px; color: #64748b;">Refund Destination</td>
                    <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">Original Payment Method</td>
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
          <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
            <p style="font-size: 13px; color: #d97706; margin: 0 0 4px 0; font-weight: 600;">Processing Timeframe</p>
            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 18px;">
              Most refunds are credited back to your account within 5 to 7 business days, depending on your bank's processing policies.
            </p>
          </div>
          <a href="${data.backendUrl}" class="btn btn-secondary">
            Return to Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `Refund Processed: Booking ${data.bookingId}`,
    preheader: `We've initiated a refund of ₹${data.refundAmount.toFixed(2)} for your cancelled ticket.`,
    trackingPixelUrl,
  });
}
