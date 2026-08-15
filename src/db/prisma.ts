import { PrismaClient } from "@prisma/client";

// Centralized Prisma Client Singleton Instance
// Prevents connection pool explosion and SQLite lock contention
export const prisma = new PrismaClient();

export default prisma;
