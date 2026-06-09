import { compileBaseEmail } from './base-email.template';

export interface ShowtimeChangedTemplateData {
  bookingId: string;
  movieTitle: string;
  oldStartTime: Date;
  newStartTime: Date;
  theatreName: string;
  seatNumbers: string[];
  recipientName: string;
  backendUrl: string;
}

export function compileShowtimeChangedEmail(
  data: ShowtimeChangedTemplateData,
  trackingPixelUrl?: string,
): string {
  const oldDateStr = new Date(data.oldStartTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newDateStr = new Date(data.newStartTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <!-- Showtime Changed Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #d97706; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            Schedule Update
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
      Showtime Schedule Update
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      Hello ${data.recipientName}, there has been a schedule change for your upcoming show of <strong>${data.movieTitle}</strong>. Please find the updated showtime details below.
    </p>

    <!-- Showtime comparison card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="40%">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Original Showtime</div>
                <div style="font-size: 13px; font-weight: 600; color: #64748b; text-decoration: line-through;">${oldDateStr}</div>
              </td>
              <td width="20%" align="center" style="font-size: 18px; color: #3b82f6; font-weight: 700;">
                ➔
              </td>
              <td width="40%" style="text-align: right;">
                <div style="font-size: 11px; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">NEW SHOWTIME</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${newDateStr}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <span style="font-size: 13px; color: #64748b;">Theatre:</span>
                <span style="font-size: 13px; font-weight: 600; color: #0f172a; float: right;">${data.theatreName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px;">
                <span style="font-size: 13px; color: #64748b;">Seats Held:</span>
                <span style="font-size: 13px; font-weight: 600; color: #1e3a8a; float: right;">${data.seatNumbers.join(', ')}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="font-size: 13px; color: #64748b;">Booking Reference:</span>
                <span style="font-size: 13px; font-weight: 600; color: #0f172a; float: right; font-family: monospace;">${data.bookingId}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center; margin-bottom: 12px;">
      <tr>
        <td>
          <div style="background-color: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
            <p style="font-size: 13px; color: #3b82f6; margin: 0 0 4px 0; font-weight: 600;">Your tickets remain valid</p>
            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 18px;">
              Your original seats and booking are automatically moved to the new showtime. If the new slot does not fit your schedule, you can request a cancellation and full refund from the dashboard.
            </p>
          </div>
          <table align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 12px;">
                <a href="${data.backendUrl}/bookings/${data.bookingId}" class="btn" style="background-color: #1e3a8a; color: #ffffff;">
                  Confirm & View Ticket
                </a>
              </td>
              <td>
                <a href="${data.backendUrl}/bookings/${data.bookingId}" class="btn btn-secondary">
                  Request Refund
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `Showtime Schedule Update: ${data.movieTitle}`,
    preheader: `Your showtime for ${data.movieTitle} has been updated to ${newDateStr}.`,
    trackingPixelUrl,
  });
}
