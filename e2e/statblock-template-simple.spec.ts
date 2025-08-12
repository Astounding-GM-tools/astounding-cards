import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('StatblockTemplateDialog - Simple Test', () => {
  let devTools: DevToolsHelper;

  test.beforeEach(async ({ page }) => {
    devTools = new DevToolsHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open StatblockTemplateDialog from Add Game Stats button', async ({ page }) => {
    console.log('=== Setting up sample data ===');
    
    // Setup sample data
    await devTools.setupTestEnvironment();
    await page.waitForTimeout(2000);
    
    console.log('=== Looking for Add Game Stats button ===');
    
    // Look for "Add Game Stats" buttons on card backs
    const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
    const buttonCount = await addStatsButtons.count();
    console.log(`Found ${buttonCount} "Add Game Stats" buttons`);
    
    // Take screenshot to see what's available
    await page.screenshot({ path: 'debug-card-layout.png' });
    
    if (buttonCount === 0) {
      console.log('No "Add Game Stats" buttons found. Let me check the page structure...');
      
      // Let's look for other buttons that might open the template dialog
      const allButtons = page.locator('button:visible');
      const totalButtons = await allButtons.count();
      console.log(`Found ${totalButtons} visible buttons:`);
      
      for (let i = 0; i < Math.min(totalButtons, 30); i++) {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`  Button ${i}: "${buttonText}"`);
      }
      
      // Let's also check if we can find the template dialog component directly
      const templateDialog = page.locator('.template-dialog');
      const templateDialogCount = await templateDialog.count();
      console.log(`Found ${templateDialogCount} template dialogs in DOM`);
      
      // Fail if we can't find any Add Game Stats buttons
      expect(buttonCount).toBeGreaterThan(0);
      return;
    }
    
    console.log('=== Clicking Add Game Stats button ===');
    
    // Click the first Add Game Stats button
    const firstButton = addStatsButtons.first();
    await firstButton.scrollIntoViewIfNeeded();
    
    // Try clicking with force to bypass any visibility issues
    await firstButton.click({ force: true });
    await page.waitForTimeout(1500);
    
    console.log('=== Checking for StatblockTemplateDialog ===');
    await page.screenshot({ path: 'debug-after-button-click.png' });
    
    // Look for the template dialog
    const templateDialog = page.locator('.template-dialog');
    const isDialogVisible = await templateDialog.isVisible();
    console.log(`Template dialog visible: ${isDialogVisible}`);
    
    if (!isDialogVisible) {
      // Check if dialog exists but is hidden
      const dialogExists = await templateDialog.count() > 0;
      console.log(`Template dialog exists in DOM: ${dialogExists}`);
      
      // Check for any open dialogs
      const openDialogs = page.locator('dialog[open]');
      const openDialogCount = await openDialogs.count();
      console.log(`Found ${openDialogCount} open dialogs`);
      
      if (openDialogCount > 0) {
        for (let i = 0; i < openDialogCount; i++) {
          const dialogClass = await openDialogs.nth(i).getAttribute('class');
          console.log(`  Open dialog ${i}: class="${dialogClass}"`);
        }
      }
    }
    
    // Verify the dialog is visible and has category buttons
    await expect(templateDialog).toBeVisible();
    
    console.log('=== Testing category buttons ===');
    
    // Check for category buttons
    const categoryButtons = [
      page.locator('button:has-text("Character")'),
      page.locator('button:has-text("Item")'),  
      page.locator('button:has-text("Ability")'),
      page.locator('button:has-text("Custom")')
    ];
    
    let foundCategories = 0;
    for (const button of categoryButtons) {
      const isVisible = await button.isVisible();
      if (isVisible) {
        foundCategories++;
        const buttonText = await button.textContent();
        console.log(`✅ Found category button: ${buttonText}`);
      }
    }
    
    console.log(`Found ${foundCategories} category buttons`);
    expect(foundCategories).toBeGreaterThanOrEqual(4); // Should have all 4 categories
    
    console.log('=== Testing category switching ===');
    
    // Test clicking different categories
    const characterButton = page.locator('button:has-text("Character")').first();
    if (await characterButton.isVisible()) {
      await characterButton.click();
      await expect(characterButton).toHaveClass(/active/);
      console.log('✅ Character tab activated successfully');
    }
    
    const itemButton = page.locator('button:has-text("Item")').first();
    if (await itemButton.isVisible()) {
      await itemButton.click();
      await expect(itemButton).toHaveClass(/active/);
      console.log('✅ Item tab activated successfully');
    }
    
    console.log('=== Closing dialog ===');
    
    // Close the dialog
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(templateDialog).not.toBeVisible();
      console.log('✅ Dialog closed successfully');
    }
    
    console.log('✅ StatblockTemplateDialog test completed successfully!');
  });

  test.afterEach(async ({ page }) => {
    await devTools.disableDevMode();
  });
});
