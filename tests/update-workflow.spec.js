const { test, expect } = require('@playwright/test');
require('dotenv').config();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Update Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#dashboard');
    await expect(page.locator('#main-content h2')).toHaveText('Dashboard', { timeout: 10000 });
  });

  test('should display update form with all required fields', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Verify all form fields are present
    await expect(page.locator('#update-task')).toBeVisible();
    await expect(page.locator('#update-narrative')).toBeVisible();
    await expect(page.locator('#update-percent')).toBeVisible();
    await expect(page.locator('#update-blockers')).toBeVisible();
    await expect(page.locator('#update-short-status')).toBeVisible();
    
    // Verify both buttons are present
    await expect(page.locator('#save-draft-btn')).toBeVisible();
    await expect(page.locator('#new-update-form button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors when submitting empty form', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Clear the short status default selection
    await page.selectOption('#update-short-status', '');
    
    // Try to submit without filling required fields
    await page.click('#new-update-form button[type="submit"]');
    
    // Wait a moment for validation to apply
    await page.waitForTimeout(500);
    
    // Verify validation errors are shown
    await expect(page.locator('#update-narrative.is-invalid')).toBeVisible();
    await expect(page.locator('#update-percent.is-invalid')).toBeVisible();
    await expect(page.locator('#update-short-status.is-invalid')).toBeVisible();
    
    // Modal should still be visible
    await expect(page.locator('#new-update-modal.show')).toBeVisible();
  });

  test('should validate percent complete range', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Fill in other required fields
    await page.fill('#update-narrative', 'Test narrative');
    await page.selectOption('#update-short-status', 'In Progress');
    
    // Test invalid value (over 100)
    await page.fill('#update-percent', '150');
    await page.click('#new-update-form button[type="submit"]');
    await page.waitForTimeout(500);
    await expect(page.locator('#update-percent.is-invalid')).toBeVisible();
    
    // Test invalid value (negative)
    await page.fill('#update-percent', '-10');
    await page.click('#new-update-form button[type="submit"]');
    await page.waitForTimeout(500);
    await expect(page.locator('#update-percent.is-invalid')).toBeVisible();
  });

  test('should save draft successfully', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Fill in partial form data (drafts don't require all fields)
    const taskOptions = await page.locator('#update-task option').count();
    if (taskOptions > 1) {
      await page.selectOption('#update-task', { index: 1 });
    }
    await page.fill('#update-narrative', 'Draft narrative for testing');
    await page.fill('#update-percent', '25');
    
    // Handle the alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('Draft saved successfully!');
      await dialog.accept();
    });
    
    // Click save draft
    await page.click('#save-draft-btn');
    
    // Wait for modal to close
    await page.waitForSelector('#new-update-modal', { state: 'hidden', timeout: 5000 });
    
    // Verify modal is closed
    await expect(page.locator('#new-update-modal.show')).not.toBeVisible();
  });

  test('should submit update successfully with all required fields', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Fill in all required fields
    const taskOptions = await page.locator('#update-task option').count();
    if (taskOptions > 1) {
      await page.selectOption('#update-task', { index: 1 });
    }
    await page.fill('#update-narrative', 'Complete narrative for submission');
    await page.fill('#update-percent', '75');
    await page.fill('#update-blockers', 'Waiting for API documentation');
    await page.selectOption('#update-short-status', 'In Progress');
    
    // Handle the alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('Update submitted successfully!');
      await dialog.accept();
    });
    
    // Submit the form
    await page.click('#new-update-form button[type="submit"]');
    
    // Wait for modal to close
    await page.waitForSelector('#new-update-modal', { state: 'hidden', timeout: 5000 });
    
    // Verify modal is closed
    await expect(page.locator('#new-update-modal.show')).not.toBeVisible();
  });

  test('should reset form when modal is closed', async ({ page }) => {
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Fill in some data
    await page.fill('#update-narrative', 'Test data');
    await page.fill('#update-percent', '50');
    
    // Close modal
    await page.click('#new-update-modal .btn-close');
    await page.waitForSelector('#new-update-modal', { state: 'hidden', timeout: 5000 });
    
    // Reopen modal
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Verify form is reset
    await expect(page.locator('#update-narrative')).toHaveValue('');
    await expect(page.locator('#update-percent')).toHaveValue('');
  });

  test('should display updated data in dashboard after submission', async ({ page }) => {
    // Get initial task count
    const initialRows = await page.locator('#tasks-table tbody tr').count();
    
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    // Fill and submit form
    const taskOptions = await page.locator('#update-task option').count();
    if (taskOptions > 1) {
      await page.selectOption('#update-task', { index: 1 });
    }
    const testNarrative = 'Dashboard refresh test narrative';
    await page.fill('#update-narrative', testNarrative);
    await page.fill('#update-percent', '90');
    await page.selectOption('#update-short-status', 'Complete');
    
    // Handle the alert dialog
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('#new-update-form button[type="submit"]');
    await page.waitForSelector('#new-update-modal', { state: 'hidden', timeout: 5000 });
    
    // Wait for dashboard to reload
    await page.waitForTimeout(1000);
    
    // Verify the table has been updated (should show the new data)
    const tableText = await page.locator('#tasks-table').textContent();
    expect(tableText).toContain('90%');
  });

  test('should populate task dropdown with assigned tasks', async ({ page }) => {
    // Verify that the task dropdown is populated with the user's assigned tasks
    await page.click('#new-update-btn');
    await page.waitForSelector('#new-update-modal.show', { timeout: 10000 });
    
    const taskSelect = page.locator('#update-task');
    const taskOptions = await taskSelect.locator('option').count();
    
    // User should have at least one task assigned
    expect(taskOptions).toBeGreaterThan(0);
    
    // Task select should be enabled when tasks are available
    const isDisabled = await taskSelect.isDisabled();
    expect(isDisabled).toBe(false);
    
    // Verify the select has the required attribute
    const isRequired = await taskSelect.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });
});
