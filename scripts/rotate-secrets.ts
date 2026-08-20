import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * Script to generate high-entropy new secrets for JWT and API keys.
 * Usage: npx tsx scripts/rotate-secrets.ts
 */
function rotateSecrets() {
  console.log("🔐 Generating new cryptographically secure secrets...");

  const newJwtSecret = crypto.randomBytes(48).toString("hex");
  const newSessionKey = crypto.randomBytes(32).toString("hex");

  console.log("\n========================================================");
  console.log("🔑 NEW JWT_SECRET (copy to environment / secret manager):");
  console.log(newJwtSecret);
  console.log("========================================================\n");

  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, "utf8");
    if (content.includes("JWT_SECRET=")) {
      content = content.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${newJwtSecret}`);
    } else {
      content += `\nJWT_SECRET=${newJwtSecret}\n`;
    }
    fs.writeFileSync(envPath, content);
    console.log("✅ Updated .env file with new JWT_SECRET");
  }

  console.log("⚠️ NOTE: After rotating JWT_SECRET, all active user tokens will be invalidated automatically, forcing users to re-authenticate securely.");
}

rotateSecrets();
