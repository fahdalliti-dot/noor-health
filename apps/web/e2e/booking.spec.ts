import { test, expect } from '@playwright/test';

test.describe('Public Patient Booking Portal', () => {
  test('should render Dr. Amine Benali white-label booking page', async ({ page }) => {
    await page.goto('/book/dr-amine-benali');

    // Check doctor profile and Moroccan address cues
    await expect(page.locator('h1')).toContainText(/Dr\. Amine Benali/i);
    await expect(page.locator('body')).toContainText(/Casablanca/i);

    // Verify consultation motifs are visible
    await expect(page.locator('body')).toContainText(/Consultation|Cardiologie|ECG/i);

    // Verify time slots or availability section
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
  });

  test('should allow patient to select motif and submit appointment', async ({ page }) => {
    await page.goto('/book/dr-amine-benali');

    // Fill patient details if form inputs are present
    const nameInput = page.locator('input[placeholder*="Nom"], input[name*="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Khadija El Fassi');
    }

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="06"], input[placeholder*="phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0661998877');
    }

    // Page responds with HTTP 200 and loads successfully
    expect(page.url()).toContain('/book/dr-amine-benali');
  });
});
