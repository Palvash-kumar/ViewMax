import { compileBaseEmail } from './base-email.template';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from '../../common/utils/calendar.utils';

export interface BookingConfirmationTemplateData {
  bookingId: string;
  movieTitle: string;
  moviePoster?: string;
  theatreName: string;
  theatreAddress: string;
  screenName: string;
  screenType: string; // e.g. 'True IMAX', 'Dolby Cinema', etc.
  startTime: Date;
  duration: number; // minutes
  seatNumbers: string[];
  totalPrice: number;
  paymentStatus: string;
  qrCodeUrl: string; // data URL or public URL
  backendUrl: string;
  recipientName: string;
}

export function compileBookingConfirmationEmail(
  data: BookingConfirmationTemplateData,
  trackingPixelUrl?: string,
): string {
  const showDate = new Date(data.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const showTime = new Date(data.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = new Date(
    data.startTime.getTime() + data.duration * 60 * 1000,
  );

  const calDescription = `Your premium movie ticket for ${data.movieTitle} is confirmed!\n\nBooking ID: ${data.bookingId}\nSeats: ${data.seatNumbers.join(', ')}\nScreen: ${data.screenName} (${data.screenType})\n\nBooked via ViewMax`;

  const calendarOptions = {
    title: `${data.movieTitle} - ViewMax Cinema`,
    description: calDescription,
    location: `${data.theatreName}, ${data.theatreAddress}`,
    startTime: data.startTime,
    endTime,
    uid: data.bookingId,
  };

  const googleUrl = generateGoogleCalendarUrl(calendarOptions);
  const outlookUrl = generateOutlookCalendarUrl(calendarOptions);
  const icsUrl = `${data.backendUrl}/api/bookings/${data.bookingId}/calendar/ics`;

  const posterHtml = data.moviePoster
    ? `<td width="120" valign="top" style="padding-right: 20px;">
         <img src="${data.moviePoster}" width="120" style="border-radius: 8px; border: 1px solid #e2e8f0; display: block;" alt="${data.movieTitle} poster" />
       </td>`
    : '';

  const htmlContent = `
    <!-- Top Booking Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #059669; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            Booking Confirmed
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; font-family: system-ui, sans-serif;">
      Hi ${data.recipientName},
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      Your order was processed successfully. Enclosed is your premium cinema ticket boarding pass. Showcase the QR code at the screen entrance.
    </p>

    <!-- Movie & Boarding Pass Info Container (Apple Wallet Style Ticket) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${posterHtml}
              <td valign="top">
                <div style="font-size: 12px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
                  Now Showing
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 26px;">
                  ${data.movieTitle}
                </h2>
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom: 6px; font-size: 13px; color: #334155;">
                      <strong style="color: #64748b;">Theatre:</strong> ${data.theatreName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 6px; font-size: 13px; color: #334155;">
                      <strong style="color: #64748b;">Screen:</strong> ${data.screenName} (${data.screenType})
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #334155;">
                      <strong style="color: #64748b;">Duration:</strong> ${data.duration} mins
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <!-- Showtime details grid -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50%" valign="top" style="padding-right: 10px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Date</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${showDate}</div>
              </td>
              <td width="50%" valign="top" style="padding-left: 10px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Showtime</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${showTime}</div>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <!-- Booking and QR section -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" style="padding-right: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom: 8px;">
                      <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Booking ID</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">${data.bookingId}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 8px;">
                      <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Seats</div>
                      <div style="font-size: 15px; font-weight: 700; color: #1e3a8a;">${data.seatNumbers.join(', ')}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Total Price</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">₹${data.totalPrice.toFixed(2)}</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="130" align="center" valign="middle">
                <!-- QR Code attached inline or data URL -->
                <img src="${data.qrCodeUrl}" width="120" height="120" style="border: 4px solid #f1f5f9; border-radius: 8px; display: block;" alt="Ticket QR Code" />
                <span style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; display: block;">SCAN TO ENTRY</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Calendar Sync Integration Section -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Add to Calendar</h3>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">Sync your movie session with your calendar so you don't miss the show.</p>
          <table align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 0 8px;">
                <a href="${googleUrl}" target="_blank" style="font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 600;">Google</a>
              </td>
              <td style="padding: 0 8px; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
                <a href="${outlookUrl}" target="_blank" style="font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 600;">Outlook</a>
              </td>
              <td style="padding: 0 8px;">
                <a href="${icsUrl}" target="_blank" style="font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 600;">Apple Calendar (.ics)</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Reminders CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${data.backendUrl}/bookings/${data.bookingId}" class="btn" style="background-color: #1e3a8a; color: #ffffff;">
            Open Ticket Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `Your ViewMax Ticket: ${data.movieTitle}`,
    preheader: `Ticket confirmed for ${data.movieTitle} on ${showDate} at ${showTime}.`,
    trackingPixelUrl,
  });
}
