import { test, expect } from '@playwright/test';

test.describe('Tableau de Bord Analytique & Module d Impression Haute Précision', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'doctor@clinic-a.test');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(agenda|clinic)/, { timeout: 10000 });
  });

  test('should navigate to dashboard and display financial KPIs, absenteeism ROI, and doctor workload', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Check Page Header & Period Selectors
    await expect(page.locator('h1')).toContainText(/Tableau de Bord Analytique & Financier/i);
    await expect(page.locator('body')).toContainText(/Dr\. Amine Benali/i);
    await expect(page.locator('body')).toContainText(/Casablanca/i);

    // 2. Financial Chiffre d'Affaires & Breakdown
    await expect(page.locator('body')).toContainText(/Chiffre d'Affaires Encaissé/i);
    await expect(page.locator('body')).toContainText(/DH/i);
    await expect(page.locator('body')).toContainText(/Ventilation des Encaissements/i);
    await expect(page.locator('body')).toContainText(/Espèces \(Cash\)/i);
    await expect(page.locator('body')).toContainText(/CMI Carte Bancaire/i);
    await expect(page.locator('body')).toContainText(/Chèques Bancaires/i);

    // 3. Absenteeism Before/After WhatsApp ROI
    await expect(page.locator('body')).toContainText(/Taux d'Absentéisme Réel/i);
    await expect(page.locator('body')).toContainText(/Sans Rappel Interactif/i);
    await expect(page.locator('body')).toContainText(/Avec Rappel WhatsApp Noor/i);
    await expect(page.locator('body')).toContainText(/Gain Préservé/i);

    // 4. Doctor Clinical Workload
    await expect(page.locator('body')).toContainText(/Volume & Activité Clinique par Médecin/i);
    await expect(page.locator('body')).toContainText(/INPE : 104829384/i);
  });

  test('should open high-precision print document with Noor brand header, official stamp, INPE and QR code', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on Print Bilan
    const printBtn = page.locator('button:has-text("Imprimer Bilan Financier (PDF)")');
    await expect(printBtn).toBeVisible();
    await printBtn.click();

    // Verify presence of high-precision modal elements
    const printModal = page.locator('.medical-print-document');
    await expect(printModal).toBeVisible();

    // Brand header
    await expect(printModal).toContainText(/Noor/i);
    await expect(printModal).toContainText(/نُور/i);
    await expect(printModal).toContainText(/Soin Numérique Maroc/i);

    // Doctor & INPE
    await expect(printModal).toContainText(/Dr\. Amine Benali/i);
    await expect(printModal).toContainText(/INPE : 104829384/i);

    // Official Stamp
    await expect(printModal).toContainText(/ROYAUME DU MAROC/i);
    await expect(printModal).toContainText(/Cachet Officiel & Signature/i);

    // QR Verification & Security Hash
    await expect(printModal).toContainText(/Vérification d'Authenticité/i);
    await expect(printModal).toContainText(/SHA-256/i);
    await expect(printModal).toContainText(/noor\.sante\.ma/i);
  });
});
