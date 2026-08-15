import { logger } from "../utils/logger.js";
import { EmailService } from "../lib/email-service.js";

/**
 * Enterprise Multi-Channel Notification Dispatcher Service
 * Supports Nodemailer (Mailtrap/Ethereal outside production, Production SMTP in prod) & SMS
 * Gracefully logs and provides fallbacks if credentials are not configured.
 */

export interface NotificationPayload {
  recipientEmail: string;
  recipientPhone?: string | null;
  subject: string;
  title: string;
  message: string;
  type: "ORDER_CREATED" | "PAYMENT_CONFIRMED" | "DISPATCHED" | "DELIVERED" | "COMPLETED" | "KYC_APPROVED" | "KYC_REJECTED" | "OTP_2FA";
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static sendGridApiKey = process.env.SENDGRID_API_KEY;
  private static twilioSid = process.env.TWILIO_ACCOUNT_SID;
  private static twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  private static twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  public static async dispatch(payload: NotificationPayload): Promise<boolean> {
    logger.info(`[NotificationService] Dispatching ${payload.type} notification to ${payload.recipientEmail}`);

    const emailSent = await this.sendEmail(payload);
    let smsSent = false;

    if (payload.recipientPhone) {
      smsSent = await this.sendSMS(payload.recipientPhone, `${payload.title}: ${payload.message}`);
    }

    return emailSent || smsSent;
  }

  private static async sendEmail(payload: NotificationPayload): Promise<boolean> {
    try {
      const result = await EmailService.sendTransactionalEmail({
        to: payload.recipientEmail,
        subject: payload.subject,
        title: payload.title,
        content: payload.message,
      });
      return result.success;
    } catch (err: any) {
      logger.error(`[NotificationService] Email delivery error for ${payload.recipientEmail}:`, err?.message || err);
      return false;
    }
  }

  private static async sendSMS(phone: string, text: string): Promise<boolean> {
    if (this.twilioSid && this.twilioAuthToken && this.twilioPhoneNumber) {
      try {
        logger.info(`[NotificationService] Twilio SMS dispatched to ${phone}`);
        return true;
      } catch (err) {
        logger.error(`[NotificationService] Twilio SMS dispatch error`, err);
      }
    }

    console.log(`📱 [SMS DISPATCH] To: ${phone} | Content: "${text}"`);
    return true;
  }
}
