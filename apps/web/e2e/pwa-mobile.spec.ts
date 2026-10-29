import { test, expect } from '@playwright/test';

test.describe('PWA & Phone Mobile Application Suite', () => {
  test('should serve compliant Web App Manifest with Moroccan medical branding', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toContain('Noor Médecin');
    expect(manifest.short_name).toBe('Noor نُور');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#B05A3A');
    expect(manifest.background_color).toBe('#F7F4EF');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  });

  test('should include iOS and mobile standalone meta tags in HTML head', async ({ page }) => {
    await page.goto('/agenda');

    // Verify manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // Verify Apple Mobile Web App capable
    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable).toHaveAttribute('content', 'yes');

    // Verify Theme Color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#B05A3A');
  });

  test('should display native bottom navigation bar on mobile viewport and navigate seamlessly', async ({ page }) => {
    // Set mobile viewport (iPhone 14 / modern Android dimensions: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/agenda');

    // Verify mobile bottom nav is visible
    const bottomNav = page.locator('nav[aria-label="Navigation Mobile"]');
    await expect(bottomNav).toBeVisible();

    // Verify 5 thumb-friendly mobile tabs
    await expect(bottomNav.locator('text=Agenda')).toBeVisible();
    await expect(bottomNav.locator('text=Patients')).toBeVisible();
    await expect(bottomNav.locator('text=Stats')).toBeVisible();
    await expect(bottomNav.locator('text=Cabinet')).toBeVisible();
    await expect(bottomNav.locator('text=Équipe')).toBeVisible();

    // Tap "Patients" mobile tab
    await bottomNav.locator('a[href="/patients"]').click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.locator('h1')).toContainText(/Dossier Médical Partagé/i);

    // Tap "Stats" mobile tab
    await bottomNav.locator('a[href="/dashboard"]').click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Tableau de Bord/i);

    // Tap "Agenda" to return
    await bottomNav.locator('a[href="/agenda"]').click();
    await expect(page).toHaveURL(/\/agenda/);
    await expect(page.locator('button:has-text("Stocks")')).toBeVisible();
  });

  test('should support biometric quick-unlock (Face ID / Fingerprint) on the doctor login screen', async ({ page }) => {
    await page.goto('/auth/login');

    const bioBtn = page.locator('button:has-text("Déverrouiller avec Face ID")');
    await expect(bioBtn).toBeVisible();

    // Click biometric unlock
    await bioBtn.click();

    // Doctor is instantly logged in and navigated to agenda
    await expect(page).toHaveURL(/\/(agenda|clinic)/, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Dr\. Amine Benali|Agenda/i);
  });

  test('should display camera document & CIN scanner trigger in Patient 360 DMP view', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button:has-text("Dr. Amine Benali")');
    await page.waitForURL(/\/(agenda|clinic)/);

    await page.goto('/patients');
    const scanBtn = page.locator('button:has-text("Scanner CIN / Document")');
    await expect(scanBtn).toBeVisible();
  });
});
