import { expect, test } from '@playwright/test';

test('explore dev tools available in deck manager', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  console.log('=== EXPLORING DECK MANAGER DEV TOOLS ===');
  
  // Enable dev mode using the console function
  console.log('Step 1: Enabling dev mode via console');
  await page.evaluate(() => {
    // @ts-ignore - Using window global for dev mode toggle
    window.toggleDevMode();
  });
  
  // Open deck manager
  await page.click('button:has-text("📚 Manage Decks")');
  await page.waitForTimeout(1000);
  
  console.log('Step 2: Opened Deck Manager with dev mode enabled');
  
  // Take screenshot of deck manager with dev tools
  await page.screenshot({ path: 'deck-manager-with-dev-tools.png' });
  
  // Look for dev tools section specifically
  const devSection = page.locator('.dev-controls');
  const devSectionExists = await devSection.count() > 0;
  console.log(`\nDev controls section found: ${devSectionExists}`);
  
  if (devSectionExists) {
    console.log('\n=== DEV TOOLS FOUND ===');
    const devButtons = await devSection.locator('button').all();
    
    for (const button of devButtons) {
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      const classes = await button.getAttribute('class');
      console.log(`Dev Tool: "${text}" - Title: "${title}" - Classes: ${classes}`);
    }
    
    // Test the "Add Sample Data" button functionality
    console.log('\n=== TESTING SAMPLE DATA FUNCTIONALITY ===');
    const sampleDataButton = devSection.locator('button:has-text("Add Sample Data")');
    const sampleDataExists = await sampleDataButton.count() > 0;
    
    if (sampleDataExists) {
      console.log('Sample data button found - this could be very useful for E2E tests!');
      
      // Check what happens when we click it (but cancel the confirmation)
      await sampleDataButton.click();
      await page.waitForTimeout(500);
      
      // Look for confirmation dialog
      const confirmText = await page.textContent('body');
      if (confirmText?.includes('Add sample deck')) {
        console.log('Confirmation dialog appeared for sample data');
        // Don't actually confirm, just close the dialog
        await page.keyboard.press('Escape');
      }
    }
    
    // Test other dev tools
    const clearDbButton = devSection.locator('button:has-text("Clear Database")');
    const testToastButton = devSection.locator('button:has-text("Test Toast")');
    
    console.log(`Clear Database button available: ${await clearDbButton.count() > 0}`);
    console.log(`Test Toast button available: ${await testToastButton.count() > 0}`);
    
    // Test the toast button since it's safe
    if (await testToastButton.count() > 0) {
      await testToastButton.click();
      await page.waitForTimeout(1000);
      const toastVisible = await page.locator('.toast').count() > 0;
      console.log(`Test toast appeared: ${toastVisible}`);
    }
  } else {
    console.log('\nNo dev controls section found - dev mode might not be working');
  }
  
  // Check the page classes to see if dev mode is active
  const pageClasses = await page.getAttribute('body', 'class') || '';
  const rootClasses = await page.locator('.print-container').getAttribute('class') || '';
  console.log(`\nPage classes: ${pageClasses}`);
  console.log(`Root container classes: ${rootClasses}`);
  
  console.log('\n=== SUMMARY ===');
  console.log('Dev mode can be enabled with toggleDevMode() in console');
  console.log('Dev tools appear in the deck manager dialog when enabled');
  console.log('Available tools: Clear Database, Add Sample Data, Test Toast');
  console.log('This can significantly simplify E2E test setup!');
});
