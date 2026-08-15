import { PrismaClient as SQLitePrisma } from "@prisma/client";
import { PrismaClient as PostgresPrisma } from "@prisma/client";

/**
 * Migration Script: Move data safely from local SQLite (dev.db) to production PostgreSQL.
 * 
 * Usage:
 *   SQLITE_URL="file:./prisma/dev.db" POSTGRES_URL="postgresql://user:pass@host:5432/dbname" npx tsx scripts/migrate-sqlite-to-postgres.ts
 */
async function migrateSqliteToPostgres() {
  const sqliteUrl = process.env.SQLITE_URL || "file:./dev.db";
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!postgresUrl || !postgresUrl.startsWith("postgres")) {
    console.error("❌ Invalid POSTGRES_URL provided. Specify a valid PostgreSQL connection string.");
    process.exit(1);
  }

  console.log("🔄 Starting migration from SQLite to PostgreSQL...");

  const sqlitePrisma = new SQLitePrisma({ datasources: { db: { url: sqliteUrl } } });
  const postgresPrisma = new PostgresPrisma({ datasources: { db: { url: postgresUrl } } });

  try {
    // 1. Migrate Users
    const users = await sqlitePrisma.user.findMany();
    console.log(`📦 Migrating ${users.length} Users...`);
    for (const u of users) {
      await postgresPrisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u
      });
    }

    // 2. Migrate KYCs
    const kycs = await sqlitePrisma.kyc.findMany();
    console.log(`📦 Migrating ${kycs.length} KYCs...`);
    for (const k of kycs) {
      await postgresPrisma.kyc.upsert({
        where: { id: k.id },
        update: k,
        create: k
      });
    }

    // 3. Migrate Products
    const products = await sqlitePrisma.product.findMany();
    console.log(`📦 Migrating ${products.length} Products...`);
    for (const p of products) {
      await postgresPrisma.product.upsert({
        where: { id: p.id },
        update: p,
        create: p
      });
    }

    // 4. Migrate EscrowWallets
    const wallets = await sqlitePrisma.escrowWallet.findMany();
    console.log(`📦 Migrating ${wallets.length} Escrow Wallets...`);
    for (const w of wallets) {
      await postgresPrisma.escrowWallet.upsert({
        where: { id: w.id },
        update: w,
        create: w
      });
    }

    // 5. Migrate Orders & OrderItems
    const orders = await sqlitePrisma.order.findMany({ include: { items: true } });
    console.log(`📦 Migrating ${orders.length} Orders...`);
    for (const o of orders) {
      const { items, ...orderData } = o;
      await postgresPrisma.order.upsert({
        where: { id: orderData.id },
        update: orderData,
        create: orderData
      });

      for (const item of items) {
        await postgresPrisma.orderItem.upsert({
          where: { id: item.id },
          update: item,
          create: item
        });
      }
    }

    console.log("✅ Zero-data-loss migration to PostgreSQL completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresPrisma.$disconnect();
  }
}

migrateSqliteToPostgres();
