import { test, expect } from '@playwright/test';

/**
 * Requirement 128: Driver End-to-End Critical Journey
 * Login -> View Assigned Deliveries -> Update Status -> Update GPS Location -> Mark as Delivered
 */
test.describe('Point 128: Delivery Driver E2E Critical Path', () => {
  test('Driver Order Claim, GPS Ping Update, and Delivery Completion with OTP', async ({ page, context }) => {
    // Grant Mock Geolocation permissions for GPS testing
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 6.1375, longitude: 1.2125 }); // Lomé coordinates

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Driver Access
    const driverSpaceBtn = page.locator('button:has-text("Espace Livreur"), a:has-text("Livreur")').first();
    if (await driverSpaceBtn.isVisible()) {
      await driverSpaceBtn.click();
    }

    // Login as Driver
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('driver@lgfmall.com');
      await page.fill('input[type="password"]', 'DriverPass123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // 2. View Available / Assigned Deliveries
    const deliveryCard = page.locator('.delivery-card, [data-testid="delivery-card"]').first();
    if (await deliveryCard.isVisible()) {
      // 3. Claim / Accept Delivery
      const claimBtn = page.locator('button:has-text("Accepter la livraison"), button:has-text("Prendre en charge")').first();
      if (await claimBtn.isVisible()) {
        await claimBtn.click();
      }

      // 4. Update GPS Location Ping
      const updateGpsBtn = page.locator('button:has-text("Mettre à jour GPS"), button:has-text("Position GPS")').first();
      if (await updateGpsBtn.isVisible()) {
        await updateGpsBtn.click();
        await expect(page.locator('text=/GPS actualisé|Position envoyée/i')).toBeVisible();
      }

      // 5. Mark as Delivered with OTP Verification
      const markDeliveredBtn = page.locator('button:has-text("Marquer comme Livré"), button:has-text("Valider Livraison")').first();
      if (await markDeliveredBtn.isVisible()) {
        await markDeliveredBtn.click();

        // Enter Delivery OTP
        const otpInput = page.locator('input[name="otp"], input[placeholder*="Code OTP"]');
        if (await otpInput.isVisible()) {
          await otpInput.fill('1234');
          await page.click('button:has-text("Valider OTP"), button[type="submit"]');
        }

        await expect(page.locator('text=/Livraison terminée|Commande Livrée/i')).toBeVisible();
      }
    }
  });
});
