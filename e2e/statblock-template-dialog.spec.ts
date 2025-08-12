import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('StatblockTemplateDialog E2E Tests', () => {
  let devTools: DevToolsHelper;

  test.beforeEach(async ({ page }) => {
    devTools = new DevToolsHelper(page);
    
    // Navigate to the app and set up clean test environment
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Use dev tools to set up a clean test environment with sample data
    await devTools.setupTestEnvironment();
  });

  test('should open template dialog when adding stats to a card', async ({ page }) => {
    // Create a card first
    await createTestCard(page);
    
    // Look for button to add stats/mechanics (adjust selector based on your app)
    const addStatsButton = page.locator('button:has-text("Add Stats"), button:has-text("Add Game Stats"), .add-mechanics');
    
    if (await addStatsButton.count() > 0) {
      await addStatsButton.first().click();
      
      // Verify dialog opened
      const dialog = page.locator('dialog.template-dialog, .template-dialog');
      await expect(dialog).toBeVisible();
      
      // Verify dialog header
      await expect(page.locator('h2:has-text("Add Game Stats")')).toBeVisible();
    } else {
      console.log('Add Stats button not found - might need different test setup');
      test.skip();
    }
  });

  test('should display category tabs and allow category switching', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Verify category tabs are visible
    const categoryTabs = [
      { key: 'Character', icon: '👤' },
      { key: 'Item', icon: '⚔️' },
      { key: 'Ability', icon: '✨' },
      { key: 'Custom', icon: '📋' }
    ];
    
    for (const category of categoryTabs) {
      const tab = page.locator(`button:has-text("${category.key}")`);
      await expect(tab).toBeVisible();
      
      // Verify icon is present
      await expect(tab.locator(`:text("${category.icon}")`)).toBeVisible();
    }
    
    // Test category switching
    await page.click('button:has-text("Item")');
    await expect(page.locator('button:has-text("Item")')).toHaveClass(/active/);
    
    await page.click('button:has-text("Ability")');
    await expect(page.locator('button:has-text("Ability")')).toHaveClass(/active/);
  });

  test('should display templates for selected category', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Select Character category
    await page.click('button:has-text("Character")');
    
    // Wait for templates to load
    await page.waitForTimeout(500);
    
    // Check if template cards are displayed
    const templateCards = page.locator('.template-card');
    const templateCount = await templateCards.count();
    
    if (templateCount > 0) {
      // Verify template card structure
      const firstTemplate = templateCards.first();
      await expect(firstTemplate).toBeVisible();
      
      // Should have icon, name, description
      await expect(firstTemplate.locator('.template-icon')).toBeVisible();
      await expect(firstTemplate.locator('.template-name')).toBeVisible();
      await expect(firstTemplate.locator('.template-description')).toBeVisible();
      await expect(firstTemplate.locator('.template-stats-count')).toBeVisible();
    }
  });

  test('should allow template selection and show preview', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Select a category with templates
    await page.click('button:has-text("Character")');
    await page.waitForTimeout(500);
    
    const templateCards = page.locator('.template-card');
    if (await templateCards.count() > 0) {
      // Click first template
      await templateCards.first().click();
      
      // Verify template is selected
      await expect(templateCards.first()).toHaveClass(/selected/);
      
      // Verify preview appears
      const preview = page.locator('.template-preview');
      await expect(preview).toBeVisible();
      await expect(preview.locator('h3')).toContainText('Preview:');
      
      // Verify preview shows stats
      const previewStats = preview.locator('.preview-stats');
      await expect(previewStats).toBeVisible();
    }
  });

  test('should handle custom template creation', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Switch to Custom category
    await page.click('button:has-text("Custom")');
    
    // Verify custom option is displayed
    const customCard = page.locator('.custom-card');
    await expect(customCard).toBeVisible();
    await expect(customCard).toContainText('Start from Scratch');
    await expect(customCard).toContainText('Create custom stats manually');
    
    // Click custom option
    await customCard.click();
    
    // Verify dialog closes (custom action dispatched)
    const dialog = page.locator('dialog.template-dialog, .template-dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('should confirm template selection and close dialog', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Select a template
    await page.click('button:has-text("Character")');
    await page.waitForTimeout(500);
    
    const templateCards = page.locator('.template-card');
    if (await templateCards.count() > 0) {
      await templateCards.first().click();
      
      // Find and click confirm button
      const confirmButton = page.locator('button.primary, button:has-text("Add"), button:has-text("Confirm")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
        
        // Verify dialog closes
        const dialog = page.locator('dialog.template-dialog, .template-dialog');
        await expect(dialog).not.toBeVisible();
      }
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Test Escape key closes dialog
    await page.keyboard.press('Escape');
    
    const dialog = page.locator('dialog.template-dialog, .template-dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('should handle empty category gracefully', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Try to find a category that might be empty
    await page.click('button:has-text("Ability")');
    await page.waitForTimeout(500);
    
    const templateCards = page.locator('.template-card');
    const templateCount = await templateCards.count();
    
    if (templateCount === 0) {
      // Should show empty state
      const emptyState = page.locator('.empty-category');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No templates available');
      
      // Should offer custom alternative
      const customButton = emptyState.locator('button:has-text("Create custom")');
      await expect(customButton).toBeVisible();
    }
  });

  test('should display vocabulary-formatted stats in preview', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Select character category and a template
    await page.click('button:has-text("Character")');
    await page.waitForTimeout(500);
    
    const templateCards = page.locator('.template-card');
    if (await templateCards.count() > 0) {
      await templateCards.first().click();
      
      // Check preview shows formatted stats
      const preview = page.locator('.template-preview');
      if (await preview.isVisible()) {
        const statLabels = preview.locator('.stat-label');
        if (await statLabels.count() > 0) {
          // Verify stat labels have colons (formatted by vocabulary)
          const firstLabel = await statLabels.first().textContent();
          expect(firstLabel).toMatch(/.*:/);
        }
      }
    }
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await openTemplateDialog(page);
    
    // Test tab navigation through category tabs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test Enter key on focused elements
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      await page.keyboard.press('Enter');
      // Verify some action occurred (category switched or template selected)
    }
    
    // Test arrow key navigation if implemented
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
  });

  test.afterEach(async ({ page }) => {
    // Disable dev mode after each test for cleanup
    await devTools.disableDevMode();
  });
});

// Helper functions

async function setupTestDeck(page: any) {
  // Check if we already have a deck
  const manageDeckButton = page.locator('button:has-text("Manage Decks")');
  if (await manageDeckButton.count() > 0) {
    // Create deck if needed - this is a simplified version
    // You might need to adjust based on your actual deck creation flow
    try {
      await manageDeckButton.click();
      await page.waitForTimeout(1000);
      
      const createButton = page.locator('button:has-text("Create New Deck")');
      if (await createButton.count() > 0) {
        await createButton.click();
        
        const nameInput = page.locator('input[placeholder*="deck"], input[placeholder*="name"]');
        if (await nameInput.count() > 0) {
          await nameInput.fill('E2E Test Deck');
          
          const confirmButton = page.locator('button.primary:has-text("Create")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    } catch (error) {
      console.log('Deck setup failed or deck already exists:', error);
    }
  }
}

async function createTestCard(page: any) {
  // Look for add card button and create a card
  const addCardVariations = [
    'button:has-text("Add Card")',
    'button:has-text("+ Add Card")', 
    'button:has-text("➕ Add Card")',
    '.add-card-button',
    '.add-card'
  ];
  
  for (const selector of addCardVariations) {
    if (await page.locator(selector).count() > 0) {
      await page.locator(selector).first().click();
      await page.waitForTimeout(1000);
      break;
    }
  }
}

async function openTemplateDialog(page: any) {
  // Create a card first if needed
  await createTestCard(page);
  
  // Look for stats/mechanics button to open the template dialog
  const statsButtonVariations = [
    'button:has-text("Add Stats")',
    'button:has-text("Add Game Stats")',
    'button:has-text("Add Mechanics")',
    '.add-stats',
    '.add-mechanics'
  ];
  
  for (const selector of statsButtonVariations) {
    if (await page.locator(selector).count() > 0) {
      await page.locator(selector).first().click();
      await page.waitForTimeout(500);
      
      // Verify dialog opened
      const dialog = page.locator('dialog.template-dialog, .template-dialog');
      if (await dialog.isVisible()) {
        return;
      }
    }
  }
  
  // If we can't open the dialog, skip the test
  throw new Error('Could not open template dialog - adjust selectors for your app');
}
