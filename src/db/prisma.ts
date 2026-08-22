import { PrismaClient } from "@prisma/client";
import fs from "fs";

/**
 * Resolves the active PostgreSQL database URL from Cloud SQL environment variables
 * or standard DATABASE_URL with a robust fallback mechanism from Cloud SQL Unix Sockets
 * to standard TCP connection strings when running outside Google Cloud Run
 * (e.g. on Vercel, Netlify, Render, Railway, Docker, or local development).
 */
export function resolveDatabaseUrl(): string {
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION);
  const socketDir = process.env.SQL_HOST || "";
  const isUnixSocketSpecified = socketDir.startsWith("/cloudsql/") || socketDir.startsWith("/var/run/");

  // 1. Check if Cloud SQL Unix Socket is specified and actually exists on host filesystem
  if (isUnixSocketSpecified && process.env.SQL_USER && process.env.SQL_DB_NAME) {
    let socketExists = false;
    try {
      socketExists = fs.existsSync(socketDir);
    } catch (fsErr) {
      socketExists = false;
    }

    if (socketExists) {
      const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
      const pass = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "");
      const dbName = process.env.SQL_DB_NAME;
      const cloudSqlUrl = `postgresql://${user}:${pass}@localhost/${dbName}?host=${socketDir}`;
      console.log(`✅ [Database] Google Cloud Run detected. Using Cloud SQL Unix socket: ${socketDir}`);
      process.env.DATABASE_URL = cloudSqlUrl;
      return cloudSqlUrl;
    } else {
      console.log(`ℹ️ [Database] Cloud SQL Unix socket '${socketDir}' not present on host filesystem (running outside Cloud Run, e.g. Vercel/Netlify/Local).`);
    }
  }

  // 2. Locate standard TCP connection strings across common hosting platforms
  const standardTcpCandidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.POSTGRESQL_URL,
    process.env.DATABASE_DIRECT_URL
  ];

  for (const rawUrl of standardTcpCandidates) {
    if (rawUrl && typeof rawUrl === "string" && rawUrl.trim().startsWith("postgres")) {
      let cleanUrl = rawUrl.trim();
      // If DATABASE_URL contains a non-existent Unix socket query param, clean it up for TCP connection
      if (cleanUrl.includes("host=/cloudsql/")) {
        const socketPathMatch = cleanUrl.match(/host=(\/cloudsql\/[^&]+)/);
        if (socketPathMatch && !fs.existsSync(socketPathMatch[1])) {
          cleanUrl = cleanUrl.replace(/[\?&]host=\/cloudsql\/[^&]+/, "");
          if (cleanUrl.includes("?&")) cleanUrl = cleanUrl.replace("?&", "?");
        }
      }
      console.log("✅ [Database] Using standard TCP PostgreSQL connection string.");
      return cleanUrl;
    }
  }

  // 3. Construct direct TCP connection if TCP host and credentials are provided
  if (process.env.SQL_USER && process.env.SQL_DB_NAME && process.env.SQL_HOST && !process.env.SQL_HOST.startsWith("/")) {
    const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
    const pass = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "");
    const host = process.env.SQL_HOST;
    const port = process.env.SQL_PORT || "5432";
    const dbName = process.env.SQL_DB_NAME;
    const tcpUrl = `postgresql://${user}:${pass}@${host}:${port}/${dbName}?sslmode=prefer`;
    console.log(`✅ [Database] Constructed TCP connection string to ${host}:${port}/${dbName}`);
    process.env.DATABASE_URL = tcpUrl;
    return tcpUrl;
  }

  const fallbackUrl = process.env.DATABASE_URL || "";
  return fallbackUrl;
}

const dbUrl = resolveDatabaseUrl();

// Centralized Prisma Client Singleton Instance for PostgreSQL
export const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

export default prisma;


