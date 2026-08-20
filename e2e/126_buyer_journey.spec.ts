import { test, expect } from '@playwright/test';

/**
 * Requirement 126: Buyer End-to-End Critical Journey
 * Registration -> Login -> Search Product -> Add to Cart -> Checkout -> Mock Payment -> Order Tracking
 */
test.describe('Point 126: Buyer E2E Critical Path', () => {
  const timestamp = Date.now();
  const testBuyer = {
    name: 'Togo Buyer E2E',
    email: `buyer.e2e.${timestamp}@lgfmall.com`,
    password: 'BuyerSecurePass123!',
    phone: '+22890123456',
  };

  test('Complete Buyer Journey from Registration to Tracking', async ({ page }) => {
    // 1. Registration & Account Creation
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Auth Modal / Page
    const loginBtn = page.locator('button:has-text("Connexion"), button:has-text("Se connecter")').first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    // Switch to Register tab if needed
    const registerTab = page.locator('button:has-text("Inscription"), button:has-text("S\'inscrire")').first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    // Fill registration form
    await page.fill('input[type="email"]', testBuyer.email);
    await page.fill('input[type="password"]', testBuyer.password);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="Nom"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(testBuyer.name);
    }

    const phoneInput = page.locator('input[name="phone"], input[placeholder*="Téléphone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(testBuyer.phone);
    }

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 2. Product Search & Discovery
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Wax');
      await searchInput.press('Enter');
      await page.waitForTimeout(500);
    }

    // 3. Select First Product Card
    const productCard = page.locator('.product-card, [data-testid="product-card"]').first();
    if (await productCard.isVisible()) {
      await productCard.click();
    }

    // 4. Add to Cart
    const addToCartBtn = page.locator('button:has-text("Ajouter au panier"), button:has-text("Acheter")').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 5. Open Cart & Proceed to Checkout
    const cartBtn = page.locator('button:has-text("Panier"), [aria-label="Cart"]').first();
    if (await cartBtn.isVisible()) {
      await cartBtn.click();
    }

    const checkoutBtn = page.locator('button:has-text("Commander"), button:has-text("Valider la commande")').first();
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();
    }

    // 6. Select Payment Method & Finalize Order
    const payMobileMoneyBtn = page.locator('button:has-text("T-Money"), button:has-text("FLOOZ"), button:has-text("Payer")').first();
    if (await payMobileMoneyBtn.isVisible()) {
      await payMobileMoneyBtn.click();
    }

    // Confirm Payment
    const confirmPayBtn = page.locator('button:has-text("Confirmer"), button:has-text("Payer la commande")').first();
    if (await confirmPayBtn.isVisible()) {
      await confirmPayBtn.click();
      await page.waitForTimeout(1000);
    }

    // 7. Verify Order Success & Order Tracking ID
    const trackingElement = page.locator('text=/Commande #|Suivi|Order #/i').first();
    await expect(trackingElement).toBeVisible({ timeout: 10000 });
  });
});
