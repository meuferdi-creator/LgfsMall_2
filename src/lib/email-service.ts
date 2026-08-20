import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";
import { MailtrapClient } from "mailtrap";
import { logger } from "../utils/logger.js";

/**
 * Outgoing Email Options Interface
 */
export interface EmailPayload {
  to: string | string[] | Array<{ email: string; name?: string }>;
  subject: string;
  text?: string;
  html?: string;
  from?: string | { email: string; name?: string };
  replyTo?: string;
  category?: string;
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
  service?: "mailtrap-sdk" | "nodemailer-smtp" | "nodemailer-ethereal" | "nodemailer-stream";
  error?: string;
}

/**
 * Enterprise Email Service using Mailtrap SDK & Nodemailer
 * 
 * Capabilities:
 * - Direct Mailtrap API dispatch via official 'mailtrap' SDK (MailtrapClient) when MAILTRAP_TOKEN / MAILTRAP_API_TOKEN is provided.
 *   Check your sent email logs at: https://mailtrap.io/sending/email_logs
 * - Outside production (development, test, staging): Outgoing emails are intercepted safely via Mailtrap or Ethereal Email.
 * - In production: Uses Mailtrap SDK or configured production SMTP server to dispatch real emails.
 * - All secrets and configurations are managed securely via server-side environment variables.
 */
export class EmailService {
  private static mailtrapClient: MailtrapClient | null = null;
  private static transporter: Transporter | null = null;
  private static etherealAccount: nodemailer.TestAccount | null = null;

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
  public static getDefaultFrom(): { email: string; name: string } {
    const defaultEmail = process.env.MAILTRAP_SENDER_EMAIL || process.env.SMTP_FROM_EMAIL || "hello@demomailtrap.co";
    const defaultName = process.env.MAILTRAP_SENDER_NAME || process.env.SMTP_FROM_NAME || "LGF's Mall";
    return {
      email: defaultEmail,
      name: defaultName,
    };
  }

  /**
   * Retrieve or initialize the Mailtrap SDK Client instance
   */
  public static getMailtrapClient(): MailtrapClient | null {
    const token = process.env.MAILTRAP_TOKEN || process.env.MAILTRAP_API_TOKEN;
    if (!token) {
      return null;
    }

    if (!this.mailtrapClient) {
      logger.info("[EmailService] Initializing MailtrapClient SDK with API token");
      this.mailtrapClient = new MailtrapClient({
        token,
      });
    }

    return this.mailtrapClient;
  }

  /**
   * Parse sender details helper
   */
  private static parseSender(from?: string | { email: string; name?: string }): { email: string; name: string } {
    if (!from) {
      return this.getDefaultFrom();
    }
    if (typeof from === "object") {
      return {
        email: from.email,
        name: from.name || "LGF's Mall",
      };
    }
    // Parse "Name <email@domain.com>" or "email@domain.com"
    const match = from.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
    if (match) {
      return {
        name: match[1]?.trim() || "LGF's Mall",
        email: match[2]?.trim() || from,
      };
    }
    return {
      email: from.trim(),
      name: "LGF's Mall",
    };
  }

  /**
   * Parse recipients into Mailtrap-compatible recipient objects
   */
  private static parseRecipients(to: string | string[] | Array<{ email: string; name?: string }>): Array<{ email: string; name?: string }> {
    if (Array.isArray(to)) {
      return to.map((item) => {
        if (typeof item === "string") {
          return { email: item.trim() };
        }
        return item;
      });
    }
    return to.split(",").map((email) => ({ email: email.trim() }));
  }

  /**
   * Initialize or retrieve the cached Nodemailer Transporter (for SMTP / Ethereal fallback)
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

      logger.warn("[EmailService] Production SMTP credentials not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD). Fallback to standard stream transport.");
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });
      return this.transporter;
    }

    // 2. NON-PRODUCTION (DEVELOPMENT, TEST, STAGING): Intercept with Mailtrap Sandbox or Ethereal
    const isLiveMailtrap = (process.env.MAILTRAP_HOST || process.env.SMTP_HOST || "").includes("live.smtp.mailtrap.io");
    const mailtrapHost = process.env.MAILTRAP_HOST || (isLiveMailtrap ? "sandbox.smtp.mailtrap.io" : process.env.SMTP_HOST) || "sandbox.smtp.mailtrap.io";
    const mailtrapPort = parseInt(process.env.MAILTRAP_PORT || "2525", 10);
    const mailtrapUser = process.env.MAILTRAP_USER && !isLiveMailtrap ? process.env.MAILTRAP_USER : undefined;
    const mailtrapPass = process.env.MAILTRAP_PASSWORD && !isLiveMailtrap ? process.env.MAILTRAP_PASSWORD : undefined;

    if (mailtrapUser && mailtrapPass) {
      logger.info(`[EmailService] 🛡️ [DEV/TEST] Intercepting outgoing emails with Mailtrap Sandbox (${mailtrapHost}:${mailtrapPort})`);
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

    // Fallback to Ethereal Email test account sandbox
    try {
      if (!this.etherealAccount) {
        this.etherealAccount = await nodemailer.createTestAccount();
      }

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
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return this.transporter;
    }
  }

  /**
   * Send an email using Mailtrap SDK (preferred when API token is configured) or Nodemailer
   */
  public static async sendMail(options: EmailPayload): Promise<SendEmailResult> {
    const env = this.getEnvironment();
    const isProd = this.isProduction();
    const sender = this.parseSender(options.from);
    const recipients = this.parseRecipients(options.to);
    const recipientEmails = recipients.map((r) => r.email).join(", ");

    // 1. If Mailtrap API Token is configured, try the official MailtrapClient SDK
    const mailtrapClient = this.getMailtrapClient();
    if (mailtrapClient) {
      try {
        const response = await mailtrapClient.send({
          from: sender,
          to: recipients,
          subject: options.subject,
          text: options.text || (options.html ? options.html.replace(/<[^>]+>/g, " ") : ""),
          html: options.html,
          category: options.category || "Transactional Email",
        });

        const messageId = response?.message_ids?.[0] || (response as any)?.message_id || "mailtrap-sent";

        console.log("\n========================================================");
        console.log(`✉️ [MAILTRAP EMAIL SENT] (${env.toUpperCase()})`);
        console.log(`Recipient(s): ${recipientEmails}`);
        console.log(`Subject     : ${options.subject}`);
        console.log(`From        : ${sender.name} <${sender.email}>`);
        console.log(`MessageId   : ${messageId}`);
        console.log(`📊 Check email logs: https://mailtrap.io/sending/email_logs`);
        console.log("========================================================\n");

        return {
          success: true,
          messageId,
          intercepted: !isProd,
          environment: env,
          service: "mailtrap-sdk",
        };
      } catch (mailtrapError: any) {
        const isDemoRestriction = mailtrapError?.message?.includes("Demo domains can only be used to send emails to account owners");
        if (isDemoRestriction) {
          logger.info(`[EmailService] ℹ️ Mailtrap demo domain active: routing development email for ${recipientEmails} to local test sandbox.`);
        } else if (isProd) {
          logger.error(`[EmailService] Mailtrap SDK send error:`, mailtrapError?.message || mailtrapError);
        }
        // Gracefully fall back to Nodemailer transporter below
      }
    }

    // 2. Fallback to Nodemailer Transporter
    try {
      const transporter = await this.getTransporter();
      const fromString = `"${sender.name}" <${sender.email}>`;

      const mailOptions: SendMailOptions = {
        from: fromString,
        to: recipientEmails,
        subject: options.subject,
        text: options.text || (options.html ? options.html.replace(/<[^>]+>/g, " ") : ""),
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      let info;
      try {
        info = await transporter.sendMail(mailOptions);
      } catch (sendErr: any) {
        // If SMTP auth failed in non-production, seamlessly fall back to Ethereal sandbox
        if (!isProd) {
          this.transporter = null;
          this.etherealAccount = await nodemailer.createTestAccount();
          const etherealTransporter = nodemailer.createTransport({
            host: this.etherealAccount.smtp.host,
            port: this.etherealAccount.smtp.port,
            secure: this.etherealAccount.smtp.secure,
            auth: {
              user: this.etherealAccount.user,
              pass: this.etherealAccount.pass,
            },
          });
          info = await etherealTransporter.sendMail(mailOptions);
        } else {
          throw sendErr;
        }
      }

      const previewUrl = nodemailer.getTestMessageUrl(info);

      if (!isProd) {
        console.log("\n========================================================");
        console.log(`🛡️ [EMAIL INTERCEPTED - NON-PRODUCTION (${env.toUpperCase()})]`);
        console.log(`Recipient: ${recipientEmails}`);
        console.log(`Subject  : ${options.subject}`);
        console.log(`From     : ${fromString}`);
        console.log(`MessageId: ${info.messageId || "N/A"}`);
        if (previewUrl) {
          console.log(`🔗 Ethereal Preview URL: ${previewUrl}`);
        }
        console.log("========================================================\n");
      } else {
        logger.info(`[EmailService] Production email sent to ${recipientEmails} [ID: ${info.messageId}]`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || false,
        intercepted: !isProd,
        environment: env,
        service: previewUrl ? "nodemailer-ethereal" : "nodemailer-smtp",
      };
    } catch (error: any) {
      logger.error(`[EmailService] Failed to send email to ${recipientEmails}:`, error?.message || error);
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
    to: string | string[];
    subject: string;
    title: string;
    content: string;
    actionUrl?: string;
    actionText?: string;
    category?: string;
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
      category: payload.category || "Transactional",
    });
  }
}

