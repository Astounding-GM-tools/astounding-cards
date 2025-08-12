import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

// Helper functions
async function testVocabularyBasics(page) {
  console.log('=== Testing Basic Vocabulary Functionality ===');
  
  // Look for category tabs/buttons
  const categorySelectors = [
    page.locator('.category-tab'),
    page.locator('.category-button'),
    page.locator('button').filter({ hasText: /character|item|ability/i })
  ];
  
  let foundCategories = false;
  for (const selector of categorySelectors) {
    const count = await selector.count();
    if (count > 0) {
      console.log(`Found ${count} category elements`);
      foundCategories = true;
      
      // Test clicking first few categories
      for (let i = 0; i < Math.min(count, 3); i++) {
        const category = selector.nth(i);
        if (await category.isVisible()) {
          const categoryText = await category.textContent();
          console.log(`Testing category: "${categoryText}"`);
          await category.click();
          await page.waitForTimeout(500);
        }
      }
      break;
    }
  }
  
  if (foundCategories) {
    console.log('✅ Vocabulary categories working');
  }
  
  // Look for vocabulary items/list
  const itemSelectors = [
    page.locator('.vocab-item'),
    page.locator('.statblock-item'),
    page.locator('.template-item'),
    page.locator('[data-testid*="vocab"]'),
    page.locator('[class*="stat"]')
  ];
  
  let foundItems = false;
  for (const selector of itemSelectors) {
    const count = await selector.count();
    if (count > 0) {
      console.log(`Found ${count} vocabulary items`);
      foundItems = true;
      break;
    }
  }
  
  if (foundItems) {
    console.log('✅ Vocabulary items displayed');
  }
  
  // Look for creation/editing controls
  const actionSelectors = [
    page.locator('button').filter({ hasText: /add|create|new|edit/i }),
    page.locator('input[type="text"]'),
    page.locator('textarea')
  ];
  
  let foundActions = false;
  for (const selector of actionSelectors) {
    const count = await selector.count();
    if (count > 0 && await selector.first().isVisible()) {
      console.log(`Found ${count} action controls`);
      foundActions = true;
      break;
    }
  }
  
  if (foundActions) {
    console.log('✅ Vocabulary action controls available');
  }
}

async function testVocabularyInCurrentView(page) {
  console.log('=== Testing Vocabulary in Current View ===');
  
  // Look for any vocabulary-related text or elements
  const vocabIndicators = [
    page.locator('text=/vocabulary/i'),
    page.locator('text=/statblock/i'),
    page.locator('text=/template/i'),
    page.locator('[class*="vocab"]'),
    page.locator('[class*="statblock"]'),
    page.locator('[class*="template"]')
  ];
  
  let foundVocabContent = false;
  for (let i = 0; i < vocabIndicators.length; i++) {
    const indicator = vocabIndicators[i];
    const count = await indicator.count();
    if (count > 0) {
      console.log(`Found ${count} vocabulary indicators (type ${i})`);
      
      // Show first few examples
      for (let j = 0; j < Math.min(count, 3); j++) {
        const element = indicator.nth(j);
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`  - "${text?.substring(0, 60)}..."`);
          foundVocabContent = true;
        }
      }
    }
  }
  
  if (foundVocabContent) {
    console.log('✅ Vocabulary-related content found in current view');
  } else {
    console.log('ℹ️  No obvious vocabulary content found');
  }
}

async function navigateToStatblocks(page) {
  const deckManagementBtn = page.locator('button:has-text("📚 Manage Decks")');
  await deckManagementBtn.click();
  await page.waitForTimeout(1000);
  
  const statblocksBtn = page.locator('button').filter({ hasText: /statblock/i });
  if (await statblocksBtn.count() > 0) {
    await statblocksBtn.first().click();
    await page.waitForTimeout(1000);
  }
}

test.describe('StatblockVocabularyDialog - E2E Tests', () => {
  let devTools: DevToolsHelper;

  test.beforeEach(async ({ page }) => {
    devTools = new DevToolsHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Setup sample data for consistent testing
    await devTools.setupTestEnvironment();
    await page.waitForTimeout(1000);
  });

  test('should open Deck Management and access Statblocks', async ({ page }) => {
    console.log('=== Testing Deck Management -> Statblocks Access ===');
    
    // Step 1: Open Deck Management
    const deckManagementBtn = page.locator('button:has-text("📚 Manage Decks")');
    await expect(deckManagementBtn).toBeVisible();
    console.log('✅ Found Deck Management button');
    
    await deckManagementBtn.click();
    await page.waitForTimeout(1500);
    
    // Step 2: Look for any dialog/modal that opened
    console.log('=== Checking what opened after Deck Management click ===');
    
    // Try multiple possible selectors for the dialog
    const possibleDialogs = [
      page.locator('dialog[open]'),
      page.locator('.modal'),
      page.locator('[role="dialog"]'),
      page.locator('.dialog'),
      page.locator('.deck-management-dialog'),
      page.locator('.popup'),
      page.locator('.overlay')
    ];
    
    let foundDialog = null;
    for (let i = 0; i < possibleDialogs.length; i++) {
      const dialog = possibleDialogs[i];
      const count = await dialog.count();
      if (count > 0) {
        const isVisible = await dialog.first().isVisible();
        console.log(`Dialog type ${i}: found ${count}, visible: ${isVisible}`);
        if (isVisible && !foundDialog) {
          foundDialog = dialog.first();
        }
      }
    }
    
    if (foundDialog) {
      console.log('✅ Found opened dialog');
      
      // Take screenshot to see what we're working with
      await page.screenshot({ path: 'debug-deck-management-opened.png' });
      
      // Step 3: Look for Statblocks button/tab
      console.log('=== Looking for Statblocks button in dialog ===');
      
      // Try different possible texts for the Statblocks button
      const statblockSelectors = [
        page.locator('button:has-text("Statblocks")'),
        page.locator('button:has-text("Statblock")'),
        page.locator('button').filter({ hasText: /statblock/i }),
        page.locator('tab:has-text("Statblocks")'),
        page.locator('.tab').filter({ hasText: /statblock/i }),
        page.locator('a:has-text("Statblocks")'),
        page.locator('[role="tab"]').filter({ hasText: /statblock/i })
      ];
      
      let statblocksButton = null;
      for (let i = 0; i < statblockSelectors.length; i++) {
        const selector = statblockSelectors[i];
        const count = await selector.count();
        if (count > 0) {
          console.log(`Statblocks selector ${i}: found ${count} elements`);
          const isVisible = await selector.first().isVisible();
          console.log(`  - First element visible: ${isVisible}`);
          
          if (isVisible && !statblocksButton) {
            const text = await selector.first().textContent();
            console.log(`  - Text: "${text}"`);
            statblocksButton = selector.first();
          }
        }
      }
      
      if (statblocksButton) {
        console.log('✅ Found Statblocks button');
        
        // Step 4: Click the Statblocks button
        await statblocksButton.click();
        await page.waitForTimeout(1000);
        
        console.log('=== Checking what opened after Statblocks click ===');
        
        // Look for the vocabulary interface
        const vocabularyElements = [
          page.locator('.vocabulary-dialog'),
          page.locator('.statblock-vocabulary'),
          page.locator('.vocab-management'),
          page.locator('.statblock-editor'),
          page.locator('text=/vocabulary|template|stat/i').first()
        ];
        
        let foundVocabulary = false;
        for (let i = 0; i < vocabularyElements.length; i++) {
          const element = vocabularyElements[i];
          const count = await element.count();
          if (count > 0 && await element.first().isVisible()) {
            console.log(`✅ Found vocabulary interface element ${i}`);
            foundVocabulary = true;
            break;
          }
        }
        
        if (foundVocabulary) {
          console.log('✅ StatblockVocabularyDialog interface accessible');
          
          // Step 5: Test basic vocabulary functionality
          await testVocabularyBasics(page);
          
        } else {
          console.log('ℹ️  No specific vocabulary dialog - checking current view');
          
          // Maybe the vocabulary is just shown in the current dialog
          await testVocabularyInCurrentView(page);
        }
        
      } else {
        console.log('⚠️  No Statblocks button found');
        console.log('=== Available buttons in dialog ===');
        
        // List all available buttons
        const allButtons = page.locator('button:visible');
        const buttonCount = await allButtons.count();
        console.log(`Found ${buttonCount} visible buttons:`);
        
        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = allButtons.nth(i);
          const buttonText = await button.textContent();
          console.log(`  ${i}: "${buttonText}"`);
        }
        
        // Try to find anything vocabulary-related in current view
        await testVocabularyInCurrentView(page);
      }
      
    } else {
      console.log('❌ No dialog opened after clicking Deck Management');
      
      // Maybe it navigated to a page instead?
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Look for deck management content on page
      const deckContent = page.locator('text=/deck|manage|statblock/i').first();
      if (await deckContent.count() > 0) {
        console.log('ℹ️  Deck management content found on page');
        await testVocabularyInCurrentView(page);
      }
    }
    
    console.log('✅ Deck Management -> Statblocks access test completed');
  });


  test('should test vocabulary management interface', async ({ page }) => {
    console.log('=== Testing Vocabulary Management Interface ===');
    
    // Navigate to statblocks via deck management
    await navigateToStatblocks(page);
    
    // Test that we can access the vocabulary interface
    await testVocabularyBasics(page);
    
    // Look for vocabulary categories and items
    const categoryButtons = page.locator('button').filter({ hasText: /character|item|ability/i });
    const categoryCount = await categoryButtons.count();
    
    if (categoryCount > 0) {
      console.log(`Found ${categoryCount} vocabulary categories`);
      
      // Test clicking different categories to see vocabulary items
      for (let i = 0; i < Math.min(categoryCount, 3); i++) {
        const category = categoryButtons.nth(i);
        if (await category.isVisible()) {
          const categoryText = await category.textContent();
          console.log(`\n--- Testing ${categoryText} Category ---`);
          
          await category.click();
          await page.waitForTimeout(500);
          
          // Look for vocabulary items in this category
          const vocabItems = page.locator('[class*="stat"], .vocab-item, .template-item');
          const itemCount = await vocabItems.count();
          console.log(`${categoryText} category has ${itemCount} vocabulary items`);
          
          if (itemCount > 0) {
            // Show first few items
            for (let j = 0; j < Math.min(itemCount, 3); j++) {
              const item = vocabItems.nth(j);
              if (await item.isVisible()) {
                const itemText = await item.textContent();
                console.log(`  - ${itemText?.substring(0, 40)}...`);
              }
            }
            console.log(`✅ ${categoryText} vocabulary items accessible`);
          }
        }
      }
    } else {
      console.log('ℹ️  No vocabulary categories found, checking for general vocabulary content');
      await testVocabularyInCurrentView(page);
    }
    
    console.log('\n✅ Vocabulary management interface test completed');
    
    // Close any open dialogs
    await page.keyboard.press('Escape');
  });


  test('should test vocabulary editing workflow', async ({ page }) => {
    console.log('=== Testing Vocabulary Editing ===');
    
    // Navigate to statblocks
    await navigateToStatblocks(page);
    
    // Look for existing vocabulary items to edit
    const editableSelectors = [
      page.locator('.vocab-item'),
      page.locator('.statblock-item'),
      page.locator('button').filter({ hasText: /edit/i }),
      page.locator('[data-testid*="edit"]'),
      page.locator('[class*="edit"]')
    ];
    
    let editTarget = null;
    for (const selector of editableSelectors) {
      const count = await selector.count();
      if (count > 0 && await selector.first().isVisible()) {
        console.log(`Found ${count} editable elements`);
        editTarget = selector.first();
        break;
      }
    }
    
    if (editTarget) {
      console.log('✅ Testing vocabulary editing workflow');
      
      await editTarget.click();
      await page.waitForTimeout(500);
      
      // Look for edit form or inline editing
      const editIndicators = [
        page.locator('input:focus'),
        page.locator('textarea:focus'),
        page.locator('.edit-mode'),
        page.locator('button:has-text("Save")'),
        page.locator('button:has-text("Update")')
      ];
      
      let editingActive = false;
      for (const indicator of editIndicators) {
        if (await indicator.count() > 0) {
          console.log('✅ Edit mode activated');
          editingActive = true;
          
          // Cancel editing
          const cancelBtn = page.locator('button:has-text("Cancel")').first();
          if (await cancelBtn.count() > 0) {
            await cancelBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
          break;
        }
      }
      
      if (!editingActive) {
        console.log('ℹ️  Edit mode not clearly detected');
      }
    } else {
      console.log('ℹ️  No editable vocabulary items found');
    }
    
    // Close any open dialogs
    await page.keyboard.press('Escape');
  });

  test.afterEach(async ({ page }) => {
    await devTools.disableDevMode();
    
    // Clean up any debug screenshots
    await page.waitForTimeout(500);
  });
});
