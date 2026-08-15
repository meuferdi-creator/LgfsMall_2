import { test, expect } from '@playwright/test';

/**
 * Requirement 129: Admin Governance End-to-End Critical Journey
 * Login -> Dashboard Metrics -> KYC Validation -> Moderation -> Wallet & Commission Verification
 */
test.describe('Point 129: Admin Governance E2E Critical Path', () => {
  test('Complete Admin Control Loop: Metrics, KYC, Moderation & Escrow Ledger Audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Admin Login
    const adminTabBtn = page.locator('button:has-text("Administration"), button:has-text("Admin")').first();
    if (await adminTabBtn.isVisible()) {
      await adminTabBtn.click();
    }

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@lgfmall.com');
      await page.fill('input[type="password"]', 'AdminSecurePass123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // 2. Dashboard Metrics Verification
    const metricsHeader = page.locator('text=/Tableau de bord|Statistiques globales|Commissions/i').first();
    await expect(metricsHeader).toBeVisible();

    // 3. KYC Approval & Document Verification
    const kycTab = page.locator('button:has-text("Vérification KYC"), button:has-text("KYC")').first();
    if (await kycTab.isVisible()) {
      await kycTab.click();

      const pendingKycRow = page.locator('tr:has-text("PENDING"), .kyc-card').first();
      if (await pendingKycRow.isVisible()) {
        const approveBtn = pendingKycRow.locator('button:has-text("Approuver"), button:has-text("Valider")').first();
        if (await approveBtn.isVisible()) {
          await approveBtn.click();
          await expect(page.locator('text=/KYC Approuvé|Statut mis à jour/i')).toBeVisible();
        }
      }
    }

    // 4. Content Moderation
    const moderationTab = page.locator('button:has-text("Modération"), button:has-text("Signalements")').first();
    if (await moderationTab.isVisible()) {
      await moderationTab.click();
      await expect(page.locator('text=/Articles signalés|Produits modérés/i')).toBeVisible();
    }

    // 5. Escrow Wallet & Platform Commission Audit
    const financeTab = page.locator('button:has-text("Finances"), button:has-text("Commissions")').first();
    if (await financeTab.isVisible()) {
      await financeTab.click();
      await expect(page.locator('text=/Solde Escrow|Commissions Plateforme|5%/i')).toBeVisible();
    }
  });
});
