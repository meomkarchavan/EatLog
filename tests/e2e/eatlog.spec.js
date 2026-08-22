import { test, expect } from '@playwright/test';

test.describe('EatLog E2E Functional & UI Automation Suite', () => {
  // Use single deterministic E2E user so we never spam Firebase Auth with duplicate users
  const testEmail = 'e2e_runner@eatlog.app';
  const testPassword = 'TestPassword123!';

  test('Complete End-to-End User Flow: Auth -> Goals Profile -> HUD -> Water & Weight -> Meal Logging & Editing -> Retroactive -> Weekly View', async ({ page }) => {
    test.setTimeout(60000);

    // Mock /api/logMeal for deterministic, ultra-fast E2E test runs
    await page.route('**/api/logMeal', async (route) => {
      const json = {
        food_summary: '2 chapatis and 1 bowl dal',
        calories: 350,
        protein_g: 14,
        carbs_g: 45,
        fat_g: 8,
        fiber_g: 6,
        is_valid: true,
        error_message: null,
      };
      await route.fulfill({ json });
    });

    // Handle browser console logs and errors
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));

    // Handle any browser alert dialogs automatically
    page.on('dialog', async (dialog) => {
      console.log('Dialog opened:', dialog.message());
      await dialog.dismiss();
    });

    // 1. Visit App
    await page.goto('/');

    // 2. Wait for auth state initialization to finish (either AuthScreen or Dashboard)
    await expect(page.locator('#auth-email, #tab-daily').first()).toBeVisible({ timeout: 20000 });

    // If AuthScreen is displayed, log in (or sign up)
    const emailInput = page.locator('#auth-email');
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail);
      await page.locator('#auth-password').fill(testPassword);
      await page.locator('#auth-submit').click();

      // If sign in returns error (e.g. invalid credential), toggle to sign up and submit
      const errorMsg = page.locator('p.text-red-400');
      const hasError = await errorMsg.isVisible({ timeout: 4000 }).catch(() => false);
      if (hasError) {
        const toggleSignUp = page.locator('#auth-toggle');
        if (await toggleSignUp.isVisible()) {
          await toggleSignUp.click();
          await page.locator('#auth-email').fill(testEmail);
          await page.locator('#auth-password').fill(testPassword);
          await page.locator('#auth-submit').click();
        }
      }
    }

    // 3. Verify Dashboard HUD (Primary & Secondary Macros)
    await expect(page.locator('#tab-daily')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('CALORIES', { exact: false })).toBeVisible();
    await expect(page.getByText('PROTEIN', { exact: false })).toBeVisible();
    await expect(page.getByText('CARBS', { exact: false })).toBeVisible();
    await expect(page.getByText('FAT', { exact: false })).toBeVisible();
    await expect(page.getByText('FIBER', { exact: false })).toBeVisible();

    // 4. Test "Profile & Goals" Setup (Dynamic Target Engine)
    const profileTab = page.locator('#tab-profile');
    await expect(profileTab).toBeVisible();
    await profileTab.click();

    await expect(page.getByText('Profile & Goals')).toBeVisible({ timeout: 8000 });
    await page.locator('#profile-height').fill('180');
    await page.locator('#profile-age').fill('28');
    await page.locator('#profile-weight').fill('78');
    await page.locator('#save-profile-btn').click();
    await expect(page.getByText(/Profile saved!/i).first()).toBeVisible({ timeout: 10000 });

    // Return to Daily Tab and verify Dynamic Targets in HUD
    await page.locator('#tab-daily').click();
    await expect(page.getByText(/\/ \d+ kcal/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/\/ \d+g/i).first()).toBeVisible();

    // 5. Test Water Tracking
    const addWaterBtn = page.locator('#add-water-btn');
    await expect(addWaterBtn).toBeVisible();
    await addWaterBtn.click();
    await expect(page.getByText(/0\.25\s*L/i)).toBeVisible({ timeout: 10000 });

    // 6. Test Body Weight Tracking
    const weightInput = page.locator('#weight-input');
    if (await weightInput.isVisible()) {
      await weightInput.fill('78.0');
      await page.locator('#save-weight-btn').click();
      await expect(page.getByText('78').first()).toBeVisible({ timeout: 10000 });
    }

    // 7. Test Zero-Friction Meal Logging via Text
    const mealInput = page.locator('#meal-input');
    const submitBtn = page.locator('#submit-btn');

    await expect(mealInput).toBeVisible();
    await mealInput.fill('2 chapatis and 1 bowl dal');
    await submitBtn.click();

    // Verify meal appears in feed
    await expect(page.getByText(/chapati/i).first()).toBeVisible({ timeout: 15000 });

    // 8. Test Meal Editing & Pinning Feature
    const editMealBtn = page.getByTestId('edit-meal-btn').first();
    await expect(editMealBtn).toBeVisible({ timeout: 10000 });
    await editMealBtn.click();

    await expect(page.getByText('Edit Meal Log')).toBeVisible();
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();

    // Test Pin to Staples
    const pinBtn = page.getByTestId('pin-staple-btn').first();
    if (await pinBtn.isVisible()) {
      await pinBtn.click();
      await expect(page.getByText(/(Pinned to|Removed from) staples/i).first()).toBeVisible({ timeout: 5000 });
    }

    // 9. Test Staples Modal
    const staplesBtn = page.locator('#staples-btn');
    if (await staplesBtn.isVisible()) {
      await staplesBtn.click();
      await expect(page.getByText('My Staples')).toBeVisible({ timeout: 5000 });
      // Close modal by clicking backdrop or close button
      const closeBtn = page.locator('button:has-text("✕"), button[aria-label="Close"], button svg.w-5.h-5').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // 10. Test Quick Lookup Panel
    const lookupTab = page.locator('#tab-lookup');
    if (await lookupTab.isVisible()) {
      await lookupTab.click();
      await expect(page.getByText('Quick Lookup')).toBeVisible({ timeout: 5000 });
      const lookupInput = page.locator('#lookup-input');
      await lookupInput.fill('2 chapatis');
      await page.locator('#lookup-submit-btn').click();
      await expect(page.getByText(/chapatis/i).first()).toBeVisible({ timeout: 10000 });
      // Return to Daily tab
      await page.locator('#tab-daily').click();
    }

    // 11. Test Custom DatePicker Modal Navigation
    const calendarBtn = page.locator('button[title="Change logging date"]');
    if (await calendarBtn.isVisible()) {
      await calendarBtn.click();
      await expect(page.getByRole('button', { name: /go to today/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /go to today/i }).click();
      await expect(page.getByText("Today's Intake")).toBeVisible();
    }

    // 12. Test Weekly Dashboard & Charts View
    const weeklyTab = page.locator('#tab-weekly');
    await weeklyTab.click();

    await expect(page.getByText(/Protein Avg/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Calories Avg/i)).toBeVisible();
    await expect(page.getByText(/Water Avg/i)).toBeVisible();
    await expect(page.getByText(/Daily Protein \(Last 7 Days\)/i)).toBeVisible();
    await expect(page.getByText(/Daily Calories \(Last 7 Days\)/i)).toBeVisible();
    await expect(page.getByText(/Daily Water Intake \(Last 7 Days\)/i)).toBeVisible();
    await expect(page.getByText(/Body Weight \(Last 7 Days\)/i)).toBeVisible();
    await expect(page.getByText(/90-Day Protein Consistency/i)).toBeVisible();

    // 13. Test CSV Export in Goals / Profile Tab
    await profileTab.click();
    const exportBtn = page.locator('#export-csv-btn');
    await expect(exportBtn).toBeVisible({ timeout: 5000 });

    // Return to Daily View
    await page.locator('#tab-daily').click();
    await expect(page.getByText("Today's Intake")).toBeVisible();
  });
});
