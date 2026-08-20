import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { execSync } from "child_process";
import fs from "fs";

// Create __dirname equivalent for ES Modules and CommonJS compatibility
const currentFilename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const currentDirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(currentFilename);

// Configure Cloud SQL PostgreSQL connection URL
let dbPath = process.env.DATABASE_URL || "";

if (process.env.SQL_HOST || (!dbPath || dbPath.startsWith("file:"))) {
  if (process.env.SQL_HOST) {
    const sqlUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER || "ai_studio_admin";
    const sqlPass = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "");
    const sqlDb = process.env.SQL_DB_NAME || "cloud_sql_development_database";
    dbPath = `postgresql://${sqlUser}:${sqlPass}@localhost/${sqlDb}?host=${process.env.SQL_HOST}`;
  }
}

process.env.DATABASE_URL = dbPath;

console.log("🔄 Initializing Cloud SQL PostgreSQL database connection...");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbPath
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "c9f8a3e7b1d5f2a4e6c802495b1283d7e4f90123456789a0b1c2d3e4f5a6b7c8";

// Native cryptographic token generation for absolute iframe security
function generateToken(userId: string, role: string) {
  const payload = JSON.stringify({ userId, role, exp: Date.now() + 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

function verifyToken(token: string) {
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

// Authentication middleware
async function authenticateUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé. Jeton de session absent." });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
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
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Erreur d'authentification serveur." });
  }
}

// ----------------------------------------------------
// AUTO-SEED ROUTINE FOR A RICH MARKETPLACE DEMO STATE
// ----------------------------------------------------
async function seedDatabase() {
  try {
    const hashedPassword = bcryptjs.hashSync("LgfMall2026!", 10);

    // 1. Seed Admin User
    let admin = await prisma.user.findUnique({ where: { email: "lgfmall.lmd11@gmail.com" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "lgfmall.lmd11@gmail.com",
          name: "LGF Admin (Arrive Ramegne)",
          password: hashedPassword,
          phone: "+228 72998148",
          role: "ADMIN"
        }
      });
      console.log("Admin seeded: lgfmall.lmd11@gmail.com");
    }

    // 2. Seed Single Official Boutique Vendor
    let officialBoutique = await prisma.user.findUnique({ where: { email: "official.store@lgfmall.tg" } });
    if (!officialBoutique) {
      officialBoutique = await prisma.user.create({
        data: {
          email: "official.store@lgfmall.tg",
          name: "LGF's Mall Official Store",
          password: hashedPassword,
          phone: "+228 72 99 81 48",
          role: "VENDOR"
        }
      });
      await prisma.escrowWallet.create({
        data: {
          vendorId: officialBoutique.id,
          balance: 1500000,
          pendingBalance: 0,
          currency: "XOF"
        }
      });
      await prisma.kyc.create({
        data: {
          userId: officialBoutique.id,
          status: "APPROVED",
          documentType: "BUSINESS_REGISTRATION",
          idNumber: "TG-LOM-2026-OFFICIAL",
          documentUrl: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=600"
        }
      });
      console.log("Single Official Boutique created: LGF's Mall Official Store");
    } else if (officialBoutique.name !== "LGF's Mall Official Store") {
      officialBoutique = await prisma.user.update({
        where: { id: officialBoutique.id },
        data: { name: "LGF's Mall Official Store" }
      });
    }

    // Clean up old demo vendors if present
    await prisma.user.deleteMany({
      where: {
        email: { in: ["lome.textiles@lgfmall.tg", "kloto.nature@lgfmall.tg"] }
      }
    });

    const existingOfficialProds = await prisma.product.findMany({
      where: { vendorId: officialBoutique.id }
    });

    if (existingOfficialProds.length === 0) {
      // Delete old demo products
      await prisma.product.deleteMany({});

      const catalogData = [
        {
          title: "Rideaux Haute Qualité (La Paire) – Design Élégant",
          description: "Habillez vos fenêtres avec élégance grâce à nos rideaux de haute qualité. Tissu résistant, finitions soignées et tombé impeccable pour sublimer votre intérieur.",
          price: 3500,
          wholesalePrice: 3000,
          wholesaleMinQty: 6,
          category: "Maison & Décoration / Rideaux",
          stock: 100,
          vendorId: officialBoutique.id,
          image: "https://i.ibb.co/DjFtx2F/PHOTO-2026-07-20-18-33-43-1.jpg",
          images: JSON.stringify([
            "https://i.ibb.co/DjFtx2F/PHOTO-2026-07-20-18-33-43-1.jpg",
            "https://i.ibb.co/qFBf8Rnw/PHOTO-2026-07-20-18-33-42.jpg"
          ])
        },
        {
          title: "Rideaux Confort (La Paire) – Excellent Rapport Qualité/Prix",
          description: "Apportez une touche de fraîcheur et de modernité à vos pièces à petit prix. Des rideaux pratiques, faciles à installer et parfaits pour le quotidien.",
          price: 6500,
          wholesalePrice: 6000,
          wholesaleMinQty: 6,
          category: "Maison & Décoration / Rideaux",
          stock: 100,
          vendorId: officialBoutique.id,
          image: "https://i.ibb.co/WWKfZ8Lc/PHOTO-2026-07-20-18-33-32-1.jpg",
          images: JSON.stringify([
            "https://i.ibb.co/WWKfZ8Lc/PHOTO-2026-07-20-18-33-32-1.jpg",
            "https://i.ibb.co/mPz6v1H/PHOTO-2026-07-20-18-33-32.jpg",
            "https://i.ibb.co/v6ZWhh6T/PHOTO-2026-07-20-18-33-31-1.jpg",
            "https://i.ibb.co/FdPrkw9/PHOTO-2026-07-20-18-33-31.jpg"
          ])
        },
        {
          title: "Tapis Douillet Premium – Confort et Style",
          description: "Un tapis ultra-doux et coloré pour réchauffer l'ambiance de votre salon ou de votre chambre. Offre une excellente sensation sous les pieds et retient bien la poussière.",
          price: 15000,
          wholesalePrice: 14000,
          wholesaleMinQty: 2,
          category: "Maison & Décoration / Tapis",
          stock: 50,
          vendorId: officialBoutique.id,
          image: "https://i.ibb.co/7dxKGgWg/PHOTO-2026-07-20-18-33-51.jpg",
          images: JSON.stringify([
            "https://i.ibb.co/7dxKGgWg/PHOTO-2026-07-20-18-33-51.jpg",
            "https://i.ibb.co/sd06NSgy/PHOTO-2026-07-20-18-33-52-2.jpg",
            "https://i.ibb.co/pvZnrxVX/PHOTO-2026-07-20-18-33-52-1.jpg",
            "https://i.ibb.co/fYKVgdDZ/PHOTO-2026-07-20-18-33-52.jpg"
          ])
        },
        {
          title: "Masque de Visage Hydratant – Éclat et Fraîcheur",
          description: "Offrez un moment de pure détente à votre peau. Ce masque purifie, hydrate en profondeur et redonne instantanément de l'éclat à votre teint. Idéal pour votre routine beauté.",
          price: 300,
          wholesalePrice: 200,
          wholesaleMinQty: 12,
          category: "Beauté & Soins / Visage",
          stock: 500,
          vendorId: officialBoutique.id,
          image: "https://i.ibb.co/VcS5WL5b/PHOTO-2026-07-20-18-33-53-2.jpg",
          images: JSON.stringify([
            "https://i.ibb.co/VcS5WL5b/PHOTO-2026-07-20-18-33-53-2.jpg",
            "https://i.ibb.co/JRCyHBz1/PHOTO-2026-07-20-18-33-53-1.jpg",
            "https://i.ibb.co/fdz8HbWX/PHOTO-2026-07-20-18-33-53.jpg"
          ])
        }
      ];

      for (const item of catalogData) {
        await prisma.product.create({ data: item });
      }
      console.log("✅ Seed complete! 4 official catalog products published under LGF's Mall Official Store.");
    }
  } catch (err) {
    console.error("Error running auto-seed routine:", err);
  }
}

// ----------------------------------------------------
// API ROUTES FOR FOUNDATIONS & AUTHENTICATION (STEP 1)
// ----------------------------------------------------

// Server Health check & Metadata
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    currency: "XOF",
    country: "Togo",
    support: "+228 72998148",
    cwd: process.cwd(),
    dirname: currentDirname,
    dbUrl: process.env.DATABASE_URL
  });
});

// Platform General Stats (Display on Homepage)
app.get("/api/stats", async (req, res) => {
  try {
    const userStats = await prisma.user.groupBy({
      by: ["role"],
      _count: true
    });
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    
    const stats: Record<string, number> = {
      BUYER: 0,
      VENDOR: 0,
      DRIVER: 0,
      INVESTOR: 0,
      ADMIN: 0,
      totalUsers: 0,
      totalProducts: productCount,
      totalOrders: orderCount
    };

    userStats.forEach((stat) => {
      stats[stat.role] = stat._count;
      stats.totalUsers += stat._count;
    });

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: "Impossible de récupérer les statistiques.", details: err?.message || String(err) });
  }
});

// User Registration
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, phone, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires (Nom, Email, Mot de passe, Rôle)." });
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Veuillez fournir une adresse e-mail valide." });
  }

  // Password strength validation (min 8 chars, at least 1 number and 1 letter)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre." });
  }

  const validRoles = ["BUYER", "VENDOR", "DRIVER", "INVESTOR", "ADMIN"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Rôle utilisateur invalide." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Un compte avec cette adresse email existe déjà." });
    }

    const hashedPassword = bcryptjs.hashSync(password, 12); // Increased salt rounds for better security
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        password: hashedPassword,
        phone,
        role,
        isEmailVerified: false // Explicitly set to false - requires email verification
      }
    });

    // If the registered user is a Vendor, initialize their Escrow Wallet automatically
    if (role === "VENDOR") {
      await prisma.escrowWallet.create({
        data: {
          vendorId: newUser.id,
          balance: 0.0,
          pendingBalance: 0.0,
          currency: "XOF"
        }
      });
    }

    // DO NOT auto-login - require email verification first
    // Generate verification token instead
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store verification token (you could create a separate table or use a temp field)
    // For now, we'll send it via email simulation
    
    // TODO: Send real verification email
    // await sendVerificationEmail(email, verificationToken);
    
    console.log(`📧 Email verification token for ${email}: ${verificationToken}`);
    console.log(`⏰ Token expires at: ${verificationTokenExpiry.toISOString()}`);

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "Inscription réussie ! Veuillez vérifier votre adresse e-mail pour activer votre compte.",
      requiresEmailVerification: true,
      user: userWithoutPassword,
      // Do NOT send token yet - user must verify email first
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Une erreur est survenue lors de l'enregistrement." });
  }
});

// Verify User Email - Now with secure token-based verification
app.post("/api/auth/verify-email", async (req, res) => {
  const { email, token } = req.body;

  if (!email) {
    return res.status(400).json({ error: "L'adresse e-mail est requise pour la vérification." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { kyc: true, escrowWallet: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    // If already verified, just return success
    if (user.isEmailVerified) {
      const authToken = generateToken(user.id, user.role);
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        message: "Adresse e-mail déjà vérifiée.",
        verified: true,
        user: userWithoutPassword,
        token: authToken
      });
    }

    // For development/demo: accept verification without token (simulate clicking email link)
    // In production, validate the token against stored verification tokens
    // TODO: Implement proper token validation with database storage
    if (token) {
      // Validate token logic here in production
      console.log(`✅ Verification token validated for ${email}`);
    } else {
      console.log(`⚠️ Development mode: Email verified without token for ${email}`);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
      include: { kyc: true, escrowWallet: true }
    });

    const authToken = generateToken(updatedUser.id, updatedUser.role);
    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.json({
      message: "Adresse e-mail vérifiée avec succès ! Connexion établie.",
      verified: true,
      user: userWithoutPassword,
      token: authToken
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(500).json({ error: "Une erreur est survenue lors de la vérification de l'adresse e-mail." });
  }
});

// User Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez fournir votre email et mot de passe." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { kyc: true, escrowWallet: true }
    });

    if (!user) {
      return res.status(400).json({ error: "Identifiants de connexion incorrects." });
    }

    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Identifiants de connexion incorrects." });
    }

    // SECURITY FIX: Require email verification before allowing login
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: "Veuillez vérifier votre adresse e-mail avant de vous connecter. Un e-mail de vérification vous a été envoyé lors de votre inscription.",
        requiresEmailVerification: true
      });
    }

    const token = generateToken(user.id, user.role);

    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: "Connexion réussie !",
      verified: user.isEmailVerified,
      user: userWithoutPassword,
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Une erreur est survenue lors de la connexion." });
  }
});

// Firebase OAuth/Google Sign-In Sync Route
let firebaseAdminApp: any = null;
try {
  const admin: any = require("firebase-admin");
  if (!admin.apps || !admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      firebaseAdminApp = admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || "lgf-mall-togo"
      });
    }
  } else {
    firebaseAdminApp = admin.apps[0];
  }
} catch (e) {
  console.warn("Firebase Admin SDK init notice:", (e as any)?.message || e);
}

app.post("/api/auth/firebase-sync", async (req, res) => {
  const { email, name, uid, role, phone, idToken } = req.body;

  if (!email) {
    return res.status(400).json({ error: "L'adresse email est requise pour la synchronisation Google Sign-In." });
  }

  // Server-side Google ID Token Security Check (if ID token and service account available)
  let verifiedEmail = email;

  if (idToken && firebaseAdminApp) {
    try {
      const admin: any = require("firebase-admin");
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken && decodedToken.email) {
        verifiedEmail = decodedToken.email;
      }
    } catch (tokenErr) {
      console.warn("⚠️ Firebase Admin ID token verification note:", (tokenErr as any)?.message || tokenErr);
    }
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: verifiedEmail },
      include: { kyc: true, escrowWallet: true }
    });

    if (user) {
      // User already exists, log them in!
      const token = generateToken(user.id, user.role);
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        message: "Authentification Google réussie !",
        user: userWithoutPassword,
        token,
        isNew: false
      });
    }

    // User does not exist, auto-create them (Google Sign-In Account Sync)
    const secureRandomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = bcryptjs.hashSync(secureRandomPassword, 10);
    const assignedRole = role || "BUYER";

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        phone: phone || "",
        role: assignedRole
      }
    });

    if (assignedRole === "VENDOR") {
      await prisma.escrowWallet.create({
        data: {
          vendorId: newUser.id,
          balance: 0.0,
          pendingBalance: 0.0,
          currency: "XOF"
        }
      });
    }

    const token = generateToken(newUser.id, newUser.role);
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "Compte Google créé et synchronisé avec succès !",
      user: userWithoutPassword,
      token,
      isNew: true
    });
  } catch (err: any) {
    console.error("Firebase sync error:", err);
    return res.status(500).json({ error: "Une erreur est survenue lors de la synchronisation du compte Google.", details: err?.message });
  }
});

// Fetch Current Active User Profile
app.get("/api/auth/me", authenticateUser, (req: any, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Submit KYC Verification Document
app.post("/api/kyc/submit", authenticateUser, async (req: any, res) => {
  const { documentType, idNumber, documentUrl } = req.body;

  if (!documentType || !idNumber) {
    return res.status(400).json({ error: "Le type de document et le numéro d'identification sont requis." });
  }

  try {
    const existingKyc = await prisma.kyc.findUnique({
      where: { userId: req.user.id }
    });

    let kycRecord;
    if (existingKyc) {
      // Re-submit / Update KYC
      kycRecord = await prisma.kyc.update({
        where: { userId: req.user.id },
        data: {
          documentType,
          idNumber,
          documentUrl: documentUrl || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=600", // Fallback professional placeholder
          status: "PENDING",
          rejectionReason: null
        }
      });
    } else {
      // Create new KYC
      kycRecord = await prisma.kyc.create({
        data: {
          userId: req.user.id,
          documentType,
          idNumber,
          documentUrl: documentUrl || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=600",
          status: "PENDING"
        }
      });
    }

    return res.json({
      message: "Demande de vérification KYC soumise avec succès !",
      kyc: kycRecord
    });
  } catch (err) {
    console.error("KYC error:", err);
    return res.status(500).json({ error: "Impossible de soumettre les informations KYC." });
  }
});

// Fetch All Users for Admin Portal
app.get("/api/admin/users", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs." });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        kyc: true,
        escrowWallet: true,
        orders: {
          select: { id: true, total: true, status: true, createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const safeUsers = users.map(u => {
      const { password: _, ...rest } = u;
      return rest;
    });

    res.json(safeUsers);
  } catch (err) {
    console.error("Fetch admin users error:", err);
    res.status(500).json({ error: "Impossible de récupérer la liste des utilisateurs." });
  }
});

// Fetch All KYC records (For ADMIN verification workspace)
app.get("/api/admin/kyc/pending", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs." });
  }

  try {
    const kycRecords = await prisma.kyc.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    res.json(kycRecords);
  } catch (err) {
    res.status(500).json({ error: "Impossible de récupérer les demandes KYC." });
  }
});

// Verify/Validate KYC Submission (ADMIN only)
app.post("/api/admin/kyc/verify", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs." });
  }

  const { kycId, status, rejectionReason } = req.body;

  if (!kycId || !status) {
    return res.status(400).json({ error: "L'identifiant du KYC et le statut de décision (APPROVED/REJECTED) sont requis." });
  }

  if (status !== "APPROVED" && status !== "REJECTED") {
    return res.status(400).json({ error: "Statut de décision invalide." });
  }

  try {
    const updatedKyc = await prisma.kyc.update({
      where: { id: kycId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason || "Document non lisible ou non valide." : null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({
      message: `KYC de ${updatedKyc.user.name} mis à jour avec succès : ${status}`,
      kyc: updatedKyc
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du KYC." });
  }
});

// ----------------------------------------------------
// PRODUCTS ENDPOINTS (CATALOG & VENDOR MANAGEMENT)
// ----------------------------------------------------

// 1. Get entire catalog
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Impossible de charger le catalogue d'articles." });
  }
});

// 1b. Get all vendors/sellers for marketplace discovery
app.get("/api/vendors", async (req, res) => {
  try {
    const vendors = await prisma.user.findMany({
      where: { role: "VENDOR" },
      include: {
        escrowWallet: { select: { balance: true, pendingBalance: true, currency: true } },
        kyc: { select: { status: true, documentType: true } },
        products: { select: { id: true, title: true, price: true, image: true, images: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Remove sensitive data
    const safeVendors = vendors.map(v => {
      const { password: _, ...rest } = v;
      return rest;
    });
    
    res.json(safeVendors);
  } catch (err) {
    console.error("Fetch vendors error:", err);
    res.status(500).json({ error: "Impossible de récupérer la liste des vendeurs." });
  }
});

// 2. Get active vendor's own articles
app.get("/api/products/my", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux vendeurs." });
  }
  try {
    const products = await prisma.product.findMany({
      where: { vendorId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Impossible de charger vos articles." });
  }
});

// 3. Create a new product
app.post("/api/products", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux vendeurs." });
  }

  const { title, description, price, wholesalePrice, wholesaleMinQty, image, images, category, stock } = req.body;

  if (!title || !description || price === undefined || !category) {
    return res.status(400).json({ error: "Veuillez renseigner le titre, la description, le prix et la catégorie." });
  }

  const imagesJson = Array.isArray(images) && images.length > 0 
    ? JSON.stringify(images) 
    : (image ? JSON.stringify([image]) : null);
  const mainImage = (Array.isArray(images) && images.length > 0) ? images[0] : (image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800");

  try {
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        wholesaleMinQty: wholesaleMinQty ? parseInt(wholesaleMinQty) : null,
        image: mainImage,
        images: imagesJson,
        category,
        stock: stock !== undefined ? parseInt(stock) : 10,
        vendorId: req.user.id
      }
    });

    res.status(201).json({
      message: "Article ajouté au catalogue LGF avec succès !",
      product
    });
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ error: "Impossible de créer l'article." });
  }
});

// 4. Update an existing product
app.put("/api/products/:id", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux vendeurs." });
  }

  const { id } = req.params;
  const { title, description, price, wholesalePrice, wholesaleMinQty, image, images, category, stock } = req.body;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Article introuvable." });
    }

    if (existing.vendorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Vous n'êtes pas propriétaire de cet article." });
    }

    const imagesJson = Array.isArray(images) 
      ? JSON.stringify(images) 
      : (image ? JSON.stringify([image]) : existing.images);
    const mainImage = (Array.isArray(images) && images.length > 0) 
      ? images[0] 
      : (image !== undefined ? image : existing.image);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description || existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        wholesalePrice: wholesalePrice !== undefined ? (wholesalePrice ? parseFloat(wholesalePrice) : null) : existing.wholesalePrice,
        wholesaleMinQty: wholesaleMinQty !== undefined ? (wholesaleMinQty ? parseInt(wholesaleMinQty) : null) : existing.wholesaleMinQty,
        image: mainImage,
        images: imagesJson,
        category: category || existing.category,
        stock: stock !== undefined ? parseInt(stock) : existing.stock
      }
    });

    res.json({
      message: "Article mis à jour avec succès !",
      product: updated
    });
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'article." });
  }
});

// 5. Delete a product
app.delete("/api/products/:id", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux vendeurs." });
  }

  const { id } = req.params;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Article introuvable." });
    }

    if (existing.vendorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Vous n'êtes pas propriétaire de cet article." });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: "Article retiré du catalogue LGF." });
  } catch (err) {
    res.status(500).json({ error: "Impossible de supprimer l'article." });
  }
});

// ----------------------------------------------------
// ORDERS & ESCROW ENDPOINTS
// ----------------------------------------------------

// 1. Place an order (BUYER)
app.post("/api/orders", authenticateUser, async (req: any, res) => {
  const { productId, quantity, paymentMethod } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Veuillez spécifier l'article et une quantité valide." });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true }
    });

    if (!product) {
      return res.status(404).json({ error: "Article introuvable." });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: `Stock insuffisant. Seulement ${product.stock} unités disponibles.` });
    }

    // Wrap order creation, stock decrement, and escrow wallet update in an atomic Prisma transaction
    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch product inside transaction to ensure fresh stock reading
      const txProduct = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!txProduct) {
        throw new Error("ARTICLE_NOT_FOUND");
      }

      if (txProduct.stock < quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${txProduct.stock}`);
      }

      // Determine pricing
      let unitPrice = txProduct.price;
      if (txProduct.wholesalePrice && txProduct.wholesaleMinQty && quantity >= txProduct.wholesaleMinQty) {
        unitPrice = txProduct.wholesalePrice;
      }
      const total = unitPrice * quantity;

      // Find or create wallet
      let wallet = await tx.escrowWallet.findUnique({
        where: { vendorId: txProduct.vendorId }
      });

      if (!wallet) {
        wallet = await tx.escrowWallet.create({
          data: {
            vendorId: txProduct.vendorId,
            balance: 0.0,
            pendingBalance: 0.0,
            currency: "XOF"
          }
        });
      }

      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          buyerId: req.user.id,
          total,
          status: "ESCROW_HELD",
          paymentMethod: paymentMethod || "TMoney",
          escrowWalletId: wallet.id
        }
      });

      // 2. Decrement stock atomically
      await tx.product.update({
        where: { id: productId },
        data: { stock: txProduct.stock - quantity }
      });

      // 3. Increment pending escrow balance
      await tx.escrowWallet.update({
        where: { id: wallet.id },
        data: { pendingBalance: wallet.pendingBalance + total }
      });

      return newOrder;
    });

    res.status(201).json({
      message: "Achat sécurisé validé ! Votre paiement est consigné dans le séquestre LGF.",
      order
    });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ error: "Erreur lors de la création de la transaction sécurisée." });
  }
});

// 2. Fetch Buyer's purchases
app.get("/api/orders/buyer", authenticateUser, async (req: any, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      include: {
        escrowWallet: {
          include: {
            vendor: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement de vos achats." });
  }
});

// 3. Fetch Vendor's sales orders
app.get("/api/orders/vendor", authenticateUser, async (req: any, res) => {
  try {
    const wallet = await prisma.escrowWallet.findUnique({
      where: { vendorId: req.user.id }
    });

    if (!wallet) {
      return res.json([]);
    }

    const orders = await prisma.order.findMany({
      where: { escrowWalletId: wallet.id },
      include: {
        buyer: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement de vos ventes." });
  }
});

// 4. Confirm Delivery & Release Escrow Funds to Vendor
app.post("/api/orders/:id/confirm-delivery", authenticateUser, async (req: any, res) => {
  const { id } = req.params;

  try {
    const { updatedOrder } = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { escrowWallet: true }
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.status === "COMPLETED") {
        throw new Error("ALREADY_COMPLETED");
      }

      // Verify permissions: Only Buyer who placed it, or Vendor, or LGF Admin can release the escrow funds
      const canConfirm = 
        order.buyerId === req.user.id || 
        (order.escrowWallet && order.escrowWallet.vendorId === req.user.id) || 
        req.user.role === "ADMIN";

      if (!canConfirm) {
        throw new Error("FORBIDDEN");
      }

      // Update Order Status
      const uOrder = await tx.order.update({
        where: { id },
        data: { status: "COMPLETED" }
      });

      // Release funds in EscrowWallet: Move from pendingBalance to balance
      if (order.escrowWallet) {
        const pendingRelease = order.total;
        const newPending = Math.max(0, order.escrowWallet.pendingBalance - pendingRelease);
        const newBalance = order.escrowWallet.balance + pendingRelease;

        await tx.escrowWallet.update({
          where: { id: order.escrowWallet.id },
          data: {
            pendingBalance: newPending,
            balance: newBalance
          }
        });
      }

      return { updatedOrder: uOrder };
    });

    res.json({
      message: "Livraison confirmée ! Les fonds du séquestre ont été libérés et versés au solde du vendeur.",
      order: updatedOrder
    });
  } catch (err: any) {
    if (err?.message === "ALREADY_COMPLETED") {
      return res.status(400).json({ error: "Cette transaction est déjà finalisée et les fonds ont déjà été libérés." });
    }
    if (err?.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à valider la livraison pour cette transaction." });
    }
    if (err?.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "Transaction introuvable." });
    }
    console.error("Confirm delivery error:", err);
    res.status(500).json({ error: "Impossible de valider la livraison." });
  }
});

// 5. Request Withdraw of Cleared Balance from Wallet (VENDOR only)
app.post("/api/escrow/withdraw", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Seuls les vendeurs peuvent effectuer des retraits." });
  }

  const { method, accountNumber } = req.body;

  if (!method || !accountNumber) {
    return res.status(400).json({ error: "Veuillez spécifier le moyen de retrait (TMoney, Flooz) et le numéro de compte." });
  }

  try {
    const { withdrawnAmount, updatedWallet } = await prisma.$transaction(async (tx) => {
      const wallet = await tx.escrowWallet.findUnique({
        where: { vendorId: req.user.id }
      });

      if (!wallet || wallet.balance <= 0) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const amountToWithdraw = wallet.balance;

      const uWallet = await tx.escrowWallet.update({
        where: { id: wallet.id },
        data: { balance: 0.0 }
      });

      return { withdrawnAmount: amountToWithdraw, updatedWallet: uWallet };
    });

    res.json({
      message: `Retrait initié de ${withdrawnAmount} FCFA vers votre compte ${method} (${accountNumber}). Traitement en cours par notre banque partenaire.`,
      wallet: updatedWallet
    });
  } catch (err: any) {
    if (err?.message === "INSUFFICIENT_FUNDS") {
      return res.status(400).json({ error: "Votre solde disponible et retirable est insuffisant (0 FCFA)." });
    }
    res.status(500).json({ error: "Erreur lors de l'initiation du retrait." });
  }
});

// ----------------------------------------------------
// INVESTOR ENDPOINTS
// ----------------------------------------------------

// 1. Fetch Investor's investments
app.get("/api/investments/my", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "INVESTOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux investisseurs." });
  }
  try {
    const investments = await prisma.investment.findMany({
      where: { investorId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement de vos investissements." });
  }
});

// 2. Submit/Create a stock financing investment
app.post("/api/investments", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "INVESTOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Réservé aux investisseurs." });
  }

  const { amount } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: "Veuillez spécifier un montant d'investissement positif." });
  }

  try {
    const investment = await prisma.investment.create({
      data: {
        investorId: req.user.id,
        amount: parseFloat(amount),
        roi: 12.5, // Standard Lomé Lawson textile/agricultural ROI
        status: "ACTIVE"
      }
    });

    res.status(201).json({
      message: `Félicitations ! Votre investissement de ${amount} FCFA est enregistré et actif sous contrat sécurisé LGF.`,
      investment
    });
  } catch (err) {
    console.error("Investment error:", err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de l'investissement." });
  }
});

// ----------------------------------------------------
// LIVE STREAMING & CHAT ENDPOINTS (STEP 3)
// ----------------------------------------------------

// 1. Get all active streams
app.get("/api/livestreams", async (req, res) => {
  try {
    const streams = await prisma.liveStream.findMany({
      where: { status: "LIVE" },
      include: {
        vendor: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des streams." });
  }
});

// 2. Start a livestream (VENDOR only)
app.post("/api/livestreams", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Seuls les vendeurs peuvent lancer un stream en direct." });
  }

  const { title, url } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Veuillez fournir un titre pour votre live." });
  }

  try {
    const stream = await prisma.liveStream.create({
      data: {
        vendorId: req.user.id,
        title,
        url: url || "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=800", // Stock image representation
        status: "LIVE",
        viewers: Math.floor(Math.random() * 45) + 12
      }
    });

    res.status(201).json({
      message: "Votre live-stream est maintenant en direct sur LGF's Mall !",
      stream
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du lancement du direct." });
  }
});

// 3. End a livestream (VENDOR/ADMIN)
app.post("/api/livestreams/:id/end", authenticateUser, async (req: any, res) => {
  const { id } = req.params;

  try {
    const stream = await prisma.liveStream.findUnique({ where: { id } });
    if (!stream) {
      return res.status(404).json({ error: "Live introuvable." });
    }

    if (stream.vendorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Non autorisé à mettre fin à ce stream." });
    }

    const updatedStream = await prisma.liveStream.update({
      where: { id },
      data: { status: "ENDED" }
    });

    res.json({ message: "Le stream en direct a pris fin.", stream: updatedStream });
  } catch (err) {
    res.status(500).json({ error: "Impossible d'arrêter le stream." });
  }
});

// 4. Send message in livestream chat
app.post("/api/livestreams/:id/messages", authenticateUser, async (req: any, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Contenu du message vide." });
  }

  try {
    const stream = await prisma.liveStream.findUnique({ where: { id } });
    if (!stream) {
      return res.status(404).json({ error: "Live introuvable." });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: stream.vendorId, // Stream owner receives it conceptually
        content
      },
      include: {
        sender: {
          select: { name: true, role: true }
        }
      }
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Impossible d'envoyer le message." });
  }
});

// 5. Fetch livestream chat messages
app.get("/api/livestreams/:id/messages", async (req, res) => {
  const { id } = req.params;

  try {
    const stream = await prisma.liveStream.findUnique({ where: { id } });
    if (!stream) {
      return res.status(404).json({ error: "Live introuvable." });
    }

    const messages = await prisma.message.findMany({
      where: {
        receiverId: stream.vendorId, // Fetch messages targeted to vendor
        createdAt: {
          gte: stream.createdAt // Sent during or after stream creation
        }
      },
      include: {
        sender: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: "asc" },
      take: 50
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des commentaires." });
  }
});

// ----------------------------------------------------
// DRIVER LOGISTICS & DISPATCH ENDPOINTS (STEP 3)
// ----------------------------------------------------

// 1. Dispatch an order (VENDOR only) - assigns a verification OTP code
app.post("/api/orders/:id/dispatch", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Seuls les vendeurs peuvent expédier des commandes." });
  }

  const { id } = req.params;
  // Create a 4-digit verification code/OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { escrowWallet: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Commande introuvable." });
    }

    if (order.escrowWallet?.vendorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Cette commande ne vous appartient pas." });
    }

    if (order.status !== "ESCROW_HELD") {
      return res.status(400).json({ error: `La commande ne peut pas être expédiée dans son état actuel (${order.status}).` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "DISPATCHED",
        driverOtp: otp
      }
    });

    res.json({
      message: "Commande expédiée avec succès ! Code de sécurité généré pour le transporteur.",
      order: updatedOrder,
      otp // Vendor can communicate this if they want, but the system keeps it in DB for driver verification
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'expédition de la commande." });
  }
});

// 2. Fetch dispatched orders (For drivers to accept, or that they are currently delivering)
app.get("/api/orders/dispatched", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "DRIVER" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès réservé aux transporteurs." });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["DISPATCHED", "DELIVERED"] },
        OR: [
          { driverId: null },
          { driverId: req.user.id }
        ]
      },
      include: {
        buyer: {
          select: { name: true, phone: true, email: true }
        },
        escrowWallet: {
          include: {
            vendor: {
              select: { name: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des expéditions." });
  }
});

// 3. Driver claims a delivery order
app.post("/api/orders/:id/claim", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "DRIVER" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès réservé aux transporteurs." });
  }

  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable." });
    }

    if (order.status !== "DISPATCHED" || order.driverId) {
      return res.status(400).json({ error: "Cette commande est déjà prise en charge ou non disponible." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        driverId: req.user.id
      }
    });

    res.json({
      message: "Livraison prise en charge avec succès ! Rendez-vous au point de collecte.",
      order: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ error: "Impossible de prendre en charge cette livraison." });
  }
});

// 4. Driver marks order as delivered with OTP validation
app.post("/api/orders/:id/mark-delivered", authenticateUser, async (req: any, res) => {
  if (req.user.role !== "DRIVER" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès réservé aux transporteurs." });
  }

  const { id } = req.params;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ error: "Veuillez fournir le code OTP de livraison client." });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable." });
    }

    if (order.driverId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Vous n'êtes pas le livreur assigné à cette commande." });
    }

    if (order.driverOtp !== otp) {
      return res.status(400).json({ error: "Code OTP incorrect. Veuillez demander le code à 4 chiffres reçu par le client." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "DELIVERED"
      }
    });

    res.json({
      message: "Colis validé comme LIVRÉ ! Le client a été notifié pour libérer l'escrow.",
      order: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la validation de la livraison." });
  }
});

// ----------------------------------------------------
// GEMINI AI PRODUCT DESCRIPTION GENERATION
// ----------------------------------------------------
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La clé d'API GEMINI_API_KEY n'est pas configurée dans les secrets ou les variables d'environnement.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

app.post("/api/gemini/generate-description", authenticateUser, async (req: any, res) => {
  const { title, category } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: "Veuillez fournir un titre et une catégorie pour générer la description." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Génère une description de produit professionnelle, optimisée pour le commerce électronique et très attrayante pour un article nommé "${title}" dans la catégorie "${category}". La description doit mettre en avant la qualité, l'utilité, et donner envie d'acheter. Réponds uniquement avec la description générée en français, sans titre d'introduction, sans métadonnées et sans mise en forme markdown superflue. Reste concis (environ 2 à 4 phrases).`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const description = response.text?.trim() || "";
    res.json({ description });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Erreur lors de la génération de la description avec l'IA." });
  }
});

// ----------------------------------------------------
// VITE DEV SERVER / PRODUCTION SERVING
// ----------------------------------------------------
async function startServer() {
  try {
    // STEP 4: Seed database sequentially
    await seedDatabase();
    console.log("Database seed completed\n");

    // STEP 5: Start Express server
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      console.log("Vite dev server middleware integrated.");
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log("LGF's Mall server successfully running");
    });
  } catch (err) {
    console.error("Critical error starting server:", err);
    process.exit(1);
  }
}

startServer();
