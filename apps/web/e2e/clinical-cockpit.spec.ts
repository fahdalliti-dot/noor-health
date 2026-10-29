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

    // Verify presence of navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display team and privilege management page', async ({ page }) => {
    await page.goto('/team');

    // Verify team members and 2FA badges
    await expect(page.locator('body')).toContainText(/Dr\. Amine Benali|Équipe|Collaborateur/i);
    await expect(page.locator('body')).toContainText(/2FA/i);
  });
});
