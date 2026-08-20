/**
 * Secure Logger with automatic sensitive data masking
 * Masks password, token, cardNumber, cvv, secret, idNumber, taxId, etc.
 */

const SENSITIVE_KEYS = [
  "password",
  "token",
  "authorization",
  "jwt",
  "secret",
  "cardnumber",
  "cvv",
  "idnumber",
  "taxid",
  "accountnumber",
  "otp",
  "code"
];

function maskValue(key: string, value: any): any {
  if (value === null || value === undefined) return value;

  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
    if (typeof value === "string") {
      if (value.length <= 4) return "****";
      return value.substring(0, 2) + "****" + value.substring(value.length - 2);
    }
    return "[REDACTED]";
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return sanitizeObject(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "object" ? sanitizeObject(item) : item));
  }

  return value;
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = maskValue(key, val);
  }
  return sanitized;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const cleanMeta = meta ? JSON.stringify(sanitizeObject(meta)) : "";
    console.log(`[INFO] [${time}] ${message} ${cleanMeta}`);
  },
  warn: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const cleanMeta = meta ? JSON.stringify(sanitizeObject(meta)) : "";
    console.warn(`[WARN] [${time}] ${message} ${cleanMeta}`);
  },
  error: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const cleanMeta = meta ? JSON.stringify(sanitizeObject(meta)) : "";
    console.error(`[ERROR] [${time}] ${message} ${cleanMeta}`);
  }
};
