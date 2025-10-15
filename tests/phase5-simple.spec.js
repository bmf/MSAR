const { test, expect } = require('@playwright/test');
require('dotenv').config();

const MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL || 'member1@example.com';
const MEMBER_PASSWORD = process.env.TEST_MEMBER_PASSWORD || 'TestPassword123!';
const LEAD_EMAIL = process.env.TEST_LEAD_EMAIL || 'teamlead@example.com';
const LEAD_PASSWORD = process.env.TEST_LEAD_PASSWORD || 'TestPassword123!';

test.describe('Phase 5: Simple Smoke Tests', () => {
  
  test('should login as member and reach dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Fill login form
    await page.fill('#email', MEMBER_EMAIL);
    await page.fill('#password', MEMBER_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation - be more flexible
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard or if URL contains dashboard
    const url = page.url();
    console.log('Current URL after login:', url);
    
    // Check for dashboard elements
    const dashboardTitle = await page.locator('h2:has-text("My Tasks")').count();
    const tasksTable = await page.locator('#tasks-table').count();
    
    console.log('Dashboard title count:', dashboardTitle);
    console.log('Tasks table count:', tasksTable);
    
    expect(dashboardTitle + tasksTable).toBeGreaterThan(0);
  });
  
  test('should login as team lead and reach review queue', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Fill login form
    await page.fill('#email', LEAD_EMAIL);
    await page.fill('#password', LEAD_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Navigate to review queue
    await page.goto('http://localhost:3000/#review');
    await page.waitForTimeout(2000);
    
    // Check for review queue elements
    const reviewTitle = await page.locator('h2:has-text("Review Queue")').count();
    const reviewTable = await page.locator('#review-table').count();
    
    console.log('Review title count:', reviewTitle);
    console.log('Review table count:', reviewTable);
    
    expect(reviewTitle + reviewTable).toBeGreaterThan(0);
  });
  
  test('should see pending submission in review queue', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Login as team lead
    await page.fill('#email', LEAD_EMAIL);
    await page.fill('#password', LEAD_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to review queue
    await page.goto('http://localhost:3000/#review');
    await page.waitForTimeout(2000);
    
    // Check if review table exists
    const reviewTable = page.locator('#review-table');
    await expect(reviewTable).toBeVisible({ timeout: 5000 });
    
    // Check for table rows (excluding header)
    const rows = await page.locator('#review-table tbody tr').count();
    console.log('Number of pending submissions:', rows);
    
    // Should have at least one submission
    expect(rows).toBeGreaterThan(0);
  });
});
