import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import dns from 'dns';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Force Node's DNS resolver to prioritize IPv4. This is essential in environments like Render
    // that do not support IPv6 outbound routing, preventing "connect ENETUNREACH" errors.
    dns.setDefaultResultOrder('ipv4first');

    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port', 587);
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');

    this.logger.log(
      `Initializing SMTP Mail Service using host: ${host}, port: ${port}`,
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        // Essential to bypass local certificates issues or TLS handshakes on development systems
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Sends an email using the configured SMTP transporter.
   *
   * @param to        Recipient email address
   * @param subject   Email subject line
   * @param html      Pre-compiled HTML body content
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
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        attachments,
      });
      this.logger.debug(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to allow callers (like BullMQ worker) to catch and retry
    }
  }
}
