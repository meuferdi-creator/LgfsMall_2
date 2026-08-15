import fs from "fs";
import path from "path";

const sourceDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const productionDbPath = path.join("/tmp", "prisma", "dev.db");

let activeDbFile = sourceDbPath;
if (fs.existsSync(productionDbPath)) {
  activeDbFile = productionDbPath;
}

process.env.DATABASE_URL = `file:${activeDbFile}`;
console.log(`Using Database URL: ${process.env.DATABASE_URL}`);

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function exportData() {
  console.log("Starting database backup dump from SQLite...");

  const users = await prisma.user.findMany({
    include: { kyc: true, escrowWallet: true }
  });
  const kycs = await prisma.kyc.findMany();
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany();
  const escrowWallets = await prisma.escrowWallet.findMany();
  const investments = await prisma.investment.findMany();
  const liveStreams = await prisma.liveStream.findMany();
  const messages = await prisma.message.findMany();

  const backupData = {
    exportDate: new Date().toISOString(),
    sourceFile: activeDbFile,
    counts: {
      users: users.length,
      kycs: kycs.length,
      products: products.length,
      orders: orders.length,
      escrowWallets: escrowWallets.length,
      investments: investments.length,
      liveStreams: liveStreams.length,
      messages: messages.length
    },
    users,
    kycs,
    products,
    orders,
    escrowWallets,
    investments,
    liveStreams,
    messages
  };

  const backupPath = path.join(process.cwd(), "backup_production_data.json");
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8");

  console.log("✅ Backup dump successfully saved to:", backupPath);
  console.log("Summary of dumped records:\n", JSON.stringify(backupData.counts, null, 2));

  console.log("\n--- USER ACCOUNTS ---");
  users.forEach((u: (typeof users)[number]) => console.log(`- [${u.role}] ID: ${u.id} | ${u.name} | ${u.email}`));

  console.log("\n--- PRODUCTS ---");
  products.forEach((p: (typeof products)[number]) => console.log(`- ID: ${p.id} | ${p.title} | Price: ${p.price} XOF | Stock: ${p.stock}`));
}

exportData()
  .catch((e) => {
    console.error("Backup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
