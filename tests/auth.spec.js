const { test, expect } = require('@playwright/test');
require('dotenv').config();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Authentication and Account Request', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        // Wait for the login form to be loaded
        await page.waitForSelector('#login-form', { timeout: 10000 });
    });

    test('should allow a user to log in with valid credentials', async ({ page }) => {
        // Use the admin user for the test
        await page.fill('#email', ADMIN_EMAIL);
        await page.fill('#password', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for navigation to the dashboard and for the dashboard content to load
        await page.waitForURL('**/#dashboard');
        await expect(page.locator('#main-content h2')).toHaveText('Dashboard', { timeout: 10000 });
    });

    test('should show an error message with invalid credentials', async ({ page }) => {
        await page.fill('#email', 'wrong@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');

        const errorMessage = page.locator('#error-message');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Invalid login credentials');
    });

    test('should allow a user to request an account', async ({ page }) => {
        await page.click('a[data-bs-target="#request-account-modal"]');
        await page.waitForSelector('#request-account-modal.show');

        await page.fill('#request-name', 'Test User');
        const uniqueEmail = `test.request.${Date.now()}@example.com`;
        await page.fill('#request-email', uniqueEmail);
        await page.fill('#request-reason', 'Testing account request functionality.');

        // Mock the alert dialog
        page.on('dialog', async dialog => {
            expect(dialog.message()).toBe('Your account request has been submitted for approval.');
            await dialog.dismiss();
        });

        await page.click('#request-account-form button[type="submit"]');

        // Wait for the modal to be hidden
        await page.waitForSelector('#request-account-modal', { state: 'hidden' });
    });
});
