export interface CalendarEventOptions {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  uid: string;
}

/**
 * Format a Date object into the standard iCalendar compact datetime format (UTC).
 * Example: 2026-06-09T14:41:42.000Z -> 20260609T144142Z
 */
export function formatToCalendarDate(date: Date): string {
  const iso = new Date(date).toISOString();
  return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate standard iCalendar (.ics) plain text file contents.
 */
export function generateIcsString(options: CalendarEventOptions): string {
  const dtstamp = formatToCalendarDate(new Date());
  const dtstart = formatToCalendarDate(options.startTime);
  const dtend = formatToCalendarDate(options.endTime);

  const escapedDescription = options.description
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

  const escapedSummary = options.title
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

  const escapedLocation = options.location
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ViewMax//Movie Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${options.uid}@viewmax.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapedSummary}`,
    `DESCRIPTION:${escapedDescription}`,
    `LOCATION:${escapedLocation}`,
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generate a deep-link URL to add the event to Google Calendar.
 */
export function generateGoogleCalendarUrl(
  options: CalendarEventOptions,
): string {
  const dates = `${formatToCalendarDate(options.startTime)}/${formatToCalendarDate(options.endTime)}`;
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates,
    details: options.description,
    location: options.location,
  });
  return `${baseUrl}?${query.toString()}`;
}

/**
 * Generate a deep-link URL to add the event to Outlook Calendar.
 */
export function generateOutlookCalendarUrl(
  options: CalendarEventOptions,
): string {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
  const query = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: options.title,
    startdt: formatToCalendarDate(options.startTime),
    enddt: formatToCalendarDate(options.endTime),
    body: options.description,
    location: options.location,
  });
  return `${baseUrl}?${query.toString()}`;
}
