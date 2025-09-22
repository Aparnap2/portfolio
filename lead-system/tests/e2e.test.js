const { test, expect } = require('@playwright/test');

test.describe('Lead System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start with dashboard page
    await page.goto('http://localhost:3000/leads');
  });

  test('should submit lead through web form', async ({ page }) => {
    // Fill lead form
    await page.fill('input[placeholder="First Name"]', 'John');
    await page.fill('input[placeholder="Last Name"]', 'Doe');
    await page.fill('input[placeholder="Email"]', 'john.doe@testcorp.com');
    await page.fill('input[placeholder="Company"]', 'TestCorp Inc');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    console.log(await page.content());
    await expect(page.locator('text=/Lead submitted!/')).toBeVisible();
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Check stats are visible
    await expect(page.locator('text=Total Leads')).toBeVisible();
    await expect(page.locator('text=Processed')).toBeVisible();
    await expect(page.locator('text=Avg Score')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.fill('input[placeholder="Email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('input[placeholder="Email"]:invalid')).toBeVisible();
  });
});
