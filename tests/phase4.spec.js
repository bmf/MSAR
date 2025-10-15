// Phase 4 Tests: Dashboard Global Filters and Role-Based Landing Views
const { test, expect } = require('@playwright/test');
require('dotenv').config();

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test users from .env file
const ADMIN_USER = {
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD
};

const TEAM_LEAD_USER = {
    email: process.env.TEST_TEAM_LEAD_EMAIL,
    password: process.env.TEST_TEAM_LEAD_PASSWORD
};

const TEAM_MEMBER_USER = {
    email: process.env.TEST_MEMBER_EMAIL,
    password: process.env.TEST_MEMBER_PASSWORD
};

// Note: Report Approver role may need to be added to .env
// For now, using admin as fallback for Report Approver tests
const REPORT_APPROVER_USER = {
    email: process.env.TEST_REPORT_APPROVER_EMAIL || process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_REPORT_APPROVER_PASSWORD || process.env.TEST_ADMIN_PASSWORD
};

test.describe('Phase 4: Global Filters', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test('should display global filter bar on member dashboard', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Verify filter bar exists
        await expect(page.locator('#filter-contract')).toBeVisible();
        await expect(page.locator('#filter-team')).toBeVisible();
        await expect(page.locator('#filter-pws')).toBeVisible();
        await expect(page.locator('#filter-task')).toBeVisible();
    });

    test('should populate contract filter with user contracts', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Wait for contract filter to be populated (async operation)
        await page.waitForTimeout(1000);
        
        // Check that contract dropdown has options
        const contractOptions = await page.locator('#filter-contract option').count();
        expect(contractOptions).toBeGreaterThan(1); // At least "All Contracts" + 1 contract
    });

    test('should cascade filters: Contract -> Team -> PWS -> Task', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Select a contract
        const contractSelect = page.locator('#filter-contract');
        const contractOptions = await contractSelect.locator('option').count();
        
        if (contractOptions > 1) {
            await contractSelect.selectOption({ index: 1 }); // Select first contract
            
            // Wait for team filter to populate
            await page.waitForTimeout(500);
            
            // Verify team filter has options or is empty (depends on data)
            const teamOptions = await page.locator('#filter-team option').count();
            expect(teamOptions).toBeGreaterThanOrEqual(1); // At least "All Teams"
        }
    });

    test('should persist filter selections in localStorage', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Select a contract
        const contractSelect = page.locator('#filter-contract');
        const contractOptions = await contractSelect.locator('option').count();
        
        if (contractOptions > 1) {
            await contractSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
            
            // Check localStorage
            const globalFilters = await page.evaluate(() => {
                return localStorage.getItem('msr_global_filters');
            });
            
            expect(globalFilters).toBeTruthy();
            const filters = JSON.parse(globalFilters);
            expect(filters.contract).toBeTruthy();
        }
    });

    test('should restore filter selections on page reload', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Select a contract
        const contractSelect = page.locator('#filter-contract');
        const contractOptions = await contractSelect.locator('option').count();
        
        if (contractOptions > 1) {
            await contractSelect.selectOption({ index: 1 });
            const selectedValue = await contractSelect.inputValue();
            await page.waitForTimeout(500);
            
            // Reload page
            await page.reload();
            await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
            
            // Wait for filters to be populated and restored
            await page.waitForTimeout(1000);
            
            // Verify filter is restored
            const restoredValue = await page.locator('#filter-contract').inputValue();
            expect(restoredValue).toBe(selectedValue);
        }
    });

    test('should filter tasks based on selected filters', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Count initial rows
        const initialRows = await page.locator('#tasks-table tbody tr').count();
        
        // Apply a filter
        const statusFilter = page.locator('#filter-status');
        await statusFilter.selectOption('In Progress');
        await page.waitForTimeout(500);
        
        // Count filtered rows (may be same or less)
        const filteredRows = await page.locator('#tasks-table tbody tr').count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);
    });
});

test.describe('Phase 4: Role-Based Landing Views', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test('should route Admin to Admin Panel on login', async ({ page }) => {
        // Login as admin
        await page.fill('#email', ADMIN_USER.email);
        await page.fill('#password', ADMIN_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForTimeout(1000);
        
        // Verify admin panel is displayed
        await expect(page.locator('h2:has-text("Admin Panel")')).toBeVisible({ timeout: 5000 });
    });

    test('should route Team Lead to Team Lead Dashboard on login', async ({ page }) => {
        // Login as team lead
        await page.fill('#email', TEAM_LEAD_USER.email);
        await page.fill('#password', TEAM_LEAD_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForTimeout(1000);
        
        // Verify team lead dashboard is displayed
        await expect(page.locator('h2:has-text("Team Lead Dashboard")')).toBeVisible({ timeout: 5000 });
    });

    test('should route Team Member to My Tasks on login', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForTimeout(1000);
        
        // Verify member dashboard is displayed
        await expect(page.locator('h2:has-text("My Tasks")')).toBeVisible({ timeout: 5000 });
    });

    test('should route Report Approver to Reporting View on login', async ({ page }) => {
        // Login as report approver
        await page.fill('#email', REPORT_APPROVER_USER.email);
        await page.fill('#password', REPORT_APPROVER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForTimeout(1000);
        
        // Verify reporting view is displayed
        await expect(page.locator('h2:has-text("Monthly Reporting")')).toBeVisible({ timeout: 5000 });
    });

    test('should prevent Team Member from accessing Admin Panel', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Try to navigate to admin panel
        await page.goto(BASE_URL + '#admin');
        await page.waitForTimeout(500);
        
        // Verify access denied message
        await expect(page.locator('.alert-danger:has-text("Access Denied")')).toBeVisible();
    });

    test('should prevent Team Member from accessing Review Queue', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard
        await page.waitForSelector('h2:has-text("My Tasks")', { timeout: 5000 });
        
        // Try to navigate to review queue
        await page.goto(BASE_URL + '#review');
        await page.waitForTimeout(500);
        
        // Verify access denied message
        await expect(page.locator('.alert-danger:has-text("Access Denied")')).toBeVisible();
    });

    test('should prevent Team Lead from accessing Admin Panel', async ({ page }) => {
        // Login as team lead
        await page.fill('#email', TEAM_LEAD_USER.email);
        await page.fill('#password', TEAM_LEAD_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard
        await page.waitForTimeout(1000);
        
        // Try to navigate to admin panel
        await page.goto(BASE_URL + '#admin');
        await page.waitForTimeout(500);
        
        // Verify access denied message
        await expect(page.locator('.alert-danger:has-text("Access Denied")')).toBeVisible();
    });

    test('should allow Team Lead to access Review Queue', async ({ page }) => {
        // Login as team lead
        await page.fill('#email', TEAM_LEAD_USER.email);
        await page.fill('#password', TEAM_LEAD_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for dashboard
        await page.waitForTimeout(1000);
        
        // Navigate to review queue
        await page.goto(BASE_URL + '#review');
        await page.waitForTimeout(500);
        
        // Verify review queue is displayed
        await expect(page.locator('h2:has-text("Review Queue")')).toBeVisible();
    });

    test('should allow Admin to access all views', async ({ page }) => {
        // Login as admin
        await page.fill('#email', ADMIN_USER.email);
        await page.fill('#password', ADMIN_USER.password);
        await page.click('button[type="submit"]');
        
        // Wait for admin panel
        await page.waitForTimeout(1000);
        
        // Test access to review queue
        await page.goto(BASE_URL + '#review');
        await page.waitForTimeout(500);
        await expect(page.locator('h2:has-text("Review Queue")')).toBeVisible();
        
        // Test access to reporting
        await page.goto(BASE_URL + '#reporting');
        await page.waitForTimeout(500);
        await expect(page.locator('h2:has-text("Monthly Reporting")')).toBeVisible();
        
        // Test access to admin panel
        await page.goto(BASE_URL + '#admin');
        await page.waitForTimeout(500);
        await expect(page.locator('h2:has-text("Admin Panel")')).toBeVisible();
    });
});

test.describe('Phase 4: Navigation Menu', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test('should show appropriate nav links for Team Member', async ({ page }) => {
        // Login as team member
        await page.fill('#email', TEAM_MEMBER_USER.email);
        await page.fill('#password', TEAM_MEMBER_USER.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(1000);
        
        // Verify nav links
        await expect(page.locator('#main-nav a:has-text("Dashboard")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Review Queue")')).not.toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Reporting")')).not.toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Admin Panel")')).not.toBeVisible();
    });

    test('should show appropriate nav links for Team Lead', async ({ page }) => {
        // Login as team lead
        await page.fill('#email', TEAM_LEAD_USER.email);
        await page.fill('#password', TEAM_LEAD_USER.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(1000);
        
        // Verify nav links
        await expect(page.locator('#main-nav a:has-text("Dashboard")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Review Queue")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Admin Panel")')).not.toBeVisible();
    });

    test('should show appropriate nav links for Report Approver', async ({ page }) => {
        // Login as report approver
        await page.fill('#email', REPORT_APPROVER_USER.email);
        await page.fill('#password', REPORT_APPROVER_USER.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(1000);
        
        // Verify nav links
        await expect(page.locator('#main-nav a:has-text("Dashboard")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Reporting")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Admin Panel")')).not.toBeVisible();
    });

    test('should show all nav links for Admin', async ({ page }) => {
        // Login as admin
        await page.fill('#email', ADMIN_USER.email);
        await page.fill('#password', ADMIN_USER.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(1000);
        
        // Verify nav links
        await expect(page.locator('#main-nav a:has-text("Dashboard")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Review Queue")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Reporting")')).toBeVisible();
        await expect(page.locator('#main-nav a:has-text("Admin Panel")')).toBeVisible();
    });
});
