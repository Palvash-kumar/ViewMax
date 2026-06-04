/**
 * Canonical queue name constants shared across the application.
 * Import from here instead of hard-coding queue name strings.
 */
export const QUEUE_NAMES = {
  /** Delayed jobs to expire unpaid bookings */
  TICKET_EXPIRATION: 'ticket-expiration',
  /** Transactional email delivery */
  EMAIL: 'email',
  /** Async in-app notification persistence */
  NOTIFICATION: 'notification',
  /** Fire-and-forget analytics event stream */
  ANALYTICS: 'analytics',
} as const;
