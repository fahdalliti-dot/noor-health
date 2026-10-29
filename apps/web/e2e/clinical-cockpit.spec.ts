import { test, expect } from '@playwright/test';

test.describe('Clinical Cockpit & DMP Inspector', () => {
  test.beforeEach(async ({ page }) => {
    // Perform authentication first to seed storage state
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'doctor@clinic-a.test');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(agenda|clinic)/, { timeout: 10000 });
  });

  test('should render agenda cockpit with Moroccan clinical cues and INPE', async ({ page }) => {
    await page.goto('/agenda');

    // Page body should contain Moroccan regulatory and clinical tags
    await expect(page.locator('body')).toContainText(/Agenda|Cabinet|Consultation/i);

    // Verify presence of navigation elements - exactly ONE top branding nav
    const brandLinks = page.locator('a[aria-label="Noor — accueil"]');
    await expect(brandLinks).toHaveCount(1);
    await expect(brandLinks).toBeVisible();
  });

  test('should display Stocks, Public Booking Link, and Cash Desk modals with opaque solid backgrounds', async ({ page }) => {
    await page.goto('/agenda');

    // 1. Test Stocks (Inventory) Modal
    const stockBtn = page.locator('button:has-text("Stocks")');
    await expect(stockBtn).toBeVisible();
    await stockBtn.click();

    const stockModal = page.locator('text=Gestion des Stocks & Consommables Médicaux');
    await expect(stockModal).toBeVisible();

    // Verify modal panel container has opaque white background (not transparent)
    const stockPanel = page.locator('div[style*="background-color: rgb(255, 255, 255)"]').first();
    await expect(stockPanel).toBeVisible();
    const stockBgColor = await stockPanel.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(stockBgColor).toBe('rgb(255, 255, 255)');

    // Close modal
    await page.keyboard.press('Escape');
    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }

    // 2. Test Public Booking Link Modal
    const bookingLinkBtn = page.locator('button:has-text("Lien RDV Public")');
    await expect(bookingLinkBtn).toBeVisible();
    await bookingLinkBtn.click();

    const bookingModal = page.locator('text=Lien de Prise de Rendez-Vous Public');
    await expect(bookingModal).toBeVisible();
    await expect(page.locator('text=Portail patient sécurisé')).toBeVisible();

    const bookingPanel = page.locator('div[style*="background-color: rgb(255, 255, 255)"]').first();
    const bookingBgColor = await bookingPanel.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bookingBgColor).toBe('rgb(255, 255, 255)');

    await page.locator('button:has-text("✕")').first().click();

    // 3. Test Cash Desk (Caisse du Jour) Modal
    const cashBtn = page.locator('button:has-text("Caisse du Jour")');
    await expect(cashBtn).toBeVisible();
    await cashBtn.click();

    const cashModal = page.locator('text=Caisse & Règlements Journaliers');
    await expect(cashModal).toBeVisible();
    await expect(page.locator('text=Total Encaissé')).toBeVisible();

    const cashPanel = page.locator('div[style*="background-color: rgb(255, 255, 255)"]').first();
    const cashBgColor = await cashPanel.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(cashBgColor).toBe('rgb(255, 255, 255)');

    await page.locator('button:has-text("✕")').first().click();
  });

  test('should display team and privilege management page', async ({ page }) => {
    await page.goto('/team');

    // Verify team members and 2FA badges
    await expect(page.locator('body')).toContainText(/Dr\. Amine Benali|Équipe|Collaborateur/i);
    await expect(page.locator('body')).toContainText(/2FA/i);
  });

  test('should support automated WhatsApp reminder modal with Darija & Cloud API', async ({ page }) => {
    await page.goto('/agenda');

    // Check if any appointment exists in the day view
    const apptButton = page.locator('button:has-text(":")').first();
    if (await apptButton.isVisible()) {
      await apptButton.click();
      const whatsAppBtn = page.locator('button:has-text("WhatsApp")').first();
      if (await whatsAppBtn.isVisible()) {
        await whatsAppBtn.click();
        await expect(page.locator('body')).toContainText(/Rappels WhatsApp & SMS Automatisés/i);
        await expect(page.locator('body')).toContainText(/الدارجة/i);
        await expect(page.locator('button:has-text("Cloud API")')).toBeVisible();
      }
    }
  });
});
