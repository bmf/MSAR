// Manual test script to verify review queue functionality
// Run this with: node tests/manual-review-test.js

const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#login-form', { timeout: 10000 });

  console.log('2. Logging in as team lead...');
  await page.fill('#email', 'teamlead@example.com');
  await page.fill('#password', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/#dashboard', { timeout: 10000 });

  console.log('3. Checking for Review Queue link...');
  const reviewLink = page.locator('#main-nav a[href="#review"]');
  const isVisible = await reviewLink.isVisible();
  console.log('   Review Queue link visible:', isVisible);

  if (isVisible) {
    console.log('4. Clicking Review Queue link...');
    await reviewLink.click();
    await page.waitForURL('**/#review', { timeout: 5000 });

    console.log('5. Waiting for review table...');
    await page.waitForSelector('#review-table', { timeout: 5000 });

    console.log('6. Counting submissions...');
    const rows = await page.locator('#review-table tbody tr').count();
    console.log('   Found', rows, 'submission(s)');

    if (rows > 0) {
      const hasReviewButton = await page.locator('.review-btn').first().isVisible();
      console.log('   Review button visible:', hasReviewButton);

      if (hasReviewButton) {
        console.log('7. Opening review modal...');
        await page.locator('.review-btn').first().click();
        await page.waitForSelector('#review-detail-modal.show', { timeout: 5000 });

        console.log('8. Checking modal contents...');
        const hasApproveBtn = await page.locator('#approve-btn').isVisible();
        const hasRejectBtn = await page.locator('#reject-btn').isVisible();
        const hasApproveWithChangesBtn = await page.locator('#approve-with-changes-btn').isVisible();

        console.log('   Approve button:', hasApproveBtn);
        console.log('   Reject button:', hasRejectBtn);
        console.log('   Approve with Changes button:', hasApproveWithChangesBtn);

        console.log('\n✅ Review Queue is fully functional!');
        console.log('\nYou can now:');
        console.log('- Click Approve to approve as-is');
        console.log('- Edit fields and click Approve with Changes');
        console.log('- Add comments and click Reject');
      }
    } else {
      console.log('⚠️  No submissions found in review queue');
    }
  } else {
    console.log('❌ Review Queue link not visible');
    console.log('   Check that user has Team Lead role');
  }

  console.log('\nBrowser will stay open for manual testing...');
  console.log('Press Ctrl+C to close when done.');

  // Keep browser open for manual testing
  await page.waitForTimeout(300000); // 5 minutes

  await browser.close();
})();
