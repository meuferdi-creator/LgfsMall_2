import { PrismaClient } from "@prisma/client";

/**
 * Resolves the active PostgreSQL database URL from Cloud SQL environment variables
 * or standard DATABASE_URL.
 */
export function resolveDatabaseUrl(): string {
  if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) {
    const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
    const pass = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "");
    const dbName = process.env.SQL_DB_NAME;
    const socketDir = process.env.SQL_HOST;
    const cloudSqlUrl = `postgresql://${user}:${pass}@localhost/${dbName}?host=${socketDir}`;
    process.env.DATABASE_URL = cloudSqlUrl;
    return cloudSqlUrl;
  }
  return process.env.DATABASE_URL || "";
}

const dbUrl = resolveDatabaseUrl();

// Centralized Prisma Client Singleton Instance for PostgreSQL
export const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

export default prisma;
