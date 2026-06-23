import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Called automatically by NestJS after the module is initialised.
   * Creates the SMTP transporter and verifies the connection so any
   * mis-configuration surfaces immediately in the startup logs.
   */
  async onModuleInit(): Promise<void> {
    this.createTransporter();
    await this.verifyTransporter();
  }

  // ── Transporter creation ────────────────────────────────────────────────

  private createTransporter(): void {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port', 587);
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    const isSecure = port === 465;

    this.logger.log(
      `Configuring SMTP transporter — host: ${host}, port: ${port}, secure: ${isSecure}, user: ${user}`,
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure, // true for 465 (implicit TLS), false for 587 (STARTTLS)
      auth: {
        user,
        pass,
      },

      // ── Timeouts — fail fast instead of hanging for 2 minutes ──────────
      connectionTimeout: 10_000, // 10 s to establish TCP connection
      greetingTimeout: 10_000, // 10 s for the server EHLO greeting
      socketTimeout: 15_000, // 15 s for any subsequent socket inactivity

      // ── TLS ────────────────────────────────────────────────────────────
      tls: {
        // Use the hostname for SNI so the certificate matches
        servername: host,
        // In production keep certificate validation enabled;
        // only disable in dev if you have self-signed proxy certs.
        rejectUnauthorized: true,
      },

      // ── DNS ────────────────────────────────────────────────────────────
      // Let Nodemailer resolve the host itself (respects the global
      // dns.setDefaultResultOrder('ipv4first') already set in main.ts).
      // Do NOT resolve to an IP manually — it breaks TLS certificate
      // validation on many cloud providers.
    });
  }

  // ── Startup verification ────────────────────────────────────────────────

  private async verifyTransporter(): Promise<void> {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port', 587);

    try {
      await this.transporter.verify();
      this.logger.log(
        `✅ SMTP connection verified successfully (${host}:${port})`,
      );
    } catch (error) {
      const errorType = this.classifySmtpError(error);
      this.logger.error(
        `❌ SMTP verification FAILED — ${errorType}\n` +
          `   Host : ${host}\n` +
          `   Port : ${port}\n` +
          `   Error: ${error.message}`,
      );

      // Don't crash the entire application — emails will fail at send-time
      // but all other endpoints remain operational.
      this.logger.warn(
        'The application will continue to start, but email sending will fail. ' +
          'Check your SMTP credentials, network/firewall rules, and whether your ' +
          'hosting provider allows outbound connections on the configured port.',
      );
    }
  }

  // ── Send email ──────────────────────────────────────────────────────────

  /**
   * Sends an email using the configured SMTP transporter.
   *
   * @param to        Recipient email address
   * @param subject   Email subject line
   * @param html      Pre-compiled HTML body content
   * @param attachments Optional array of nodemailer attachment objects
   */
  async sendMail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
  ): Promise<void> {
    const from =
      this.configService.get<string>('smtp.from') ||
      'ViewMax <noreply@viewmax.app>';

    this.logger.debug(`Sending email to ${to} from ${from}...`);

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        attachments,
      });
      this.logger.debug(
        `Email sent successfully to ${to} (messageId: ${info.messageId})`,
      );
    } catch (error) {
      const host = this.configService.get<string>('smtp.host');
      const port = this.configService.get<number>('smtp.port', 587);
      const errorType = this.classifySmtpError(error);

      this.logger.error(
        `Failed to send email to ${to} — ${errorType}\n` +
          `   Host : ${host}\n` +
          `   Port : ${port}\n` +
          `   Code : ${error.code || 'N/A'}\n` +
          `   Cmd  : ${error.command || 'N/A'}\n` +
          `   Error: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to allow callers (e.g. BullMQ worker) to catch and retry
    }
  }

  // ── Error classification ────────────────────────────────────────────────

  private classifySmtpError(error: any): string {
    const msg = (error.message || '').toLowerCase();
    const code = (error.code || '').toUpperCase();

    if (
      msg.includes('connection timeout') ||
      code === 'ETIMEDOUT' ||
      code === 'ESOCKET'
    ) {
      return (
        'CONNECTION TIMEOUT — The SMTP server is unreachable. ' +
        'Your hosting provider may block outbound SMTP traffic on this port.'
      );
    }
    if (code === 'ECONNREFUSED') {
      return 'CONNECTION REFUSED — The SMTP server actively refused the connection.';
    }
    if (code === 'ENOTFOUND' || msg.includes('getaddrinfo')) {
      return 'DNS RESOLUTION FAILED — Cannot resolve the SMTP hostname.';
    }
    if (code === 'ENETUNREACH') {
      return 'NETWORK UNREACHABLE — No route to the SMTP server (likely an IPv6 issue).';
    }
    if (
      msg.includes('invalid login') ||
      msg.includes('authentication') ||
      code === 'EAUTH'
    ) {
      return 'AUTHENTICATION FAILED — Check your SMTP username and app password.';
    }
    if (
      msg.includes('ssl') ||
      msg.includes('tls') ||
      msg.includes('certificate') ||
      code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
    ) {
      return 'TLS/SSL ERROR — Certificate or handshake failure.';
    }
    if (msg.includes('greeting timeout') || code === 'ETIMEOUT') {
      return 'GREETING TIMEOUT — Connected but the server did not respond in time.';
    }
    return `UNKNOWN SMTP ERROR (code: ${error.code || 'none'})`;
  }
}
