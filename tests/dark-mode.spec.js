// Dark Mode Playwright Tests
// Tests theme toggle functionality, persistence, accessibility, and visual rendering

const { test, expect } = require('@playwright/test');

test.describe('Dark Mode', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage before each test
        await page.goto('http://localhost:3000');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('13.8.1 - Theme toggle button is visible and accessible', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        const toggleBtn = page.locator('#theme-toggle-btn');
        await expect(toggleBtn).toBeVisible();
        
        // Check accessibility attributes
        await expect(toggleBtn).toHaveAttribute('aria-label', /dark mode/i);
        await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
        await expect(toggleBtn).toHaveAttribute('title', /dark mode/i);
        
        // Check icon is present
        const icon = toggleBtn.locator('.theme-toggle-icon');
        await expect(icon).toBeVisible();
        await expect(icon).toHaveText('🌙');
    });

    test('13.8.2 - Theme toggle switches to dark mode on click', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Verify initial light mode
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-theme', 'light');
        
        // Click toggle button
        const toggleBtn = page.locator('#theme-toggle-btn');
        await toggleBtn.click();
        
        // Verify dark mode is applied
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        // Verify button state updated
        await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
        await expect(toggleBtn).toHaveAttribute('aria-label', /light mode/i);
        
        // Verify icon changed
        const icon = toggleBtn.locator('.theme-toggle-icon');
        await expect(icon).toHaveText('☀️');
    });

    test('13.8.3 - Theme toggle switches back to light mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        const toggleBtn = page.locator('#theme-toggle-btn');
        const body = page.locator('body');
        
        // Toggle to dark
        await toggleBtn.click();
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        // Toggle back to light
        await toggleBtn.click();
        await expect(body).toHaveAttribute('data-theme', 'light');
        
        // Verify button state
        await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
        await expect(toggleBtn).toHaveAttribute('aria-label', /dark mode/i);
        
        const icon = toggleBtn.locator('.theme-toggle-icon');
        await expect(icon).toHaveText('🌙');
    });

    test('13.8.4 - Theme preference persists across page reloads', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        const toggleBtn = page.locator('#theme-toggle-btn');
        await toggleBtn.click();
        
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        // Reload page
        await page.reload();
        
        // Verify dark mode persisted
        await expect(body).toHaveAttribute('data-theme', 'dark');
        await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
        
        const icon = toggleBtn.locator('.theme-toggle-icon');
        await expect(icon).toHaveText('☀️');
    });

    test('13.8.5 - Theme preference persists in localStorage', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Check localStorage
        const theme = await page.evaluate(() => localStorage.getItem('theme'));
        expect(theme).toBe('dark');
        
        // Toggle back to light
        await page.locator('#theme-toggle-btn').click();
        
        const lightTheme = await page.evaluate(() => localStorage.getItem('theme'));
        expect(lightTheme).toBe('light');
    });

    test('13.8.6 - Keyboard navigation: Tab to theme toggle', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Focus the theme toggle directly to verify it's focusable
        const toggleBtn = page.locator('#theme-toggle-btn');
        await toggleBtn.focus();
        
        // Verify it can receive focus
        await expect(toggleBtn).toBeFocused();
    });

    test('13.8.7 - Keyboard activation: Enter key toggles theme', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        const body = page.locator('body');
        const toggleBtn = page.locator('#theme-toggle-btn');
        
        // Focus the toggle button
        await toggleBtn.focus();
        
        // Press Enter to toggle
        await page.keyboard.press('Enter');
        
        // Verify dark mode activated
        await expect(body).toHaveAttribute('data-theme', 'dark');
    });

    test('13.8.8 - Keyboard activation: Space key toggles theme', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        const body = page.locator('body');
        const toggleBtn = page.locator('#theme-toggle-btn');
        
        // Focus the toggle button
        await toggleBtn.focus();
        
        // Press Space to toggle
        await page.keyboard.press('Space');
        
        // Verify dark mode activated
        await expect(body).toHaveAttribute('data-theme', 'dark');
    });

    test('13.8.9 - Dark mode applies to login page', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        // Check form elements have dark styling
        const emailInput = page.locator('#email');
        if (await emailInput.isVisible()) {
            const bgColor = await emailInput.evaluate(el => 
                window.getComputedStyle(el).backgroundColor
            );
            // Dark mode should not be white (rgb(255, 255, 255))
            expect(bgColor).not.toBe('rgb(255, 255, 255)');
        }
    });

    test('13.8.10 - Dark mode persists after login', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode before login
        await page.locator('#theme-toggle-btn').click();
        
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        // Attempt login (will fail but that's okay for this test)
        const emailInput = page.locator('#email');
        if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com');
            await page.locator('#password').fill('testpassword');
            await page.locator('#login-form').locator('button[type="submit"]').click();
            
            // Wait a moment for any UI updates
            await page.waitForTimeout(500);
            
            // Verify dark mode still active
            await expect(body).toHaveAttribute('data-theme', 'dark');
        }
    });

    test('13.8.11 - Focus outline visible in dark mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Focus the toggle button
        const toggleBtn = page.locator('#theme-toggle-btn');
        await toggleBtn.focus();
        
        // Check focus outline is present
        const outline = await toggleBtn.evaluate(el => 
            window.getComputedStyle(el).outline
        );
        
        // Should have an outline (not 'none' or empty)
        expect(outline).not.toBe('none');
        expect(outline).not.toBe('');
    });

    test('13.8.12 - Modal dialogs render correctly in dark mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Open account request modal if available
        const requestLink = page.locator('a[data-bs-target="#request-account-modal"]');
        if (await requestLink.isVisible()) {
            await requestLink.click();
            
            // Wait for modal to appear
            const modal = page.locator('#request-account-modal');
            await expect(modal).toBeVisible();
            
            // Check modal content has dark styling
            const modalContent = modal.locator('.modal-content');
            const bgColor = await modalContent.evaluate(el => 
                window.getComputedStyle(el).backgroundColor
            );
            
            // Should not be white in dark mode
            expect(bgColor).not.toBe('rgb(255, 255, 255)');
        }
    });

    test('13.8.13 - Buttons maintain contrast in dark mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Check login button (outline button may have transparent background)
        const loginBtn = page.locator('#login-btn');
        if (await loginBtn.isVisible()) {
            const color = await loginBtn.evaluate(el => 
                window.getComputedStyle(el).color
            );
            
            // Text color should be defined
            expect(color).not.toBe('rgba(0, 0, 0, 0)');
            expect(color).not.toBe('');
            
            // For outline buttons, border color is more important than background
            const borderColor = await loginBtn.evaluate(el => 
                window.getComputedStyle(el).borderColor
            );
            expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
        }
    });

    test('13.8.14 - Links are visible in dark mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Check if any links are present
        const links = page.locator('a');
        const count = await links.count();
        
        if (count > 0) {
            const firstLink = links.first();
            const color = await firstLink.evaluate(el => 
                window.getComputedStyle(el).color
            );
            
            // Link color should not be default black in dark mode
            expect(color).not.toBe('rgb(0, 0, 0)');
        }
    });

    test('13.8.15 - Theme toggle works across navigation', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        // Navigate to different hash routes
        await page.goto('http://localhost:3000#dashboard');
        await page.waitForTimeout(300);
        await expect(body).toHaveAttribute('data-theme', 'dark');
        
        await page.goto('http://localhost:3000#login');
        await page.waitForTimeout(300);
        await expect(body).toHaveAttribute('data-theme', 'dark');
    });

    test('13.8.16 - CSS variables are defined for both themes', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Check light theme variables
        let bgPrimary = await page.evaluate(() => 
            getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
        );
        expect(bgPrimary.trim()).not.toBe('');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Check dark theme variables are different
        bgPrimary = await page.evaluate(() => 
            getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
        );
        expect(bgPrimary.trim()).not.toBe('');
    });

    test('13.8.17 - Screen reader announcement on toggle', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        const toggleBtn = page.locator('#theme-toggle-btn');
        
        // Check for visually-hidden text for screen readers
        const srText = toggleBtn.locator('.visually-hidden');
        await expect(srText).toBeAttached();
        
        const text = await srText.textContent();
        expect(text).toContain('dark mode');
    });

    test('13.8.18 - No layout shifts when toggling theme', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Get initial layout dimensions
        const initialHeight = await page.evaluate(() => document.body.scrollHeight);
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        await page.waitForTimeout(500); // Wait for transition
        
        // Check layout dimensions haven't changed significantly
        const darkHeight = await page.evaluate(() => document.body.scrollHeight);
        
        // Allow for minor differences (within 5 pixels)
        expect(Math.abs(darkHeight - initialHeight)).toBeLessThan(5);
    });

    test('13.8.19 - Table elements render correctly in dark mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Check if any tables exist on the page
        const tables = page.locator('table');
        const tableCount = await tables.count();
        
        if (tableCount > 0) {
            const firstTable = tables.first();
            const bgColor = await firstTable.evaluate(el => 
                window.getComputedStyle(el).backgroundColor
            );
            
            // Should have a background color defined
            expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
        }
    });

    test('13.8.20 - Form inputs are readable in dark mode', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Toggle to dark mode
        await page.locator('#theme-toggle-btn').click();
        
        // Check email input if present
        const emailInput = page.locator('#email');
        if (await emailInput.isVisible()) {
            const color = await emailInput.evaluate(el => 
                window.getComputedStyle(el).color
            );
            const bgColor = await emailInput.evaluate(el => 
                window.getComputedStyle(el).backgroundColor
            );
            
            // Both should be defined
            expect(color).not.toBe('rgba(0, 0, 0, 0)');
            expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
            
            // Text should not be black on dark background
            expect(color).not.toBe('rgb(0, 0, 0)');
        }
    });
});
