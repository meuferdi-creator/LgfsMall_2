import crypto from "crypto";
import { prisma } from "../db/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_DEV || "c9f8a3e7b1d5f2a4e6c802495b1283d7e4f90123456789a0b1c2d3e4f5a6b7c8";

export function generateJwtToken(userId: string, role: string, issuedAtMs: number = Date.now()): string {
  const payload = JSON.stringify({
    userId,
    role,
    iat: issuedAtMs,
    exp: issuedAtMs + 24 * 60 * 60 * 1000
  });
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

export function verifyJwtToken(token: string): any {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const payloadStr = Buffer.from(payloadB64, "base64").toString("utf8");
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payloadStr).digest("hex");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé. Jeton de session absent." });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyJwtToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { kyc: true, escrowWallet: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable." });
    }

    // Point 15: Session invalidation upon password change check
    if (user.passwordChangedAt && payload.iat) {
      const passwordChangedMs = new Date(user.passwordChangedAt).getTime();
      if (payload.iat < passwordChangedMs) {
        return res.status(401).json({ error: "Votre mot de passe a été modifié. Veuillez vous reconnecter avec vos nouveaux identifiants." });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Erreur d'authentification serveur." });
  }
}
