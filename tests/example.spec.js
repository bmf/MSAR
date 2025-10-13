const { test, expect } = require('@playwright/test');

test('homepage has correct title and header', async ({ page }) => {
  // Navigate to the running server
  await page.goto('http://localhost:3000');

  // The header should be visible almost immediately
  const heading = page.locator('header h4');
  await expect(heading).toBeVisible({ timeout: 10000 });
  await expect(heading).toHaveText('MSR Webform');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/MSR Webform/);
});
