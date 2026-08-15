import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";
import { NotificationService } from "./notificationService.js";

// Marketplace Platform Commission Rate (5% = 0.05)
const PLATFORM_COMMISSION_RATE = 0.05;

export class WalletService {
  /**
   * Get or initialize a User's personal balance wallet
   */
  public static async getUserWallet(userId: string) {
    let wallet = await prisma.userWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: "XOF"
        }
      });
    }

    return wallet;
  }

  /**
   * Get or initialize the Platform Commission Pool Wallet
   */
  public static async getPlatformWallet() {
    let wallet = await prisma.platformWallet.findFirst();

    if (!wallet) {
      wallet = await prisma.platformWallet.create({
        data: {
          balance: 0.0,
          currency: "XOF"
        }
      });
    }

    return wallet;
  }

  /**
   * Top up User Wallet with transaction ledger entry
   */
  public static async topupUserWallet(userId: string, amount: number, paymentTxId: string) {
    if (amount <= 0) throw new Error("Le montant du rechargement doit être supérieur à zéro.");

    return await prisma.$transaction(async (tx) => {
      let wallet = await tx.userWallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.userWallet.create({
          data: { userId, balance: 0.0, currency: "XOF" }
        });
      }

      const newBalance = wallet.balance + amount;

      const updatedWallet = await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      });

      const ledgerEntry = await tx.walletTransaction.create({
        data: {
          userId,
          walletType: "USER",
          type: "TOPUP",
          amount,
          balanceAfter: newBalance,
          reference: paymentTxId,
          description: `Rechargement du portefeuille via paiement (${paymentTxId})`,
          status: "COMPLETED"
        }
      });

      logger.info(`[WalletService] User ${userId} wallet topped up by ${amount} XOF. New balance: ${newBalance}`);
      return { wallet: updatedWallet, transaction: ledgerEntry };
    });
  }

  /**
   * Process order completion:
   * 1. Deducts platform commission (5%) from held escrow balance
   * 2. Moves net vendor payout from vendor's pendingBalance to cleared balance
   * 3. Credits platform wallet with commission
   * 4. Creates immutable WalletTransaction ledger logs
   * 5. Checks & triggers Referral Reward if first order completed!
   */
  public static async releaseEscrowAndDeductCommission(orderId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { vendor: true } }, buyer: true }
      });

      if (!order) throw new Error("Commande introuvable.");
      if (order.status === "COMPLETED") {
        logger.info(`[WalletService] Order ${orderId} already completed.`);
        return { completedOrder: order, buyerEmail: order.buyer.email, buyerPhone: order.buyer.phone, total: order.total };
      }

      const platformWallet = await tx.platformWallet.findFirst();
      let pWalletId = platformWallet ? platformWallet.id : (await tx.platformWallet.create({ data: { balance: 0.0 } })).id;

      let totalCommissionAmount = 0;

      // Group subtotal by vendor
      const vendorTotals: Record<string, number> = {};
      for (const item of order.items) {
        vendorTotals[item.vendorId] = (vendorTotals[item.vendorId] || 0) + item.subtotal;
      }

      for (const [vendorId, grossAmount] of Object.entries(vendorTotals)) {
        const commission = Math.round(grossAmount * PLATFORM_COMMISSION_RATE);
        const netVendorPayout = grossAmount - commission;
        totalCommissionAmount += commission;

        let escrow = await tx.escrowWallet.findUnique({ where: { vendorId } });
        if (!escrow) {
          escrow = await tx.escrowWallet.create({
            data: { vendorId, balance: 0.0, pendingBalance: grossAmount }
          });
        }

        const updatedPending = Math.max(0, escrow.pendingBalance - grossAmount);
        const updatedClearedBalance = escrow.balance + netVendorPayout;

        await tx.escrowWallet.update({
          where: { id: escrow.id },
          data: {
            pendingBalance: updatedPending,
            balance: updatedClearedBalance
          }
        });

        // Vendor Ledger Entry
        await tx.walletTransaction.create({
          data: {
            userId: vendorId,
            walletType: "ESCROW",
            type: "ESCROW_RELEASE",
            amount: netVendorPayout,
            balanceAfter: updatedClearedBalance,
            reference: orderId,
            description: `Libération séquestre commande #${orderId.slice(0, 8)} (Net après commission de ${commission} FCFA)`
          }
        });
      }

      // Credit Platform Commission Pool
      const currentPlatformWallet = await tx.platformWallet.findUnique({ where: { id: pWalletId } });
      const newPlatformBalance = (currentPlatformWallet?.balance || 0) + totalCommissionAmount;

      await tx.platformWallet.update({
        where: { id: pWalletId },
        data: { balance: newPlatformBalance }
      });

      // Platform Commission Ledger
      await tx.walletTransaction.create({
        data: {
          walletType: "PLATFORM",
          type: "COMMISSION",
          amount: totalCommissionAmount,
          balanceAfter: newPlatformBalance,
          reference: orderId,
          description: `Commission plateforme LGF (5%) perçue sur la commande #${orderId.slice(0, 8)}`
        }
      });

      // Update Order Status to COMPLETED
      const completedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED" }
      });

      // Point 104: Check referral bonus logic on buyer's first completed order
      const pendingReferral = await tx.referral.findUnique({
        where: { refereeId: order.buyerId }
      });

      if (pendingReferral && pendingReferral.status === "PENDING") {
        const referrerWallet = await tx.userWallet.findUnique({ where: { userId: pendingReferral.referrerId } })
          || await tx.userWallet.create({ data: { userId: pendingReferral.referrerId, balance: 0.0 } });

        const bonusAmount = pendingReferral.rewardAmount;
        const newReferrerBalance = referrerWallet.balance + bonusAmount;

        await tx.userWallet.update({
          where: { id: referrerWallet.id },
          data: { balance: newReferrerBalance }
        });

        await tx.referral.update({
          where: { id: pendingReferral.id },
          data: { status: "REWARDED" }
        });

        await tx.walletTransaction.create({
          data: {
            userId: pendingReferral.referrerId,
            walletType: "USER",
            type: "REFERRAL_BONUS",
            amount: bonusAmount,
            balanceAfter: newReferrerBalance,
            reference: pendingReferral.id,
            description: `Prime de parrainage attribuée pour la première commande validée du filleul`
          }
        });

        logger.info(`[WalletService] Referral reward of ${bonusAmount} XOF credited to referrer ${pendingReferral.referrerId}`);
      }

      return { completedOrder, buyerEmail: order.buyer.email, buyerPhone: order.buyer.phone, total: order.total };
    });

    // Trigger Milestone Notification AFTER database transaction commits
    NotificationService.dispatch({
      recipientEmail: result.buyerEmail,
      recipientPhone: result.buyerPhone,
      subject: `Commande #${orderId.slice(0, 8)} Terminée`,
      title: "Commande Livrée & Validée",
      message: `Votre commande de ${result.total} FCFA a été livrée avec succès. Merci d'avoir acheté sur LGF's Mall !`,
      type: "COMPLETED"
    });

    return result.completedOrder;
  }
}
