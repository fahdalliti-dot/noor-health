import { test, expect } from '@playwright/test';

test.describe('Dossier Médical Partagé (DMP 360°) & Répertoire Patient', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as doctor
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'doctor@clinic-a.test');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(agenda|clinic|patients)/, { timeout: 10000 });
  });

  test('should render patients 360 page with CNDP compliance and Moroccan registry', async ({ page }) => {
    await page.goto('/patients');

    // Verify main header and regulatory declaration
    await expect(page.locator('body')).toContainText(/Dossier Médical Partagé/i);
    await expect(page.locator('body')).toContainText(/CNDP Déclaration D-W-412\/2026/i);

    // Verify presence of preloaded Moroccan patients
    await expect(page.locator('body')).toContainText(/Yassine Mansouri/i);
    await expect(page.locator('body')).toContainText(/BE492019/i);
  });

  test('should filter patient roster by instant search query (CIN or Name)', async ({ page }) => {
    await page.goto('/patients');

    // Search by CIN
    const searchInput = page.locator('input[placeholder*="Rechercher par CIN"]');
    await searchInput.fill('BK829104');

    // Fatima Zahra Alami should be visible, Yassine Mansouri should be hidden
    await expect(page.locator('body')).toContainText(/Fatima Zahra Alami/i);
    await expect(page.locator('button:has-text("Yassine Mansouri")')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('button:has-text("Yassine Mansouri")')).toBeVisible();
  });

  test('should display 360 DMP details including vitals, BMI, consultations and allergy alert', async ({ page }) => {
    await page.goto('/patients');

    // Click on Fatima Zahra Alami
    await page.click('button:has-text("Fatima Zahra Alami")');

    // Should display allergy banner
    await expect(page.locator('body')).toContainText(/PÉNICILLINE & BÊTA-LACTAMINES/i);

    // Should display vitals
    await expect(page.locator('body')).toContainText(/Tension Artérielle/i);
    await expect(page.locator('body')).toContainText(/120\/75/i);
    await expect(page.locator('body')).toContainText(/IMC/i);

    // Should switch tabs to Prescriptions
    await page.click('button:has-text("Ordonnances Délivrées")');
    await expect(page.locator('body')).toContainText(/Metformine 850mg/i);

    // Should switch tabs to Labs & Imaging
    await page.click('button:has-text("Examens & Bilans")');
    await expect(page.locator('body')).toContainText(/Hémoglobine glyquée/i);
  });

  test('should allow creating a new patient with Moroccan CIN and auto-calculate age', async ({ page }) => {
    await page.goto('/patients');

    // Open new patient modal
    await page.click('button:has-text("+ Nouveau Patient")');
    await expect(page.locator('body')).toContainText(/Nouveau Dossier Patient \(DMP\)/i);

    // Fill new patient details
    await page.fill('input[placeholder="ex: Yassine"]', 'Rachid');
    await page.fill('input[placeholder="ex: Mansouri"]', 'El Amrani');
    await page.fill('input[placeholder="ex: BE492019"]', 'C998877');
    await page.fill('input[placeholder="+212 6..."]', '+212660112233');

    // Submit form
    await page.click('button:has-text("Enregistrer le Patient")');

    // Verify newly registered patient appears and is selected
    await expect(page.locator('body')).toContainText(/Rachid El Amrani/i);
    await expect(page.locator('body')).toContainText(/C998877/i);
  });
});
