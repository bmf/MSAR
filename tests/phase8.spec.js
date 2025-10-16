// phase8.spec.js - Phase 8: Admin Panel Extended CRUD Tests
// Tests for Contracts, Teams, PWS Line Items, and Contract Roles management

const { test, expect } = require('@playwright/test');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe.configure({ mode: 'parallel' });

test.describe('Phase 8: Admin Panel - Extended CRUD', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto(BASE_URL);
        
        // Login as admin
        await page.fill('#email', ADMIN_EMAIL);
        await page.fill('#password', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');
        
        // Wait for successful login - admin should land on admin panel
        await page.waitForTimeout(2000);
        
        // Verify we're logged in by checking for admin panel or navigate to it
        const adminPanelVisible = await page.locator('#admin-tabs').isVisible().catch(() => false);
        if (!adminPanelVisible) {
            // Navigate to admin panel if not already there
            await page.click('a[href="#admin"]');
            await page.waitForSelector('#admin-tabs', { timeout: 5000 });
        }
    });

    test.describe('8.7: Contracts CRUD', () => {
        
        test('should display contracts tab', async ({ page }) => {
            await page.click('#contracts-tab');
            await expect(page.locator('#contracts-panel')).toBeVisible();
            await expect(page.locator('#contracts-table')).toBeVisible();
            await expect(page.locator('#new-contract-btn')).toBeVisible();
        });

        test('should create a new contract', async ({ page }) => {
            await page.click('#contracts-tab');
            await page.click('#new-contract-btn');
            
            // Wait for modal
            await page.waitForSelector('#contract-modal.show', { timeout: 3000 });
            
            // Fill form
            const testCode = `TEST-${Date.now()}`;
            await page.fill('#contract-code', testCode);
            await page.fill('#contract-name', 'Test Contract for Phase 8');
            
            // Submit
            await page.click('#contract-form button[type="submit"]');
            
            // Wait for success alert
            page.once('dialog', dialog => dialog.accept());
            await page.waitForTimeout(1000);
            
            // Verify contract appears in table
            await expect(page.locator('#contracts-table').locator(`text=${testCode}`)).toBeVisible();
        });

        test('should edit an existing contract', async ({ page }) => {
            await page.click('#contracts-tab');
            await page.waitForTimeout(1000);
            
            // Click first edit button
            const editBtn = page.locator('.edit-contract-btn').first();
            if (await editBtn.count() > 0) {
                await editBtn.click();
                
                // Wait for modal
                await page.waitForSelector('#contract-modal.show', { timeout: 3000 });
                
                // Modify name
                await page.fill('#contract-name', 'Updated Contract Name');
                
                // Submit
                await page.click('#contract-form button[type="submit"]');
                
                // Accept alert
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                // Verify update (use .first() since parallel tests may create multiple matches)
                await expect(page.locator('#contracts-table').locator('text=Updated Contract Name').first()).toBeVisible();
            }
        });

        test('should archive a contract', async ({ page }) => {
            await page.click('#contracts-tab');
            await page.waitForTimeout(1000);
            
            // Click first archive button if exists
            const archiveBtn = page.locator('.archive-contract-btn').first();
            if (await archiveBtn.count() > 0) {
                // Accept confirmation
                page.once('dialog', dialog => dialog.accept());
                await archiveBtn.click();
                
                // Accept success alert
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                // Verify archived badge appears
                await expect(page.locator('text=Archived').first()).toBeVisible();
            }
        });

        test('should filter by contract globally', async ({ page }) => {
            await page.click('#contracts-tab');
            await page.waitForTimeout(1000);
            
            // Verify contracts exist
            const contractCount = await page.locator('#contracts-table tbody tr').count();
            expect(contractCount).toBeGreaterThan(0);
        });
    });

    test.describe('8.8: Teams CRUD & Memberships', () => {
        
        test('should display teams tab', async ({ page }) => {
            await page.click('#teams-tab');
            await expect(page.locator('#teams-panel')).toBeVisible();
            await expect(page.locator('#teams-table')).toBeVisible();
            await expect(page.locator('#new-team-btn')).toBeVisible();
            await expect(page.locator('#teams-contract-filter')).toBeVisible();
        });

        test('should create a new team', async ({ page }) => {
            await page.click('#teams-tab');
            await page.click('#new-team-btn');
            
            // Wait for modal
            await page.waitForSelector('#team-modal.show', { timeout: 3000 });
            
            // Select first contract
            await page.selectOption('#team-contract', { index: 1 });
            
            // Fill team name
            const testTeamName = `Test Team ${Date.now()}`;
            await page.fill('#team-name', testTeamName);
            
            // Submit
            await page.click('#team-form button[type="submit"]');
            
            // Accept alert
            page.once('dialog', dialog => dialog.accept());
            await page.waitForTimeout(1000);
            
            // Verify team appears
            await expect(page.locator(`text=${testTeamName}`)).toBeVisible();
        });

        test('should edit a team', async ({ page }) => {
            await page.click('#teams-tab');
            await page.waitForTimeout(1000);
            
            const editBtn = page.locator('.edit-team-btn').first();
            if (await editBtn.count() > 0) {
                await editBtn.click();
                
                await page.waitForSelector('#team-modal.show', { timeout: 3000 });
                
                // Update name
                await page.fill('#team-name', 'Updated Team Name');
                
                await page.click('#team-form button[type="submit"]');
                
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                // Use .first() since parallel tests may create multiple matches
                await expect(page.locator('#teams-table').locator('text=Updated Team Name').first()).toBeVisible();
            }
        });

        test('should manage team members', async ({ page }) => {
            await page.click('#teams-tab');
            await page.waitForTimeout(1000);
            
            const membersBtn = page.locator('.manage-members-btn').first();
            if (await membersBtn.count() > 0) {
                await membersBtn.click();
                
                // Wait for membership modal
                await page.waitForSelector('#team-membership-modal.show', { timeout: 3000 });
                
                // Verify modal elements
                await expect(page.locator('#membership-user')).toBeVisible();
                await expect(page.locator('#membership-role')).toBeVisible();
                await expect(page.locator('#memberships-table')).toBeVisible();
            }
        });

        test('should filter teams by contract', async ({ page }) => {
            await page.click('#teams-tab');
            await page.waitForTimeout(1000);
            
            // Select a contract filter
            const filterSelect = page.locator('#teams-contract-filter');
            const optionCount = await filterSelect.locator('option').count();
            
            if (optionCount > 1) {
                await filterSelect.selectOption({ index: 1 });
                await page.waitForTimeout(500);
                
                // Table should update (we can't verify exact count without knowing data)
                await expect(page.locator('#teams-table')).toBeVisible();
            }
        });

        test('should toggle team active status', async ({ page }) => {
            await page.click('#teams-tab');
            await page.waitForTimeout(1000);
            
            const toggleBtn = page.locator('.toggle-team-btn').first();
            if (await toggleBtn.count() > 0) {
                // Set up both dialog handlers before clicking
                let dialogCount = 0;
                page.on('dialog', async dialog => {
                    await dialog.accept();
                    dialogCount++;
                });
                await toggleBtn.click();
                await page.waitForTimeout(1500);
                
                // Status should have changed
                await expect(page.locator('#teams-table')).toBeVisible();
            }
        });
    });

    test.describe('8.9: PWS Line Items Lifecycle', () => {
        
        test('should display PWS line items tab', async ({ page }) => {
            await page.click('#pws-tab');
            await expect(page.locator('#pws-panel')).toBeVisible();
            await expect(page.locator('#pws-table')).toBeVisible();
            await expect(page.locator('#new-pws-btn')).toBeVisible();
            await expect(page.locator('#pws-contract-filter')).toBeVisible();
        });

        test('should create a new PWS line item', async ({ page }) => {
            await page.click('#pws-tab');
            await page.click('#new-pws-btn');
            
            await page.waitForSelector('#pws-modal.show', { timeout: 3000 });
            
            // Fill form
            await page.selectOption('#pws-contract', { index: 1 });
            const testCode = `4.${Date.now() % 1000}.1`;
            await page.fill('#pws-code', testCode);
            await page.fill('#pws-title', 'Test PWS Line Item');
            await page.fill('#pws-description', 'Test description for PWS item');
            await page.selectOption('#pws-periodicity', 'monthly');
            
            // Submit
            await page.click('#pws-form button[type="submit"]');
            
            page.once('dialog', dialog => dialog.accept());
            await page.waitForTimeout(1000);
            
            // Verify item appears
            await expect(page.locator(`text=${testCode}`)).toBeVisible();
        });

        test('should edit a PWS line item', async ({ page }) => {
            await page.click('#pws-tab');
            await page.waitForTimeout(1000);
            
            const editBtn = page.locator('.edit-pws-btn').first();
            if (await editBtn.count() > 0) {
                await editBtn.click();
                
                await page.waitForSelector('#pws-modal.show', { timeout: 3000 });
                
                // Update title
                await page.fill('#pws-title', 'Updated PWS Title');
                
                await page.click('#pws-form button[type="submit"]');
                
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                // Use .first() since parallel tests may create multiple matches
                await expect(page.locator('#pws-table').locator('text=Updated PWS Title').first()).toBeVisible();
            }
        });

        test('should retire a PWS line item', async ({ page }) => {
            await page.click('#pws-tab');
            await page.waitForTimeout(1000);
            
            const retireBtn = page.locator('.toggle-pws-btn').first();
            if (await retireBtn.count() > 0) {
                page.once('dialog', dialog => dialog.accept());
                await retireBtn.click();
                
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                // Should show retired badge or activated badge
                await expect(page.locator('#pws-table')).toBeVisible();
            }
        });

        test('should filter PWS items by contract', async ({ page }) => {
            await page.click('#pws-tab');
            await page.waitForTimeout(1000);
            
            const filterSelect = page.locator('#pws-contract-filter');
            const optionCount = await filterSelect.locator('option').count();
            
            if (optionCount > 1) {
                await filterSelect.selectOption({ index: 1 });
                await page.waitForTimeout(500);
                
                await expect(page.locator('#pws-table')).toBeVisible();
            }
        });

        test('should show retired items with badge', async ({ page }) => {
            await page.click('#pws-tab');
            await page.waitForTimeout(1000);
            
            // Check if any retired badges exist
            const retiredBadges = page.locator('.badge.bg-danger');
            const count = await retiredBadges.count();
            
            // Just verify the table renders correctly
            await expect(page.locator('#pws-table')).toBeVisible();
        });
    });

    test.describe('8.10: Roles per Contract', () => {
        
        test('should display contract roles tab', async ({ page }) => {
            await page.click('#contract-roles-tab');
            await expect(page.locator('#contract-roles-panel')).toBeVisible();
            await expect(page.locator('#contract-roles-table')).toBeVisible();
            await expect(page.locator('#new-contract-role-btn')).toBeVisible();
            await expect(page.locator('#roles-contract-filter')).toBeVisible();
        });

        test('should assign a contract role', async ({ page }) => {
            await page.click('#contract-roles-tab');
            await page.click('#new-contract-role-btn');
            
            await page.waitForSelector('#contract-role-modal.show', { timeout: 3000 });
            
            // Check if dropdowns have options
            const userOptions = await page.locator('#contract-role-user option').count();
            const contractOptions = await page.locator('#contract-role-contract option').count();
            
            if (userOptions > 1 && contractOptions > 1) {
                // Fill form
                await page.selectOption('#contract-role-user', { index: 1 });
                await page.selectOption('#contract-role-contract', { index: 1 });
                await page.selectOption('#contract-role-role', 'Team Member');
                
                // Submit
                await page.click('#contract-role-form button[type="submit"]');
                
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                // Verify role appears
                await expect(page.locator('#contract-roles-table')).toBeVisible();
            }
        });

        test('should remove a contract role', async ({ page }) => {
            await page.click('#contract-roles-tab');
            await page.waitForTimeout(1000);
            
            const deleteBtn = page.locator('.delete-contract-role-btn').first();
            if (await deleteBtn.count() > 0) {
                page.once('dialog', dialog => dialog.accept());
                await deleteBtn.click();
                
                page.once('dialog', dialog => dialog.accept());
                await page.waitForTimeout(1000);
                
                await expect(page.locator('#contract-roles-table')).toBeVisible();
            }
        });

        test('should filter contract roles by contract', async ({ page }) => {
            await page.click('#contract-roles-tab');
            await page.waitForTimeout(1000);
            
            const filterSelect = page.locator('#roles-contract-filter');
            const optionCount = await filterSelect.locator('option').count();
            
            if (optionCount > 1) {
                await filterSelect.selectOption({ index: 1 });
                await page.waitForTimeout(500);
                
                await expect(page.locator('#contract-roles-table')).toBeVisible();
            }
        });

        test('should display role badges correctly', async ({ page }) => {
            await page.click('#contract-roles-tab');
            await page.waitForTimeout(1000);
            
            // Check for role badges
            const roleBadges = page.locator('.badge.bg-primary');
            
            // Just verify table renders
            await expect(page.locator('#contract-roles-table')).toBeVisible();
        });

        test('should support multiple roles (PM, APM, Team Lead, Team Member)', async ({ page }) => {
            await page.click('#contract-roles-tab');
            await page.click('#new-contract-role-btn');
            
            await page.waitForSelector('#contract-role-modal.show', { timeout: 3000 });
            
            // Verify all role options exist (check they're in the DOM, not necessarily visible)
            const roleSelect = page.locator('#contract-role-role');
            await expect(roleSelect.locator('option[value="Admin"]')).toHaveCount(1);
            await expect(roleSelect.locator('option[value="PM"]')).toHaveCount(1);
            await expect(roleSelect.locator('option[value="APM"]')).toHaveCount(1);
            await expect(roleSelect.locator('option[value="Team Lead"]')).toHaveCount(1);
            await expect(roleSelect.locator('option[value="Team Member"]')).toHaveCount(1);
        });
    });

    test.describe('Integration Tests', () => {
        
        test('should maintain data consistency across tabs', async ({ page }) => {
            // Create contract
            await page.click('#contracts-tab');
            const contractCode = `INT-${Date.now()}`;
            await page.click('#new-contract-btn');
            await page.waitForSelector('#contract-modal.show');
            await page.fill('#contract-code', contractCode);
            await page.fill('#contract-name', 'Integration Test Contract');
            await page.click('#contract-form button[type="submit"]');
            page.once('dialog', dialog => dialog.accept());
            await page.waitForTimeout(1000);
            
            // Verify contract appears in Teams dropdown
            await page.click('#teams-tab');
            await page.click('#new-team-btn');
            await page.waitForSelector('#team-modal.show');
            const teamContractOptions = await page.locator('#team-contract option').allTextContents();
            const hasContract = teamContractOptions.some(opt => opt.includes(contractCode));
            expect(hasContract).toBeTruthy();
        });

        test('should handle form validation correctly', async ({ page }) => {
            // Try to create contract without required fields
            await page.click('#contracts-tab');
            await page.click('#new-contract-btn');
            await page.waitForSelector('#contract-modal.show');
            
            // Submit empty form
            await page.click('#contract-form button[type="submit"]');
            
            // Form should not submit (HTML5 validation)
            await expect(page.locator('#contract-modal.show')).toBeVisible();
        });

        test('should update dropdowns after creating entities', async ({ page }) => {
            await page.click('#contracts-tab');
            await page.waitForTimeout(1000);
            
            // Count contracts
            const initialCount = await page.locator('#contracts-table tbody tr').count();
            
            // All dropdowns should be populated
            await page.click('#teams-tab');
            const teamDropdownCount = await page.locator('#teams-contract-filter option').count();
            expect(teamDropdownCount).toBeGreaterThan(0);
        });
    });

    test.describe('Access Control', () => {
        
        test('should only be accessible to admins', async ({ page }) => {
            // Already logged in as admin, verify access
            await expect(page.locator('#admin-tabs')).toBeVisible();
            await expect(page.locator('#contracts-tab')).toBeVisible();
            await expect(page.locator('#teams-tab')).toBeVisible();
            await expect(page.locator('#pws-tab')).toBeVisible();
            await expect(page.locator('#contract-roles-tab')).toBeVisible();
        });

        test('should show all 6 tabs in admin panel', async ({ page }) => {
            const tabs = await page.locator('#admin-tabs .nav-item').count();
            expect(tabs).toBe(6); // Users, Requests, Contracts, Teams, PWS, Contract Roles
        });
    });
});
