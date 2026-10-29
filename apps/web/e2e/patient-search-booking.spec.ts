import { test, expect } from '@playwright/test';

test.describe('Patient Creation to Appointment Booking Search Flow', () => {
  test('should find a newly added patient in the appointment booking search and book successfully', async ({ page }) => {
    // 1. Log in or go to patients page
    await page.goto('/patients');

    // 2. Open "+ Nouveau Patient" modal
    const newPatientBtn = page.locator('button:has-text("+ Nouveau Patient")');
    await expect(newPatientBtn).toBeVisible();
    await newPatientBtn.click();

    // 3. Fill in new patient details
    await page.fill('#new-patient-first-name', 'Othmane');
    await page.fill('#new-patient-last-name', 'Tazi');
    await page.fill('#new-patient-cin', 'BK998877');
    await page.fill('#new-patient-phone', '+212611223344');

    // Save patient
    const saveBtn = page.locator('button[type="submit"]:has-text("Enregistrer le Patient")');
    await saveBtn.click();

    // Verify patient is displayed in the list
    await expect(page.getByRole('heading', { name: 'Othmane Tazi' })).toBeVisible();

    // 4. Navigate to Agenda
    await page.locator('nav a[href="/agenda"]').first().click();
    await expect(page).toHaveURL(/\/agenda/);

    // 5. Open "+ Nouveau RDV"
    const newRdvBtn = page.locator('button:has-text("+ Nouveau RDV")');
    await expect(newRdvBtn).toBeVisible();
    await newRdvBtn.click();

    // Verify modal is open
    await expect(page.locator('text=Nouveau rendez-vous')).toBeVisible();

    // 6. Search for newly added patient by first name
    const searchInput = page.locator('#patient-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Othmane');

    // 7. Verify Othmane Tazi appears in search results
    const patientResult = page.locator('button:has-text("Othmane Tazi")');
    await expect(patientResult).toBeVisible();
    await expect(page.getByText('BK998877')).toBeVisible();

    // 8. Select patient
    await patientResult.click();

    // Verify selected patient summary
    await expect(page.locator('text=Changer')).toBeVisible();

    // 9. Submit appointment
    const submitBtn = page.locator('button[type="submit"]:has-text("Confirmer le rendez-vous")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 10. Verify modal closes and appointment is confirmed
    await expect(page.locator('text=Nouveau rendez-vous')).not.toBeVisible();
  });
});
