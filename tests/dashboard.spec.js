const { test, expect } = require('@playwright/test');
require('dotenv').config();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#dashboard');
    await expect(page.locator('#main-content h2')).toHaveText('Dashboard', { timeout: 10000 });
  });

  test('should show dashboard controls and table', async ({ page }) => {
    await expect(page.locator('#new-update-btn')).toBeVisible();
    await expect(page.locator('#filter-status')).toBeVisible();
    await expect(page.locator('#sort-by')).toBeVisible();
    await expect(page.locator('#tasks-table')).toBeVisible();
    await expect(page.locator('#tasks-table thead tr th')).toHaveCount(9);
  });

  test('should persist filter and sort selections across reload', async ({ page }) => {
    await page.selectOption('#filter-status', { label: 'In Progress' });
    await page.selectOption('#sort-by', { value: 'due_date_desc' });
    await page.reload();
    await page.waitForSelector('#tasks-table');
    await expect(page.locator('#filter-status')).toHaveValue('In Progress');
    await expect(page.locator('#sort-by')).toHaveValue('due_date_desc');
  });

  test('should open the create new task update modal', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    await expect(page.locator('#new-update-form')).toBeVisible();
    await expect(page.locator('#update-task')).toBeVisible();
    await expect(page.locator('#update-narrative')).toBeVisible();
    await expect(page.locator('#update-percent')).toBeVisible();
    await expect(page.locator('#save-draft-btn')).toBeVisible();
  });
});
