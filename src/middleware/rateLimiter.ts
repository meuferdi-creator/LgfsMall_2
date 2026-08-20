import { prisma } from "../db/prisma.js";

/**
 * Persistent Rate Limiter Middleware backed by Database (Prisma/Redis-ready)
 * Ensures rate limiting counters survive server reboots and container restarts.
 */
export function createPersistentRateLimiter(options: {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
}) {
  const { windowMs, max, prefix, message } = options;

  return async (req: any, res: any, next: any) => {
    try {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const key = `${prefix}:${ip}:${req.user?.id || "anon"}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + windowMs);

      // Clean expired entries lazily or query active window
      const record = await prisma.rateLimitLog.findUnique({
        where: { key }
      });

      if (!record || record.expiresAt < now) {
        // Upsert new window
        await prisma.rateLimitLog.upsert({
          where: { key },
          update: { count: 1, expiresAt },
          create: { key, count: 1, expiresAt }
        });
        return next();
      }

      if (record.count >= max) {
        return res.status(429).json({
          error: message || "Trop de requêtes. Veuillez patienter avant de réessayer.",
          retryAfterMs: Math.max(0, record.expiresAt.getTime() - now.getTime())
        });
      }

      // Increment count
      await prisma.rateLimitLog.update({
        where: { key },
        data: { count: { increment: 1 } }
      });

      next();
    } catch (err) {
      console.warn("Persistent Rate Limiter fallback error:", err);
      // Fail open in case of transient DB error so non-malicious traffic isn't blocked
      next();
    }
  };
}
