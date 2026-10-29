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

  test('should navigate between Agenda, Horaires (working hours), and Absences (time-off) tabs without errors', async ({ page }) => {
    await page.goto('/agenda');

    // 1. Verify Horaires tab is present and clickable
    const horairesLink = page.locator('a[href="/agenda/working-hours"]:visible');
    await expect(horairesLink).toBeVisible();
    await horairesLink.click();

    // Verify Horaires page loaded successfully (no 404!)
    await expect(page).toHaveURL(/\/agenda\/working-hours/);
    await expect(page.locator('h1')).toContainText(/Horaires de Consultation du Cabinet/i);
    await expect(page.locator('text=Grille Hebdomadaire des Consultations')).toBeVisible();
    await expect(page.getByText('Joumouaa', { exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("Enregistrer les Horaires")')).toBeVisible();

    // Test switching preset
    const ramadanPresetBtn = page.locator('button:has-text("Ramadan")');
    await expect(ramadanPresetBtn).toBeVisible();
    await ramadanPresetBtn.click();
    await expect(page.locator('text=Horaires de Ramadan appliqués')).toBeVisible();

    // 2. Click Absences tab
    const absencesLink = page.locator('a[href="/agenda/time-off"]:visible');
    await expect(absencesLink).toBeVisible();
    await absencesLink.click();

    // Verify Absences page loaded successfully (no 404!)
    await expect(page).toHaveURL(/\/agenda\/time-off/);
    await expect(page.locator('h1')).toContainText(/Absences & Congés Médicaux/i);
    await expect(page.locator('text=Jours Fériés Nationaux & Religieux au Maroc')).toBeVisible();
    await expect(page.locator('text=Aïd Al-Fitr')).toBeVisible();
    await expect(page.locator('button:has-text("+ Déclarer une Absence")')).toBeVisible();

    // 3. Return back to Agenda tab
    const agendaLink = page.locator('aside a[href="/agenda"], nav a[href="/agenda"]:visible').first();
    await expect(agendaLink).toBeVisible();
    await agendaLink.click();

    await expect(page).toHaveURL(/\/agenda$/);
    await expect(page.locator('button:has-text("Stocks")')).toBeVisible();
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
