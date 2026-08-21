import { test, expect } from '@playwright/test';

test.describe('EatLog E2E Functional & UI Automation Suite', () => {
  const testEmail = `eatlog_e2e_${Date.now()}@example.com`;
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

    // Handle any browser alert dialogs automatically
    page.on('dialog', async (dialog) => {
      console.log('Dialog opened:', dialog.message());
      await dialog.dismiss();
    });

    // 1. Visit App
    await page.goto('/');

    // 2. Auth Flow: If already logged in, sign out to test auth flow cleanly
    const signOutBtn = page.locator('#sign-out-btn');
    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutBtn.click();
    }
    await expect(page.locator('#auth-email')).toBeVisible({ timeout: 20000 });
    
    const toggleSignUp = page.locator('#auth-toggle');
    const isSignUpBtnVisible = await page.getByRole('button', { name: /create account/i }).isVisible().catch(() => false);
    if (!isSignUpBtnVisible && await toggleSignUp.isVisible()) {
      await toggleSignUp.click();
    }

    await page.locator('#auth-email').fill(testEmail);
    await page.locator('#auth-password').fill(testPassword);
    await page.locator('#auth-submit').click();

    // 3. Verify Dashboard HUD (Primary & Secondary Macros)
    await expect(page.locator('#tab-daily')).toBeVisible({ timeout: 15000 });
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
    await expect(page.getByText(/Profile saved!/i)).toBeVisible({ timeout: 10000 });

    // Return to Daily Tab and verify Dynamic Targets in HUD
    await page.locator('#tab-daily').click();
    await expect(page.getByText(/\/ \d+ kcal/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/\/ \d+g/i)).toBeVisible();

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
      await expect(page.getByText('78')).toBeVisible({ timeout: 10000 });
    }

    // 7. Test Zero-Friction Meal Logging via Text
    const mealInput = page.locator('#meal-input');
    const submitBtn = page.locator('#submit-btn');

    await expect(mealInput).toBeVisible();
    await mealInput.fill('2 chapatis and 1 bowl dal');
    await submitBtn.click();

    // Verify meal appears in feed
    await expect(page.getByText(/chapati/i)).toBeVisible({ timeout: 15000 });

    // 8. Test Meal Editing Feature
    const editMealBtn = page.getByTestId('edit-meal-btn').first();
    await expect(editMealBtn).toBeVisible({ timeout: 10000 });
    await editMealBtn.click();

    await expect(page.getByText('Edit Meal Log')).toBeVisible();
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();

    // 9. Test Retroactive Date Picker Navigation
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeAttached();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    await dateInput.fill(yesterdayStr);

    // Verify "Reset to Today" appears
    await expect(page.getByRole('button', { name: /reset/i })).toBeVisible({ timeout: 5000 });

    // Click Reset
    await page.getByRole('button', { name: /reset/i }).click();
    await expect(page.getByText("Today's Intake")).toBeVisible();

    // 10. Test Weekly Dashboard & Charts View
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

    // Return to Daily View
    const dailyTab = page.locator('#tab-daily');
    await dailyTab.click();
    await expect(page.getByText("Today's Intake")).toBeVisible();
  });
});
