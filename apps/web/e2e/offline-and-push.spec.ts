import { test, expect } from '@playwright/test';

test.describe('Mode Hors-Ligne & Notifications Push Cliniques', () => {
  test('should display clinical notification center, handle simulations and badge updates', async ({ page }) => {
    // Navigate to agenda
    await page.goto('/agenda');

    // Check that notification bell is present
    const bellBtn = page.locator('button[aria-label="Centre de notifications cliniques"]');
    await expect(bellBtn).toBeVisible();

    // Open notification center
    await bellBtn.click();

    // Verify popover header and clinical alerts
    await expect(page.locator('text=Alertes Cliniques')).toBeVisible();
    await expect(page.getByText('Salle d\'attente • Arrivée')).toBeVisible();

    // Simulate a new patient arrival in waiting room
    const simArrivalBtn = page.locator('button:has-text("+ Arrivée patient")');
    await expect(simArrivalBtn).toBeVisible();
    await simArrivalBtn.click();

    // Verify the simulated alert appears in the notification center
    await expect(page.getByText('Khadija Tazi (A928301) vient de se présenter')).toBeVisible();

    // Click "Tout marquer lu"
    const markReadBtn = page.locator('button:has-text("Tout marquer lu")');
    if (await markReadBtn.isVisible()) {
      await markReadBtn.click();
    }
  });

  test('should support offline mode, display secure Moroccan CNDP banner, and queue offline mutations', async ({ page }) => {
    await page.goto('/agenda');

    // Verify normal online pill is present
    await expect(page.locator('text=En ligne')).toBeVisible();

    // Simulate browser offline
    await page.context().setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Offline banner should appear with Moroccan CNDP guarantee
    const offlineBanner = page.locator('aside[aria-label="Statut de connectivité réseau"]');
    await expect(offlineBanner).toBeVisible();
    await expect(page.getByText('Mode Hors-Ligne Sécurisé 🇲🇦', { exact: false })).toBeVisible();

    // Consult today's appointments in offline mode (cache loaded)
    await expect(page.getByText('Consultation de contrôle cardiologie', { exact: false })).toBeVisible();

    // Queue an offline status mutation directly
    await page.evaluate(() => {
      // Simulate an offline clinical mutation (e.g., doctor validated consultation offline)
      const queueEvent = new CustomEvent('noor-offline-queue-updated', { detail: { count: 1 } });
      window.localStorage.setItem(
        'noor_offline_mutations_queue_v1',
        JSON.stringify([
          {
            id: 'mut-test-1',
            type: 'UPDATE_APPOINTMENT_STATUS',
            payload: { id: 'appt-demo-1', status: 'completed' },
            timestamp: new Date().toISOString(),
          },
        ])
      );
      window.dispatchEvent(queueEvent);
    });

    // Check that offline banner reflects the queued action
    await expect(page.getByText('1 action en attente', { exact: false })).toBeVisible();

    // Simulate reconnecting back online
    await page.context().setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // When back online with pending actions, banner shows "Synchroniser maintenant 🔄"
    const syncBtn = page.locator('button:has-text("Synchroniser maintenant")');
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // After synchronization, pending badge is cleared
    await expect(page.locator('text=En ligne')).toBeVisible();
  });
});
