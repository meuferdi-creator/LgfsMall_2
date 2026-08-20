import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const user = process.env.SQL_ADMIN_USER || "ai_studio_admin";
const pass = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || "");
const dbName = process.env.SQL_DB_NAME || "cloud_sql_development_database";
const host = process.env.SQL_HOST || "";

const postgresUrl = `postgresql://${user}:${pass}@localhost/${dbName}?host=${host}`;
process.env.DATABASE_URL = postgresUrl;

const prisma = new PrismaClient();

async function importBackup() {
  console.log("Starting import to Cloud SQL PostgreSQL...");

  const backupFilePath = path.join(process.cwd(), "backup_production_data.json");
  const rawData = fs.readFileSync(backupFilePath, "utf-8");
  const backup = JSON.parse(rawData);

  console.log("Source Backup Summary:", backup.counts);

  // 1. Users
  for (const u of backup.users) {
    const { kyc, escrowWallet, ...userData } = u;
    await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        isEmailVerified: userData.isEmailVerified,
        updatedAt: new Date(userData.updatedAt)
      },
      create: {
        id: userData.id,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        isEmailVerified: userData.isEmailVerified,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt)
      }
    });
  }

  // 2. KYCs
  for (const k of backup.kycs) {
    await prisma.kyc.upsert({
      where: { id: k.id },
      update: {
        status: k.status,
        documentType: k.documentType,
        documentUrl: k.documentUrl,
        idNumber: k.idNumber,
        rejectionReason: k.rejectionReason,
        updatedAt: new Date(k.updatedAt)
      },
      create: {
        id: k.id,
        userId: k.userId,
        status: k.status,
        documentType: k.documentType,
        documentUrl: k.documentUrl,
        idNumber: k.idNumber,
        rejectionReason: k.rejectionReason,
        createdAt: new Date(k.createdAt),
        updatedAt: new Date(k.updatedAt)
      }
    });
  }

  // 3. Products
  for (const p of backup.products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        description: p.description,
        price: p.price,
        wholesalePrice: p.wholesalePrice,
        wholesaleMinQty: p.wholesaleMinQty,
        image: p.image,
        images: p.images,
        category: p.category,
        stock: p.stock,
        vendorId: p.vendorId,
        updatedAt: new Date(p.updatedAt)
      },
      create: {
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        wholesalePrice: p.wholesalePrice,
        wholesaleMinQty: p.wholesaleMinQty,
        image: p.image,
        images: p.images,
        category: p.category,
        stock: p.stock,
        vendorId: p.vendorId,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }
    });
  }

  // 4. Escrow Wallets
  for (const w of backup.escrowWallets) {
    await prisma.escrowWallet.upsert({
      where: { id: w.id },
      update: {
        balance: w.balance,
        pendingBalance: w.pendingBalance,
        currency: w.currency,
        updatedAt: new Date(w.updatedAt)
      },
      create: {
        id: w.id,
        vendorId: w.vendorId,
        balance: w.balance,
        pendingBalance: w.pendingBalance,
        currency: w.currency,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt)
      }
    });
  }

  // 5. Investments
  for (const inv of backup.investments) {
    await prisma.investment.upsert({
      where: { id: inv.id },
      update: {
        amount: inv.amount,
        status: inv.status,
        roi: inv.roi,
        updatedAt: new Date(inv.updatedAt)
      },
      create: {
        id: inv.id,
        investorId: inv.investorId,
        amount: inv.amount,
        status: inv.status,
        roi: inv.roi,
        createdAt: new Date(inv.createdAt),
        updatedAt: new Date(inv.updatedAt)
      }
    });
  }

  console.log("Import completed successfully!");

  // Verify imported data in PostgreSQL
  const pgUsers = await prisma.user.findMany();
  const pgKycs = await prisma.kyc.findMany();
  const pgProducts = await prisma.product.findMany();
  const pgEscrow = await prisma.escrowWallet.findMany();
  const pgInvestments = await prisma.investment.findMany();

  console.log("\n=== POSTGRESQL VERIFICATION REPORT ===");
  console.log(`Users count: ${pgUsers.length} (Expected: ${backup.counts.users})`);
  console.log(`KYCs count: ${pgKycs.length} (Expected: ${backup.counts.kycs})`);
  console.log(`Products count: ${pgProducts.length} (Expected: ${backup.counts.products})`);
  console.log(`Escrow Wallets count: ${pgEscrow.length} (Expected: ${backup.counts.escrowWallets})`);
  if (pgEscrow.length > 0) {
    console.log(`Escrow Balance: ${pgEscrow[0].balance} XOF, Pending: ${pgEscrow[0].pendingBalance} XOF`);
  }
  console.log(`Investments count: ${pgInvestments.length} (Expected: ${backup.counts.investments})`);
  if (pgInvestments.length > 0) {
    console.log(`Investment Amount: ${pgInvestments[0].amount} XOF, ROI: ${pgInvestments[0].roi}%`);
  }
}

importBackup()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
