import { compileBaseEmail } from './base-email.template';

export interface ReminderNotificationTemplateData {
  bookingId: string;
  movieTitle: string;
  theatreName: string;
  theatreAddress: string;
  screenName: string;
  screenType: string;
  startTime: Date;
  seatNumbers: string[];
  qrCodeUrl: string;
  countdownText: string; // e.g. "in 2 hours", "in 30 minutes", "tomorrow"
  recipientName: string;
  backendUrl: string;
}

export function compileReminderNotificationEmail(
  data: ReminderNotificationTemplateData,
  trackingPixelUrl?: string,
): string {
  const showTimeStr = new Date(data.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const showDateStr = new Date(data.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const htmlContent = `
    <!-- Countdown Header Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #d97706; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            Starting ${data.countdownText}
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
      Showtime Reminder! ⏰
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      Hello ${data.recipientName}, your show is starting soon. Make sure to arrive early to get refreshments and settle in.
    </p>

    <!-- Ticket Card (Wallet style) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Movie</div>
                <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${data.movieTitle}</div>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <!-- Showtime info grid -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="33%" valign="top">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Time</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${showTimeStr}</div>
              </td>
              <td width="33%" valign="top">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Date</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${showDateStr}</div>
              </td>
              <td width="33%" valign="top">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Seats</div>
                <div style="font-size: 13px; font-weight: 700; color: #1e3a8a;">${data.seatNumbers.join(', ')}</div>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" style="padding-right: 16px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Theatre</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${data.theatreName}</div>
                <div style="font-size: 12px; color: #475569; line-height: 16px;">${data.theatreAddress}</div>
                <div style="font-size: 11px; color: #3b82f6; font-weight: 600; margin-top: 8px;">${data.screenName} (${data.screenType})</div>
              </td>
              <td width="110" align="center">
                <img src="${data.qrCodeUrl}" width="100" height="100" style="border: 3px solid #f1f5f9; border-radius: 6px; display: block;" alt="QR Code" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Smart Placeholders: Weather & Parking -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td width="50%" valign="top" style="padding-right: 8px;">
          <!-- Weather Widget -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <tr>
              <td style="padding: 16px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Theatre Weather</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">🌤️ 28&deg;C, Clear</div>
                <div style="font-size: 11px; color: #475569; margin-top: 4px;">Perfect evening for cinema.</div>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" valign="top" style="padding-left: 8px;">
          <!-- Parking Widget -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <tr>
              <td style="padding: 16px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Parking Advice</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">🚗 Levels B2 & B3</div>
                <div style="font-size: 11px; color: #475569; margin-top: 4px;">Valet parking is active.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${data.backendUrl}/bookings/${data.bookingId}" class="btn btn-gold">
            Open Ticket Details
          </a>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `Showtime Reminder: ${data.movieTitle}`,
    preheader: `Your movie starts ${data.countdownText}! Showcase your ticket QR code for fast-track check-in.`,
    trackingPixelUrl,
  });
}
