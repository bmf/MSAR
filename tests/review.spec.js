const { test, expect } = require('@playwright/test');

// NOTE: These tests require a Team Lead user to be set up in Supabase.
// See database/migrations/0004_phase6_test_data.sql for setup instructions.
// Team Lead credentials (UUID: a4fde722-7859-467c-9740-9d5739e131cd)
const TEAM_LEAD_EMAIL = 'teamlead@example.com';
const TEAM_LEAD_PASSWORD = 'TestPassword123!';

test.describe('Review Queue', () => {
  // Test with Team Lead account
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    // Login as team lead
    await page.fill('#email', TEAM_LEAD_EMAIL);
    await page.fill('#password', TEAM_LEAD_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#dashboard', { timeout: 10000 });
    await expect(page.locator('#main-content h2')).toHaveText('Dashboard', { timeout: 10000 });
  });

  test('should show Review Queue link in navigation for team leads', async ({ page }) => {
    await expect(page.locator('#main-nav a[href="#review"]')).toBeVisible();
  });

  test('should navigate to review queue page', async ({ page }) => {
    await page.click('#main-nav a[href="#review"]');
    await page.waitForURL('**/#review');
    await expect(page.locator('#main-content h2')).toHaveText('Review Queue', { timeout: 10000 });
  });

  test('should display review table with correct columns', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table');
    await expect(page.locator('#review-table thead tr th')).toHaveCount(6);
    await expect(page.locator('#review-table thead tr th').nth(0)).toHaveText('Task Name');
    await expect(page.locator('#review-table thead tr th').nth(1)).toHaveText('Submitted By');
    await expect(page.locator('#review-table thead tr th').nth(2)).toHaveText('Submitted At');
    await expect(page.locator('#review-table thead tr th').nth(3)).toHaveText('% Complete');
    await expect(page.locator('#review-table thead tr th').nth(4)).toHaveText('Short Status');
    await expect(page.locator('#review-table thead tr th').nth(5)).toHaveText('Actions');
  });

  test('should show pending submissions for team members', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    // Check if table has content or shows "No pending submissions" message
    const hasRows = await page.locator('#review-table tbody tr').count();
    expect(hasRows).toBeGreaterThan(0);
  });

  test('should open review modal when clicking review button', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    
    // Check if there are any review buttons
    const reviewButtons = page.locator('.review-btn');
    const count = await reviewButtons.count();
    
    if (count > 0) {
      await reviewButtons.first().click();
      await page.waitForSelector('#review-detail-modal.show', { timeout: 10000 });
      await expect(page.locator('#review-form')).toBeVisible();
      await expect(page.locator('#review-narrative')).toBeVisible();
      await expect(page.locator('#review-percent')).toBeVisible();
      await expect(page.locator('#review-blockers')).toBeVisible();
      await expect(page.locator('#review-short-status')).toBeVisible();
      await expect(page.locator('#review-comments')).toBeVisible();
      await expect(page.locator('#approve-btn')).toBeVisible();
      await expect(page.locator('#approve-with-changes-btn')).toBeVisible();
      await expect(page.locator('#reject-btn')).toBeVisible();
    }
  });

  test('should display submission details in modal', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    
    const reviewButtons = page.locator('.review-btn');
    const count = await reviewButtons.count();
    
    if (count > 0) {
      await reviewButtons.first().click();
      await page.waitForSelector('#review-detail-modal.show', { timeout: 10000 });
      await expect(page.locator('#review-details')).toBeVisible();
      await expect(page.locator('#review-details')).toContainText('Task:');
      await expect(page.locator('#review-details')).toContainText('Submitted By:');
      await expect(page.locator('#review-details')).toContainText('Submitted At:');
    }
  });

  test('should require comments when rejecting a submission', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    
    const reviewButtons = page.locator('.review-btn');
    const count = await reviewButtons.count();
    
    if (count > 0) {
      await reviewButtons.first().click();
      await page.waitForSelector('#review-detail-modal.show', { timeout: 10000 });
      
      // Try to reject without comments
      await page.click('#reject-btn');
      await expect(page.locator('#review-form-error')).toBeVisible();
      await expect(page.locator('#review-form-error')).toContainText('Please provide comments');
    }
  });

  test('should approve submission successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    
    const reviewButtons = page.locator('.review-btn');
    const count = await reviewButtons.count();
    
    if (count > 0) {
      await reviewButtons.first().click();
      await page.waitForSelector('#review-detail-modal.show', { timeout: 10000 });
      
      // Click approve button
      page.once('dialog', dialog => dialog.accept());
      await page.click('#approve-btn');
      
      // Wait for modal to close and table to refresh
      await page.waitForSelector('#review-detail-modal', { state: 'hidden', timeout: 10000 });
    }
  });

  test('should approve submission with changes', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    
    const reviewButtons = page.locator('.review-btn');
    const count = await reviewButtons.count();
    
    if (count > 0) {
      await reviewButtons.first().click();
      await page.waitForSelector('#review-detail-modal.show', { timeout: 10000 });
      
      // Modify the narrative
      await page.fill('#review-narrative', 'Modified narrative by team lead');
      await page.fill('#review-comments', 'Updated the narrative for clarity');
      
      // Click approve with changes button
      page.once('dialog', dialog => dialog.accept());
      await page.click('#approve-with-changes-btn');
      
      // Wait for modal to close
      await page.waitForSelector('#review-detail-modal', { state: 'hidden', timeout: 10000 });
    }
  });

  test('should reject submission with comments', async ({ page }) => {
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody');
    
    const reviewButtons = page.locator('.review-btn');
    const count = await reviewButtons.count();
    
    if (count > 0) {
      await reviewButtons.first().click();
      await page.waitForSelector('#review-detail-modal.show', { timeout: 10000 });
      
      // Add rejection comments
      await page.fill('#review-comments', 'Please provide more details in the narrative');
      
      // Click reject button
      page.once('dialog', dialog => dialog.accept());
      await page.click('#reject-btn');
      
      // Wait for modal to close
      await page.waitForSelector('#review-detail-modal', { state: 'hidden', timeout: 10000 });
    }
  });
});

test.describe('Review Queue - Permission Checks', () => {
  test('should not show Review Queue link for team members', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    // Login as regular team member
    await page.fill('#email', 'flade@falconwood.biz');
    await page.fill('#password', 'New25Password!@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#dashboard', { timeout: 10000 });
    
    // Review Queue link should not be visible for team members
    const reviewLink = page.locator('#main-nav a[href="#review"]');
    await expect(reviewLink).not.toBeVisible();
  });

  test('should show empty queue or submissions for team lead', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    await page.fill('#email', TEAM_LEAD_EMAIL);
    await page.fill('#password', TEAM_LEAD_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#dashboard', { timeout: 10000 });
    
    await page.goto('http://localhost:3000/#review');
    await page.waitForSelector('#review-table tbody', { timeout: 10000 });
    
    // Should show message if no pending submissions or display rows
    const tableContent = await page.locator('#review-table tbody').textContent();
    // Either has rows or shows "No pending submissions" message
    expect(tableContent).toBeTruthy();
  });
});
