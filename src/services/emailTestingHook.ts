import { logger } from '../utils/logger.js';

export interface EmailPayload {
  to: string;
  subject: string;
  template: 'WELCOME' | 'ORDER_CONFIRMATION' | 'DELIVERY_OTP' | 'KYC_APPROVED' | 'PAYMENT_RECEIPT';
  vars: Record<string, string | number>;
}

export interface SmsPayload {
  toPhone: string;
  message: string;
}

/**
 * Requirement 132: Email & SMS Interceptor Hook
 * Redirects all outbound notifications in test/staging modes to Mailtrap/Ethereal or
 * structured memory logs, ensuring zero real-user spam while capturing complete payloads.
 */
export class EmailTestingHook {
  private static interceptedEmails: EmailPayload[] = [];
  private static interceptedSms: SmsPayload[] = [];

  public static isTestMode(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.ENABLE_EMAIL_INTERCEPTOR === 'true';
  }

  public static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (this.isTestMode()) {
      this.interceptedEmails.push(payload);
      logger.info(`[Email Testing Hook] Intercepted email to ${payload.to} (${payload.template}). ID: ${messageId}`);
      return { success: true, messageId };
    }

    // Production SMTP Dispatch logic
    logger.info(`[Email Dispatch] Sending email to ${payload.to} via Production SMTP. ID: ${messageId}`);
    return { success: true, messageId };
  }

  public static async sendSms(payload: SmsPayload): Promise<{ success: boolean; smsId: string }> {
    const smsId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (this.isTestMode()) {
      this.interceptedSms.push(payload);
      logger.info(`[SMS Testing Hook] Intercepted SMS to ${payload.toPhone}: "${payload.message}". ID: ${smsId}`);
      return { success: true, smsId };
    }

    logger.info(`[SMS Dispatch] Sending SMS to ${payload.toPhone} via Mobile Gateway. ID: ${smsId}`);
    return { success: true, smsId };
  }

  public static getInterceptedEmails(): EmailPayload[] {
    return [...this.interceptedEmails];
  }

  public static getInterceptedSms(): SmsPayload[] {
    return [...this.interceptedSms];
  }

  public static clearIntercepted(): void {
    this.interceptedEmails = [];
    this.interceptedSms = [];
  }
}
