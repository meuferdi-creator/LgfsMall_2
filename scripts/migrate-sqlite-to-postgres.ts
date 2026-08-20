// @ts-ignore
import { PrismaClient as SQLitePrisma } from "@prisma/sqlite-client";
import { PrismaClient as PostgresPrisma } from "@prisma/client";

function getPostgresUrl(): string {
  if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) {
    const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
    const pass = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "");
    const dbName = process.env.SQL_DB_NAME;
    const socketDir = process.env.SQL_HOST;
    return `postgresql://${user}:${pass}@localhost/${dbName}?host=${socketDir}`;
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
}

/**
 * Migration Script: Move data safely from local SQLite (dev.db) to production PostgreSQL.
 */
async function migrateSqliteToPostgres() {
  const sqliteUrl = process.env.SQLITE_URL || "file:./dev.db";
  const postgresUrl = getPostgresUrl();

  if (!postgresUrl || !postgresUrl.startsWith("postgres")) {
    console.error("❌ Invalid POSTGRES_URL / DATABASE_URL provided.");
    process.exit(1);
  }

  console.log("🔄 Starting migration from SQLite to PostgreSQL...");
  console.log("Postgres URL:", postgresUrl.replace(/:[^:@]+@/, ":***@"));

  const sqlitePrisma = new SQLitePrisma({ datasources: { db: { url: sqliteUrl } } });
  const postgresPrisma = new PostgresPrisma({ datasources: { db: { url: postgresUrl } } });

  try {
    // 1. Migrate Users
    const users = await sqlitePrisma.user.findMany();
    console.log(`📦 Found ${users.length} Users in SQLite.`);
    for (const u of users) {
      await postgresPrisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          phone: u.phone,
          role: u.role,
          isEmailVerified: u.isEmailVerified,
        },
        create: {
          id: u.id,
          email: u.email,
          password: u.password,
          name: u.name,
          phone: u.phone,
          role: u.role,
          isEmailVerified: u.isEmailVerified,
          referralCode: u.referralCode,
          referredById: u.referredById,
          twoFactorEnabled: u.twoFactorEnabled,
          bankName: u.bankName,
          accountNumber: u.accountNumber,
          taxId: u.taxId,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        }
      });
    }

    // 2. Migrate KYCs
    const kycs = await sqlitePrisma.kyc.findMany();
    console.log(`📦 Found ${kycs.length} KYCs in SQLite.`);
    for (const k of kycs) {
      await postgresPrisma.kyc.upsert({
        where: { userId: k.userId },
        update: k,
        create: k
      });
    }

    // 3. Migrate EscrowWallets
    const wallets = await sqlitePrisma.escrowWallet.findMany();
    console.log(`📦 Found ${wallets.length} Escrow Wallets in SQLite.`);
    for (const w of wallets) {
      await postgresPrisma.escrowWallet.upsert({
        where: { vendorId: w.vendorId },
        update: {
          balance: w.balance,
          pendingBalance: w.pendingBalance,
          currency: w.currency
        },
        create: {
          id: w.id,
          vendorId: w.vendorId,
          balance: w.balance,
          pendingBalance: w.pendingBalance,
          currency: w.currency,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt
        }
      });
    }

    // 4. Migrate Products
    const products = await sqlitePrisma.product.findMany();
    console.log(`📦 Found ${products.length} Products in SQLite.`);
    for (const p of products) {
      await postgresPrisma.product.upsert({
        where: { id: p.id },
        update: {
          title: p.title,
          description: p.description,
          price: p.price,
          wholesalePrice: p.wholesalePrice,
          wholesaleMinQty: p.wholesaleMinQty,
          category: p.category,
          stock: p.stock,
          image: p.image,
          images: p.images,
          variants: p.variants,
          isFlashDeal: p.isFlashDeal,
          flashPrice: p.flashPrice,
          flashEndTime: p.flashEndTime,
          isFeatured: p.isFeatured
        },
        create: p
      });
    }

    // 5. Migrate Coupons
    const coupons = await sqlitePrisma.coupon.findMany();
    console.log(`📦 Found ${coupons.length} Coupons in SQLite.`);
    for (const c of coupons) {
      await postgresPrisma.coupon.upsert({
        where: { code: c.code },
        update: c,
        create: c
      });
    }

    // 6. Migrate Orders & OrderItems
    const orders = await sqlitePrisma.order.findMany();
    console.log(`📦 Found ${orders.length} Orders in SQLite.`);
    for (const o of orders) {
      await postgresPrisma.order.upsert({
        where: { id: o.id },
        update: o,
        create: o
      });
    }

    const orderItems = await sqlitePrisma.orderItem.findMany();
    console.log(`📦 Found ${orderItems.length} OrderItems in SQLite.`);
    for (const oi of orderItems) {
      await postgresPrisma.orderItem.upsert({
        where: { id: oi.id },
        update: oi,
        create: oi
      });
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
