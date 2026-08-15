import { prisma } from "../src/db/prisma.js";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { InvoiceService } from "../src/services/invoiceService.js";

async function runAuditTests() {
  console.log("=================================================");
  console.log("RUNNING HOSTILE AUDIT & VERIFICATION SUITE");
  console.log("=================================================\n");

  const testEmail = `audit-test-${Date.now()}@lgfmall.com`;
  const rawPassword = "TestPassword123!#";
  const hashedPassword = bcryptjs.hashSync(rawPassword, 12);

  console.log("1. TESTING USER ACCOUNT PERSISTENCE...");
  // Create test user
  const createdUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Audit Test User",
      password: hashedPassword,
      role: "BUYER",
      phone: "+22890000000",
      referralCode: `LGF-AUD-${crypto.randomBytes(2).toString("hex").toUpperCase()}`
    }
  });

  console.log("   -> Created User ID:", createdUser.id);
  console.log("   -> Email:", createdUser.email);
  console.log("   -> Password Hash:", createdUser.password.slice(0, 15) + "...");
  console.log("   -> Role:", createdUser.role);
  console.log("   -> CreatedAt:", createdUser.createdAt);

  // Retrieve user immediately
  const retrieved1 = await prisma.user.findUnique({ where: { id: createdUser.id } });
  if (!retrieved1 || retrieved1.id !== createdUser.id) {
    throw new Error("FAILED: User not found immediately after creation.");
  }
  console.log("   -> Immediate DB retrieval: SUCCESS");

  // Query database disconnect/reconnect simulation
  await prisma.$disconnect();
  await prisma.$connect();

  const retrieved2 = await prisma.user.findUnique({ where: { id: createdUser.id } });
  if (!retrieved2 || retrieved2.id !== createdUser.id) {
    throw new Error("FAILED: User lost after DB disconnect/reconnect.");
  }
  console.log("   -> Post-reconnect DB retrieval: SUCCESS");

  // Clean up test user
  await prisma.user.delete({ where: { id: createdUser.id } });
  console.log("   -> Cleanup test user: PASSED\n");

  console.log("2. TESTING INVOICE PDF GENERATION...");
  // Find or create mock order for invoice test
  let sampleOrder = await prisma.order.findFirst({
    include: { items: true, buyer: true }
  });

  if (sampleOrder) {
    const pdfBuffer = await InvoiceService.generateOrderInvoicePdf(sampleOrder.id);
    console.log("   -> Invoice PDF Buffer size:", pdfBuffer.length, "bytes");
    if (pdfBuffer.length > 500) {
      console.log("   -> Invoice PDF generation: SUCCESS");
    } else {
      throw new Error("FAILED: Invoice PDF buffer too small.");
    }
  } else {
    console.log("   -> No existing orders to test PDF generation on, skipping PDF output test.");
  }

  console.log("\n=================================================");
  console.log("ALL AUDIT SCRIPT TESTS EXECUTED SUCCESSFULLY");
  console.log("=================================================");
}

runAuditTests().catch((err) => {
  console.error("AUDIT TEST SUITE FAILED:", err);
  process.exit(1);
});
