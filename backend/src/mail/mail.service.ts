import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import dns from 'dns';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Called automatically by NestJS after the module is initialised.
   * Resolves the SMTP hostname to an IPv4 address (Render does NOT
   * support IPv6 outbound), creates the transporter, and verifies
   * the connection so mis-configuration shows up immediately at boot.
   */
  async onModuleInit(): Promise<void> {
    await this.createTransporter();
    await this.verifyTransporter();
  }

  // ── Transporter creation ────────────────────────────────────────────────

  private async createTransporter(): Promise<void> {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port', 465);
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    const isSecure = port === 465;

    // ── Force IPv4 resolution ──────────────────────────────────────────
    // Render (and many PaaS providers) do NOT support IPv6 outbound.
    // Node/Nodemailer may resolve smtp.gmail.com to an IPv6 address
    // (e.g. 2404:6800:…) which fails with ENETUNREACH.
    // We explicitly resolve to IPv4 and connect to the IP directly,
    // while setting `tls.servername` so TLS certificate validation
    // still matches the original hostname.
    let connectHost = host;

    if (host && !/^[\d.]+$/.test(host)) {
      try {
        const ipv4Addresses = await dns.promises.resolve4(host);
        if (ipv4Addresses.length > 0) {
          connectHost = ipv4Addresses[0];
          this.logger.log(
            `Resolved SMTP host ${host} → IPv4 ${connectHost}`,
          );
        }
      } catch (dnsErr) {
        this.logger.warn(
          `DNS IPv4 resolution for ${host} failed: ${dnsErr.message}. ` +
            `Falling back to hostname (may use IPv6).`,
        );
      }
    }

    this.logger.log(
      `Configuring SMTP transporter — connect: ${connectHost}:${port}, ` +
        `secure: ${isSecure}, user: ${user}`,
    );

    this.transporter = nodemailer.createTransport({
      host: connectHost,
      port,
      secure: isSecure, // true for 465 (implicit TLS), false for 587/2525 (STARTTLS)
      // On non-465 ports the connection starts in plaintext and upgrades via
      // STARTTLS. Enforce the upgrade so credentials are never sent unencrypted
      // (e.g. Brevo/Mailtrap-style relays on port 2525).
      requireTLS: !isSecure,
      auth: {
        user,
        pass,
      },

      // ── Timeouts — fail fast instead of hanging for 2 minutes ──────
      connectionTimeout: 10_000, // 10 s to establish TCP connection
      greetingTimeout: 10_000, // 10 s for the server EHLO greeting
      socketTimeout: 15_000, // 15 s for any subsequent socket inactivity

      // ── TLS ────────────────────────────────────────────────────────
      tls: {
        // servername MUST be the original hostname (not the IP) so the
        // TLS certificate Subject/SAN matches during the handshake.
        servername: host,
        rejectUnauthorized: true,
      },
    });
  }

  // ── Startup verification ────────────────────────────────────────────────

  private async verifyTransporter(): Promise<void> {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port', 465);

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
      const port = this.configService.get<number>('smtp.port', 465);
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

    if (code === 'ENETUNREACH') {
      return (
        'NETWORK UNREACHABLE — Tried to connect via IPv6 but the host does not ' +
        'support IPv6 outbound. Ensure DNS resolves to IPv4.'
      );
    }
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
