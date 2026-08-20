import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Robust formatter for account creation timestamps and general UTC dates.
 * Properly converts stored database UTC ISO timestamps to localized French date display (e.g., '24 juillet 2026').
 */
export function formatAccountCreationDate(createdAt?: string | Date | null): string {
  if (!createdAt) return "Date non disponible";
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return "Date non disponible";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

/**
 * Standard date formatter for UI lists, order records, and KYC reviews.
 */
export function formatUtcDate(
  date?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
): string {
  if (!date) return "Date non disponible";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Date non disponible";
  return d.toLocaleDateString("fr-FR", {
    ...options,
    timeZone: options.timeZone || "UTC"
  });
}

/**
 * Standard currency formatter for FCFA / XOF.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-TG", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0
  }).format(amount || 0).replace("XOF", "F CFA");
}

/**
 * Safely parse JSON from a fetch Response, preventing '<!doctype' HTML syntax crash errors.
 */
export async function safeJson<T = any>(res: Response): Promise<T | null> {
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && (contentType.includes("application/json") || contentType.includes("json"))) {
      return await res.json();
    }
    const text = await res.text();
    if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
      return JSON.parse(text);
    }
    return null;
  } catch {
    return null;
  }
}
