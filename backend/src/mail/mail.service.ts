import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import dns from 'dns';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private initializationPromise: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    this.initializationPromise = this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port', 587);
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');

    let targetHost = host;
    const tlsConfig: any = {
      rejectUnauthorized: false, // Essential to bypass local certificates issues or TLS handshakes on development systems
    };

    if (host && !/^[0-9.]+$/.test(host)) {
      try {
        const addresses = await dns.promises.resolve4(host);
        if (addresses && addresses.length > 0) {
          targetHost = addresses[0];
          tlsConfig.servername = host; // Required for TLS validation to match the certificate to the original host
          this.logger.log(`Resolved SMTP host ${host} to IPv4: ${targetHost}`);
        }
      } catch (dnsErr) {
        this.logger.warn(
          `Failed to resolve SMTP host ${host} to IPv4: ${dnsErr.message}. Falling back to default host resolution.`,
        );
      }
    }

    this.logger.log(
      `Initializing SMTP Mail Service using host: ${targetHost} (original: ${host}), port: ${port}`,
    );

    this.transporter = nodemailer.createTransport({
      host: targetHost,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: tlsConfig,
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
    await this.initializationPromise;

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
