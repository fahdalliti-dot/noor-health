import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control', () => {
  test('should display the login portal with Moroccan health branding', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Nura|SaaS/i);

    // Verify form elements exist
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should successfully log in as Doctor using dev password and navigate to agenda', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'doctor@clinic-a.test');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should redirect to /agenda or /clinic
    await page.waitForURL(/\/(agenda|clinic)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(agenda|clinic)/);

    // Verify access_token is set in localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('should display an error alert when credentials are invalid', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'doctor@clinic-a.test');
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    // Error banner should be visible
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/incorrect|erreur|invalid/i);
  });
});
