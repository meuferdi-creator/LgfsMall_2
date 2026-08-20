-- Safe idempotent migration adding missing verification and reset token columns
-- Uses ALTER TABLE IF EXISTS and ADD COLUMN IF NOT EXISTS to guarantee zero data loss and safe re-execution.

ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "verificationTokenHash" TEXT;
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "verificationTokenExpiry" TIMESTAMP(3);
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "resetTokenHash" TEXT;
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

