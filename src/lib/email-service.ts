import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";
import { logger } from "../utils/logger.js";

/**
 * Outgoing Email Options Interface
 */
export interface EmailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  intercepted: boolean;
  environment: string;
  error?: string;
}

/**
 * Enterprise Email Service using Nodemailer
 * 
 * Rules:
 * - Outside production (development, test, staging): NO real emails are ever sent to real users.
 *   Outgoing emails are intercepted by Mailtrap (preferred) or Ethereal Email (automatic test account).
 * - In production: Uses configured production SMTP server to dispatch real emails.
 * - Credentials are read securely from server-side environment variables.
 */
export class EmailService {
  private static transporter: Transporter | null = null;
  private static etherealAccount: nodemailer.TestAccount | null = null;
  private static isInitializing = false;

  /**
   * Determine the current execution environment
   */
  public static getEnvironment(): "production" | "staging" | "test" | "development" {
    const env = (process.env.NODE_ENV || "development").toLowerCase();
    if (env === "production" || env === "prod") return "production";
    if (env === "staging" || env === "stage") return "staging";
    if (env === "test" || env === "testing") return "test";
    return "development";
  }

  public static isProduction(): boolean {
    return this.getEnvironment() === "production";
  }

  /**
   * Get default 'From' address
   */
  public static getDefaultFrom(): string {
    return process.env.SMTP_FROM || process.env.MAIL_FROM || '"LGF\'s Mall" <no-reply@lgfmall.tg>';
  }

  /**
   * Initialize or retrieve the cached Nodemailer Transporter
   */
  public static async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const env = this.getEnvironment();

    // 1. PRODUCTION MODE: Use real production SMTP configuration
    if (this.isProduction()) {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      if (host && user && pass) {
        logger.info(`[EmailService] Initializing Production SMTP transporter for host: ${host}:${port}`);
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: true,
          },
        });
        return this.transporter;
      }

      logger.warn("[EmailService] Production SMTP credentials not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD). Fallback to standard SMTP logger.");
      // In production without credentials, create a direct transport or safe fallback
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });
      return this.transporter;
    }

    // 2. NON-PRODUCTION (DEVELOPMENT, TEST, STAGING): Intercept with Mailtrap or Ethereal
    // Check for Mailtrap configuration first (Preferred)
    const mailtrapHost = process.env.MAILTRAP_HOST || process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
    const mailtrapPort = parseInt(process.env.MAILTRAP_PORT || process.env.SMTP_PORT || "2525", 10);
    const mailtrapUser = process.env.MAILTRAP_USER || (process.env.SMTP_HOST?.includes("mailtrap") ? process.env.SMTP_USER : undefined);
    const mailtrapPass = process.env.MAILTRAP_PASSWORD || (process.env.SMTP_HOST?.includes("mailtrap") ? process.env.SMTP_PASSWORD : undefined);

    if (mailtrapUser && mailtrapPass) {
      logger.info(`[EmailService] 🛡️ [DEV/TEST] Intercepting outgoing emails with Mailtrap (${mailtrapHost}:${mailtrapPort})`);
      this.transporter = nodemailer.createTransport({
        host: mailtrapHost,
        port: mailtrapPort,
        auth: {
          user: mailtrapUser,
          pass: mailtrapPass,
        },
      });
      return this.transporter;
    }

    // Check for Ethereal Email test account fallback
    try {
      if (!this.etherealAccount) {
        logger.info("[EmailService] 🛡️ [DEV/TEST] Setting up Ethereal Email sandbox test account...");
        this.etherealAccount = await nodemailer.createTestAccount();
      }

      logger.info(`[EmailService] 🛡️ [DEV/TEST] Intercepting outgoing emails with Ethereal sandbox (${this.etherealAccount.user})`);
      this.transporter = nodemailer.createTransport({
        host: this.etherealAccount.smtp.host,
        port: this.etherealAccount.smtp.port,
        secure: this.etherealAccount.smtp.secure,
        auth: {
          user: this.etherealAccount.user,
          pass: this.etherealAccount.pass,
        },
      });
      return this.transporter;
    } catch (etherealErr) {
      logger.warn("[EmailService] Could not connect to Ethereal API, falling back to local JSON stream transport:", etherealErr);
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return this.transporter;
    }
  }

  /**
   * Send an email with automatic environment safety interception
   */
  public static async sendMail(options: EmailPayload): Promise<SendEmailResult> {
    const env = this.getEnvironment();
    const isProd = this.isProduction();
    const from = options.from || this.getDefaultFrom();

    try {
      const transporter = await this.getTransporter();

      const mailOptions: SendMailOptions = {
        from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text || (options.html ? options.html.replace(/<[^>]+>/g, " ") : ""),
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      if (!isProd) {
        console.log("\n========================================================");
        console.log(`🛡️ [EMAIL INTERCEPTED - NON-PRODUCTION (${env.toUpperCase()})]`);
        console.log(`Recipient: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
        console.log(`Subject  : ${options.subject}`);
        console.log(`From     : ${from}`);
        console.log(`MessageId: ${info.messageId || "N/A"}`);
        if (previewUrl) {
          console.log(`🔗 Ethereal Preview URL: ${previewUrl}`);
        }
        console.log("========================================================\n");
      } else {
        logger.info(`[EmailService] Production email sent to ${options.to} [ID: ${info.messageId}]`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || false,
        intercepted: !isProd,
        environment: env,
      };
    } catch (error: any) {
      logger.error(`[EmailService] Failed to send email to ${options.to}:`, error?.message || error);
      return {
        success: false,
        error: error?.message || String(error),
        intercepted: !isProd,
        environment: env,
      };
    }
  }

  /**
   * Helper to send rich HTML formatted transactional messages
   */
  public static async sendTransactionalEmail(payload: {
    to: string;
    subject: string;
    title: string;
    content: string;
    actionUrl?: string;
    actionText?: string;
  }): Promise<SendEmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { background: #064e3b; padding: 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .content { padding: 32px 24px; line-height: 1.6; color: #334155; }
            .content h2 { margin-top: 0; font-size: 18px; color: #0f172a; }
            .button { display: inline-block; background: #059669; color: #ffffff !important; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { padding: 16px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LGF's Mall Togo</h1>
            </div>
            <div class="content">
              <h2>${payload.title}</h2>
              <div>${payload.content.replace(/\n/g, "<br>")}</div>
              ${payload.actionUrl && payload.actionText ? `<div style="text-align: center;"><a href="${payload.actionUrl}" class="button">${payload.actionText}</a></div>` : ""}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LGF's Mall. Tous droits réservés. Lomé, Togo.</p>
              <p>Ceci est un email transactionnel automatique sécurisé.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({
      to: payload.to,
      subject: payload.subject,
      text: `${payload.title}\n\n${payload.content}${payload.actionUrl ? `\n\nLien: ${payload.actionUrl}` : ""}`,
      html,
    });
  }
}
