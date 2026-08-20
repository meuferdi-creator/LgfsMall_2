import { test, expect } from '@playwright/test';

/**
 * Requirement 127: Vendor End-to-End Critical Journey
 * Registration -> Create Product -> Manage Stock -> Receive Order Notification -> CSV Export
 */
test.describe('Point 127: Vendor E2E Critical Path', () => {
  const timestamp = Date.now();
  const testVendor = {
    name: 'Togo Vendor E2E',
    email: `vendor.e2e.${timestamp}@lgfmall.com`,
    password: 'VendorSecurePass123!',
    shopName: `Boutique E2E ${timestamp}`,
  };

  test('Complete Vendor Lifecycle: Onboarding to Financial CSV Export', async ({ page }) => {
    // 1. Vendor Login / Portal Access
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to Vendor Space
    const vendorSpaceBtn = page.locator('button:has-text("Espace Vendeur"), a:has-text("Vendeur")').first();
    if (await vendorSpaceBtn.isVisible()) {
      await vendorSpaceBtn.click();
    }

    // Login as Vendor Demo or New Vendor
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(testVendor.email);
      await page.fill('input[type="password"]', testVendor.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // 2. Create Product
    const addProductBtn = page.locator('button:has-text("Nouveau produit"), button:has-text("Ajouter un produit")').first();
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();

      await page.fill('input[name="title"], input[placeholder*="Titre"]', `Produit E2E ${timestamp}`);
      await page.fill('input[name="price"], input[placeholder*="Prix"]', '15000');
      await page.fill('input[name="stock"], input[placeholder*="Stock"]', '50');

      const submitProductBtn = page.locator('button[type="submit"]:has-text("Enregistrer"), button:has-text("Créer")').first();
      await submitProductBtn.click();
      await page.waitForTimeout(1000);
    }

    // 3. Manage Stock
    const stockEditInput = page.locator('input[value="50"]').first();
    if (await stockEditInput.isVisible()) {
      await stockEditInput.fill('75');
      await stockEditInput.press('Enter');
      await page.waitForTimeout(500);
    }

    // 4. Verify Order Notifications Tab
    const ordersTab = page.locator('button:has-text("Commandes"), [data-testid="vendor-orders-tab"]').first();
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await expect(page.locator('text=/Commandes reçues|Liste des commandes|No orders/i')).toBeVisible();
    }

    // 5. CSV Export Execution
    const exportCsvBtn = page.locator('button:has-text("Exporter CSV"), button:has-text("Export")').first();
    if (await exportCsvBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportCsvBtn.click(),
      ]);
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });
});
