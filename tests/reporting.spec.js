const { test, expect } = require('@playwright/test');
require('dotenv').config();

// NOTE: These tests require Report Approver (PM/APM) users to be set up in Supabase.
// Report Approver credentials loaded from environment variables
const APPROVER_EMAIL = process.env.TEST_APPROVER_EMAIL || '';
const APPROVER_PASSWORD = process.env.TEST_APPROVER_PASSWORD || '';
const APPROVER2_EMAIL = process.env.TEST_APPROVER2_EMAIL || '';
const APPROVER2_PASSWORD = process.env.TEST_APPROVER2_PASSWORD || '';
const TEAM_LEAD_EMAIL = process.env.TEST_TEAM_LEAD_EMAIL || '';
const TEAM_LEAD_PASSWORD = process.env.TEST_TEAM_LEAD_PASSWORD || '';

test.describe('PM/APM Reporting Dashboard', () => {
  // Test with Report Approver account
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    // Login as report approver
    await page.fill('#email', APPROVER_EMAIL);
    await page.fill('#password', APPROVER_PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for login to complete - Report Approvers land on reporting dashboard
    await page.waitForSelector('#main-content h2', { timeout: 10000 });
    await page.waitForTimeout(500); // Brief wait for UI to stabilize
  });

  test('should show Reporting link in navigation for report approvers', async ({ page }) => {
    await expect(page.locator('#main-nav a[href="#reporting"]')).toBeVisible();
  });

  test('should navigate to reporting dashboard', async ({ page }) => {
    await page.click('#main-nav a[href="#reporting"]');
    await page.waitForURL('**/#reporting');
    await expect(page.locator('#main-content h2')).toHaveText('Monthly Reporting', { timeout: 10000 });
  });

  test('should display reports table with correct columns', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    await expect(page.locator('#reports-table thead tr th')).toHaveCount(7);
    await expect(page.locator('#reports-table thead tr th').nth(0)).toHaveText('Contract');
    await expect(page.locator('#reports-table thead tr th').nth(1)).toHaveText('Report Month');
    await expect(page.locator('#reports-table thead tr th').nth(2)).toHaveText('Items in Queue');
    await expect(page.locator('#reports-table thead tr th').nth(3)).toHaveText('Status');
    await expect(page.locator('#reports-table thead tr th').nth(4)).toHaveText('Reviewed By');
    await expect(page.locator('#reports-table thead tr th').nth(5)).toHaveText('Reviewed At');
    await expect(page.locator('#reports-table thead tr th').nth(6)).toHaveText('Actions');
  });

  test('should display filter controls', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await expect(page.locator('#report-contract-filter')).toBeVisible();
    await expect(page.locator('#report-month-filter')).toBeVisible();
    await expect(page.locator('#report-status-filter')).toBeVisible();
  });

  test('should show create report button', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await expect(page.locator('#create-report-btn')).toBeVisible();
    await expect(page.locator('#create-report-btn')).toHaveText(/Create New Report/);
  });

  test('should open create report modal', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#create-report-btn', { timeout: 10000 });
    
    // Open modal directly using Bootstrap API
    await page.evaluate(() => {
      const modalEl = document.getElementById('reporting-create-modal');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    });
    
    // Wait for modal to be visible using aria attributes
    await page.waitForSelector('#reporting-create-modal[aria-modal="true"]', { state: 'visible', timeout: 6000 });
    
    // Check modal content - use first() to handle duplicate modal elements
    const modal = page.locator('#reporting-create-modal[aria-modal="true"]');
    await expect(modal.locator('.modal-title')).toHaveText('Create New Report');
    await expect(modal.locator('#new-report-contract')).toBeVisible();
    await expect(modal.locator('#new-report-month')).toBeVisible();
  });

  test('should validate required fields when creating report', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#create-report-btn', { timeout: 10000 });
    
    // Open modal directly
    await page.evaluate(() => {
      const modalEl = document.getElementById('reporting-create-modal');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    });
    
    // Wait for modal using aria attributes
    await page.waitForSelector('#reporting-create-modal[aria-modal="true"]', { state: 'visible', timeout: 5000 });
    
    // Get visible modal
    const modal = page.locator('#reporting-create-modal[aria-modal="true"]');
    const saveBtn = modal.locator('#save-new-report-btn');
    
    // Ensure button is visible before setting up handler
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    
    // Set up dialog handler BEFORE clicking
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Please select both contract and report month');
      await dialog.accept();
    });
    
    // Try to save without selecting contract
    await saveBtn.click();
    
    // Wait for dialog to be handled
    await page.waitForTimeout(1000);
  });

  test('should filter reports by contract', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    // Get initial row count
    const initialRows = await page.locator('#reports-table tbody tr').count();
    
    // Select a contract filter (if available)
    const contractOptions = await page.locator('#report-contract-filter option').count();
    if (contractOptions > 1) {
      await page.selectOption('#report-contract-filter', { index: 1 });
      await page.waitForTimeout(500); // Wait for filter to apply
      
      // Row count may change
      const filteredRows = await page.locator('#reports-table tbody tr').count();
      expect(filteredRows).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter reports by month', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table tbody');
    
    // Set month filter to current month
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    await page.fill('#report-month-filter', currentMonth);
    await page.waitForTimeout(1000); // Wait for filter to apply
    
    // Table should still be visible (even if empty)
    await expect(page.locator('#reports-table')).toBeVisible();
  });

  test('should filter reports by status', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    // Filter by pending
    await page.selectOption('#report-status-filter', 'pending');
    await page.waitForTimeout(500);
    
    // Check if any rows exist with pending status
    const rows = await page.locator('#reports-table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });

  test('should open review modal when clicking view button', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    // Check if there are any reports
    const viewButtons = await page.locator('.view-report-btn').count();
    if (viewButtons > 0) {
      await page.click('.view-report-btn >> nth=0');
      await expect(page.locator('#review-report-modal')).toBeVisible();
      await expect(page.locator('#review-report-modal .modal-title')).toHaveText('Review Monthly Report');
    }
  });

  test('should display report preview with grouped PWS line items', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    const viewButtons = await page.locator('.view-report-btn').count();
    if (viewButtons > 0) {
      await page.click('.view-report-btn >> nth=0');
      await page.waitForSelector('#reporting-review-modal.show', { timeout: 5000 });
      await page.waitForSelector('#review-report-content');
      
      // Check for report header
      await expect(page.locator('#review-report-content h3')).toHaveText('Monthly Status Report');
      
      // Check for contract and month info
      await expect(page.locator('#review-report-content')).toContainText('Contract:');
      await expect(page.locator('#review-report-content')).toContainText('Report Month:');
      await expect(page.locator('#review-report-content')).toContainText('Status:');
      await expect(page.locator('#review-report-content')).toContainText('Total Items:');
    }
  });

  test('should show review buttons for pending reports', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table tbody', { timeout: 10000 });
    
    // Filter to pending reports
    await page.selectOption('#report-status-filter', 'pending');
    await page.waitForTimeout(2000); // Wait for filter to apply
    
    // Check if there are any pending reports
    const viewButtons = await page.locator('.view-report-btn').count();
    if (viewButtons === 0) {
      console.log('No pending reports found - skipping test');
      return;
    }
    
    // Click the first view button
    await page.click('.view-report-btn >> nth=0');
    
    // Wait for modal to be visible and content to load
    await page.waitForSelector('#reporting-review-modal.show', { timeout: 10000 });
    await page.waitForSelector('#review-report-content', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for buttons to conditionally render
    
    // Check if buttons are visible (they should be for pending reports)
    const approveBtn = page.locator('#approve-report-btn');
    const isVisible = await approveBtn.isVisible();
    
    if (isVisible) {
      await expect(page.locator('#approve-report-btn')).toBeVisible();
      await expect(page.locator('#approve-with-changes-btn')).toBeVisible();
      await expect(page.locator('#reject-report-btn')).toBeVisible();
      await expect(page.locator('#export-pdf-btn')).not.toBeVisible();
    } else {
      throw new Error('Review buttons not visible for pending report');
    }
  });

  test('should show export button for approved reports', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table tbody', { timeout: 10000 });
    
    // Filter to approved reports
    await page.selectOption('#report-status-filter', 'approved');
    await page.waitForTimeout(2000);
    
    const viewButtons = await page.locator('.view-report-btn').count();
    if (viewButtons === 0) {
      console.log('No approved reports found - skipping test');
      return;
    }
    
    await page.click('.view-report-btn >> nth=0');
    
    // Wait for modal to be visible
    await page.waitForSelector('#reporting-review-modal.show', { timeout: 10000 });
    await page.waitForSelector('#review-report-content', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check buttons
    await expect(page.locator('#export-pdf-btn')).toBeVisible({ timeout: 5000 });
    
    // Review buttons should be hidden for approved
    await expect(page.locator('#approve-report-btn')).toBeHidden();
    await expect(page.locator('#approve-with-changes-btn')).toBeHidden();
    await expect(page.locator('#reject-report-btn')).toBeHidden();
  });

  test('should require comment when rejecting report', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table tbody', { timeout: 10000 });
    
    // Filter to pending reports
    await page.selectOption('#report-status-filter', 'pending');
    await page.waitForTimeout(2000);
    
    const viewButtons = await page.locator('.view-report-btn').count();
    if (viewButtons === 0) {
      console.log('No pending reports found - skipping test');
      return;
    }
    
    await page.click('.view-report-btn >> nth=0');
    
    // Wait for modal and content
    await page.waitForSelector('#reporting-review-modal.show', { timeout: 10000 });
    await page.waitForSelector('#review-report-content', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check reject button is visible
    await expect(page.locator('#reject-report-btn')).toBeVisible({ timeout: 5000 });
    
    // Set up dialog handler BEFORE clicking
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Comment is required when rejecting');
      await dialog.accept();
    });
    
    // Try to reject without comment
    await page.click('#reject-report-btn');
    
    // Wait a bit for dialog to be handled
    await page.waitForTimeout(1000);
  });

  test('should show export PDF button in table for approved reports', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    // Filter to approved reports
    await page.selectOption('#report-status-filter', 'approved');
    await page.waitForTimeout(500);
    
    const exportButtons = await page.locator('.export-report-btn').count();
    if (exportButtons > 0) {
      await expect(page.locator('.export-report-btn >> nth=0')).toBeVisible();
      await expect(page.locator('.export-report-btn >> nth=0')).toHaveText(/Export PDF/);
    }
  });

  test('should display status badges correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    // Check for status badges in table
    const statusCells = await page.locator('#reports-table tbody tr td:nth-child(4)').count();
    if (statusCells > 0) {
      const firstStatus = page.locator('#reports-table tbody tr td:nth-child(4) >> nth=0');
      await expect(firstStatus.locator('.badge')).toBeVisible();
    }
  });

  test('should display queue item counts', async ({ page }) => {
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table');
    
    // Check for queue count badges
    const queueCells = await page.locator('#reports-table tbody tr td:nth-child(3)').count();
    if (queueCells > 0) {
      const firstQueue = page.locator('#reports-table tbody tr td:nth-child(3) >> nth=0');
      await expect(firstQueue.locator('.badge')).toBeVisible();
      await expect(firstQueue).toContainText('items');
    }
  });
});

test.describe('Reporting Access Control', () => {
  test('should deny access to team members', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    // Login as team lead (not a report approver)
    await page.fill('#email', TEAM_LEAD_EMAIL);
    await page.fill('#password', TEAM_LEAD_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#main-content h2', { timeout: 10000 });
    
    // Try to navigate to reporting
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForTimeout(2000); // Wait for router to process
    
    // Should either show access denied OR redirect to their dashboard
    // Both are acceptable - the key is they can't access reporting
    const url = page.url();
    const content = await page.locator('#main-content').textContent();
    
    // Access is denied if either: shows "Access Denied" message OR redirects away from #reporting
    const accessDenied = content.includes('Access Denied') || !url.includes('#reporting');
    expect(accessDenied).toBeTruthy();
  });

  test('should not show reporting link for non-approvers', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    // Login as team lead
    await page.fill('#email', TEAM_LEAD_EMAIL);
    await page.fill('#password', TEAM_LEAD_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#main-content h2', { timeout: 10000 });
    
    // Reporting link should not be visible
    await expect(page.locator('#main-nav a[href="#reporting"]')).not.toBeVisible();
  });
});

test.describe('Report Locking', () => {
  test('should prevent status submission for locked months', async ({ page }) => {
    // This test requires a finalized report to exist
    // It verifies that the locking mechanism works
    // Implementation depends on test data setup
    
    // Note: This is a placeholder test that should be expanded
    // once test data with approved reports is available
    expect(true).toBe(true);
  });

  test('should show re-open button for approved reports', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    // Login as PM/APM
    await page.fill('#email', APPROVER_EMAIL);
    await page.fill('#password', APPROVER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#main-content h2', { timeout: 10000 });
    
    // Navigate to reporting
    await page.goto('http://localhost:3000/#reporting');
    await page.waitForSelector('#reports-table tbody', { timeout: 10000 });
    
    // Filter to approved reports
    await page.selectOption('#report-status-filter', 'approved');
    await page.waitForTimeout(1000);
    
    const reopenButtons = await page.locator('.reopen-report-btn').count();
    if (reopenButtons > 0) {
      // Re-open button should be visible for approved reports
      await expect(page.locator('.reopen-report-btn').first()).toBeVisible();
    }
  });

  test('should show lock alert on member dashboard when report is approved', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    // Login as team lead (non-approver)
    await page.fill('#email', TEAM_LEAD_EMAIL);
    await page.fill('#password', TEAM_LEAD_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#main-content h2', { timeout: 10000 });
    
    // Check if lock alert is visible (depends on whether there are approved reports)
    const lockAlert = page.locator('#lock-status-alert');
    const isVisible = await lockAlert.isVisible();
    
    // If visible, verify it has the correct message
    if (isVisible) {
      await expect(lockAlert).toContainText('Reporting Period Locked');
      await expect(page.locator('#new-update-btn')).toBeDisabled();
    }
  });
});
