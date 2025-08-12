import { expect, test } from '@playwright/test';

test('debug: check what buttons are on the page', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Get all buttons and their text
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on the page`);
  
  for (const button of buttons) {
    const text = await button.textContent();
    const isVisible = await button.isVisible();
    console.log(`Button: "${text}" - Visible: ${isVisible}`);
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-page.png' });
  
  // Look for any text that might indicate deck creation
  const pageText = await page.textContent('body');
  console.log('Page contains "Create":', pageText?.includes('Create'));
  console.log('Page contains "Deck":', pageText?.includes('Deck'));
  
  // Get the page HTML to understand what we're dealing with
  const html = await page.innerHTML('body');
  console.log('Page HTML length:', html.length);
  
  // Check for specific UI patterns we might expect
  const hasH1 = await page.locator('h1').count() > 0;
  const hasNavigation = await page.locator('nav').count() > 0;
  console.log('Has H1 elements:', hasH1);
  console.log('Has navigation:', hasNavigation);
});
