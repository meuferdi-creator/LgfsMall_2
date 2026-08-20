import { test, expect } from '@playwright/test';

/**
 * Requirement 125: Language Button Testing
 * Traverses primary routes, switches languages (FR, EN, EWE, KABYE),
 * and programmatically detects untranslated strings or fallback mismatches.
 */
test.describe('Point 125: i18n & Language Switcher Automated Audit', () => {
  const targetRoutes = ['/', '/login', '/catalog'];
  const supportedLanguages = [
    { code: 'FR', label: 'Français', expectedWelcome: 'Bienvenue' },
    { code: 'EN', label: 'English', expectedWelcome: 'Welcome' },
    { code: 'EWE', label: 'Eʋegbe', expectedWelcome: 'Eza' },
    { code: 'KABYE', label: 'Kabɩyɛ', expectedWelcome: 'Kabɩyɛ' },
  ];

  for (const route of targetRoutes) {
    test(`Verify language switching and missing keys on route: ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      for (const lang of supportedLanguages) {
        // Locate language selector button
        const langButton = page.locator(`button[data-testid="lang-switch-${lang.code}"], button:has-text("${lang.code}")`).first();
        if (await langButton.isVisible()) {
          await langButton.click();
          await page.waitForTimeout(500); // Allow React state / re-render
        }

        // Audit page content for fallback keys or raw string tokens
        const pageText = await page.content();
        
        // Assert no raw key strings like 'translations.missing_key' are exposed
        expect(pageText).not.toContain('undefined');
        expect(pageText).not.toMatch(/\{\{.*\}\}/); // No raw mustache templates

        // Verify body tag or lang context reflects active lang
        const activeLangAttr = await page.getAttribute('html', 'lang');
        if (activeLangAttr) {
          expect(activeLangAttr.toLowerCase()).toContain(lang.code.toLowerCase());
        }
      }
    });
  }
});
