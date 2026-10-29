import { test, expect } from '@playwright/test';

test.describe('Pack Spécialités Médicales Marocaines (Dentaire, Obstétrique, Pédiatrie)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as doctor
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'doctor@clinic-a.test');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(agenda|clinic)/, { timeout: 10000 });
    // Navigate directly to agenda
    await page.goto('/agenda');
    await page.waitForURL(/\/agenda/, { timeout: 10000 });
  });

  test('should open Dental Odontogram modal and display FDI 3950 quadrant numbering & quote', async ({ page }) => {
    // Click on appointment slot to open inspector
    const apptButton = page.locator('button:has-text("Alami"), button:has-text("Mansouri"), button:has-text("Tazi")').first();
    await expect(apptButton).toBeVisible({ timeout: 10000 });
    await apptButton.click();

    // Click on "Schéma Dentaire" button
    const dentalBtn = page.locator('button:has-text("Schéma Dentaire")');
    await expect(dentalBtn).toBeVisible({ timeout: 10000 });
    await dentalBtn.click();

    // Verify Odontogram Modal
    await expect(page.locator('h2:has-text("Schéma Dentaire")')).toBeVisible();
    await expect(page.locator('body')).toContainText(/MAXILLAIRE SUPÉRIEUR/i);
    await expect(page.locator('body')).toContainText(/MANDIBULE INFÉRIEURE/i);

    // Verify dental quote in DH
    await expect(page.locator('body')).toContainText(/Plan de Traitement & Devis Chiffré/i);
    await expect(page.locator('body')).toContainText(/DH/i);
  });

  test('should open Obstetric Tracker modal and display gestational term in SA and ultrasound report', async ({ page }) => {
    // Click on appointment slot
    const apptButton = page.locator('button:has-text("Alami"), button:has-text("Mansouri"), button:has-text("Tazi")').first();
    await expect(apptButton).toBeVisible({ timeout: 10000 });
    await apptButton.click();

    // Click on "Suivi Obstétrique" button
    const obstBtn = page.locator('button:has-text("Suivi Obstétrique")');
    await expect(obstBtn).toBeVisible({ timeout: 10000 });
    await obstBtn.click();

    // Verify Obstetric Modal & Term Calculation
    await expect(page.locator('h2:has-text("Suivi de Grossesse")')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Terme Actuel de la Grossesse/i);
    await expect(page.locator('body')).toContainText(/SA/i);
    await expect(page.locator('body')).toContainText(/DPA/i);

    // Verify Biometry
    await expect(page.locator('body')).toContainText(/Biométrie Fœtale T2/i);
    await expect(page.locator('body')).toContainText(/BIP/i);
  });

  test('should open Pediatric Tracker modal and display WHO growth curves and Moroccan PNI vaccines', async ({ page }) => {
    // Click on appointment slot
    const apptButton = page.locator('button:has-text("Alami"), button:has-text("Mansouri"), button:has-text("Tazi")').first();
    await expect(apptButton).toBeVisible({ timeout: 10000 });
    await apptButton.click();

    // Click on "Suivi PNI Pédiatrie" button
    const pedBtn = page.locator('button:has-text("Suivi PNI Pédiatrie")');
    await expect(pedBtn).toBeVisible({ timeout: 10000 });
    await pedBtn.click();

    // Verify Pediatric Modal
    await expect(page.locator('h2:has-text("Carnet de Santé Numérique")')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Poids Actuel/i);
    await expect(page.locator('body')).toContainText(/Programme National d'Immunisation/i);

    // Switch to WHO Growth Curves tab
    const curvesTab = page.locator('button:has-text("Courbes de Croissance Graphiques OMS")');
    await curvesTab.click();
    await expect(page.locator('body')).toContainText(/Courbe de Poids selon l'Âge/i);
    await expect(page.locator('body')).toContainText(/Médiane/i);
  });
});
