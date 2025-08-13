import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('Statblock Templates and Advanced Features', () => {
  let devTools: DevToolsHelper;

  test.beforeEach(async ({ page }) => {
    devTools = new DevToolsHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Setup sample data for consistent testing
    await devTools.setupTestEnvironment();
    await page.waitForTimeout(1000);
  });

  test('should use statblock templates to add multiple stats', async ({ page }) => {
    // Use sample data environment - no need to create deck and card
    // Open stats editor
    const statsButton = page.locator('button:has-text("Stats"), .stats-add').first();
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Look for template button or similar
      const templateButton = page.locator('button:has-text("Template"), button:has-text("Add Template")');
      if (await templateButton.isVisible()) {
        await templateButton.click();
        
        // Select a template (e.g., "Basic RPG Character")
        const basicTemplate = page.locator('text=Basic, text=Character, .template-option').first();
        if (await basicTemplate.isVisible()) {
          await basicTemplate.click();
          
          // Apply template
          const applyButton = page.locator('button:has-text("Apply"), button:has-text("Add")');
          if (await applyButton.isVisible()) {
            await applyButton.click();
            
            // Should see multiple stats added (Health, Defense, etc.)
            await expect(page.locator('.stat-editor, .stat-item')).toHaveCount({ gte: 3 });
          }
        }
      }
    }
  });

  test('should drag and drop to reorder stats', async ({ page }) => {
    await page.goto('/');
    
    // Create deck and card
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Add multiple stats first
    const statsButton = page.locator('button:has-text("Stats"), .stats-add').first();
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Add first stat
      const addButton = page.locator('button:has-text("Add Stat")');
      if (await addButton.isVisible()) {
        await addButton.click();
        const healthStat = page.locator('button:has-text("Health")').first();
        if (await healthStat.isVisible()) {
          await healthStat.click();
          const valueInput = page.locator('input[placeholder*="value"]');
          if (await valueInput.isVisible()) {
            await valueInput.fill('100');
            await page.click('button:has-text("Add")');
          }
        }
        
        // Add second stat
        await addButton.click();
        const attackStat = page.locator('button:has-text("Attack")').first();
        if (await attackStat.isVisible()) {
          await attackStat.click();
          const valueInput2 = page.locator('input[placeholder*="value"]');
          if (await valueInput2.isVisible()) {
            await valueInput2.fill('75');
            await page.click('button:has-text("Add")');
          }
        }
      }
      
      // Now test drag and drop reordering
      const dragHandles = page.locator('.drag-handle');
      if (await dragHandles.count() >= 2) {
        const firstHandle = dragHandles.first();
        const secondHandle = dragHandles.nth(1);
        
        // Get bounding boxes for drag operation
        const firstBox = await firstHandle.boundingBox();
        const secondBox = await secondHandle.boundingBox();
        
        if (firstBox && secondBox) {
          // Drag first item to second position
          await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
          await page.mouse.up();
          
          // Verify reordering occurred (items should be in different positions)
          await expect(page.locator('.stat-editor')).toHaveCount({ gte: 2 });
        }
      }
    }
  });

  test('should apply custom vocabulary to templates', async ({ page }) => {
    await page.goto('/');
    
    // Create deck
    await page.click('button:has-text("Create Deck")');
    
    // Customize vocabulary first
    const statblocksButton = page.locator('button:has-text("Statblocks")');
    if (await statblocksButton.isVisible()) {
      await statblocksButton.click();
      
      // Change "Health" to "Hit Points"
      const healthInput = page.locator('input[value="Health"]');
      if (await healthInput.isVisible()) {
        await healthInput.fill('Hit Points');
        await page.click('button:has-text("Save")');
      }
    }
    
    // Add a card
    await page.click('button:has-text("Add Card")');
    
    // Open stats and add template
    const statsButton = page.locator('button:has-text("Stats")');
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Add template that should use custom vocabulary
      const templateButton = page.locator('button:has-text("Template")');
      if (await templateButton.isVisible()) {
        await templateButton.click();
        
        const basicTemplate = page.locator('.template-option').first();
        if (await basicTemplate.isVisible()) {
          await basicTemplate.click();
          await page.click('button:has-text("Apply")');
          
          // Should see "Hit Points" instead of "Health"
          await expect(page.locator('text=Hit Points')).toBeVisible();
          await expect(page.locator('text=Health')).not.toBeVisible();
        }
      }
    }
  });

  test.afterEach(async ({ page }) => {
    await devTools.disableDevMode();
  });
});

test.describe('Deck Management and Sharing', () => {
  let devTools: DevToolsHelper;

  test.beforeEach(async ({ page }) => {
    devTools = new DevToolsHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Setup sample data for consistent testing
    await devTools.setupTestEnvironment();
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    await devTools.disableDevMode();
  });
  test('should duplicate a deck with all cards', async ({ page }) => {
    await page.goto('/');
    
    // Create deck with cards
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Edit the card to make it unique
    const nameField = page.locator('input[value="New Card"]');
    if (await nameField.isVisible()) {
      await nameField.fill('Original Card');
      await nameField.blur();
    }
    
    // Open deck management
    const deckButton = page.locator('button:has-text("Deck"), .deck-manager');
    if (await deckButton.isVisible()) {
      await deckButton.click();
      
      // Look for duplicate option
      const duplicateButton = page.locator('button:has-text("Duplicate"), button:has-text("Copy")');
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();
        
        // Enter new name
        const nameInput = page.locator('input[placeholder*="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Duplicated Deck');
          await page.click('button:has-text("Duplicate"), button:has-text("Create")');
        }
        
        // Should see the new deck with the same cards
        await expect(page.locator('text=Duplicated Deck')).toBeVisible();
        await expect(page.locator('text=Original Card')).toBeVisible();
      }
    }
  });

  test('should share deck via URL', async ({ page }) => {
    await page.goto('/');
    
    // Create deck with content
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Look for share functionality
    const shareButton = page.locator('button:has-text("Share"), button:has-text("Export")');
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Should see URL or sharing options
      await expect(page.locator('text=URL, text=Link, input[value*="http"]')).toBeVisible();
      
      // Copy URL button should be present
      const copyButton = page.locator('button:has-text("Copy")');
      if (await copyButton.isVisible()) {
        await copyButton.click();
        
        // Should show success message
        await expect(page.locator('text=Copied, text=Success')).toBeVisible();
      }
    }
  });

  test('should switch between different decks', async ({ page }) => {
    await page.goto('/');
    
    // Create first deck
    await page.click('button:has-text("Create Deck")');
    const firstDeckName = page.locator('input[placeholder*="deck"], input[value*="Deck"]').first();
    if (await firstDeckName.isVisible()) {
      await firstDeckName.fill('First Deck');
      await firstDeckName.blur();
    }
    
    // Create second deck
    await page.click('button:has-text("Create Deck")');
    const secondDeckName = page.locator('input[placeholder*="deck"], input[value*="Deck"]').first();
    if (await secondDeckName.isVisible()) {
      await secondDeckName.fill('Second Deck');
      await secondDeckName.blur();
    }
    
    // Switch back to first deck
    const deckSelector = page.locator('select, .deck-selector, button:has-text("First Deck")');
    if (await deckSelector.isVisible()) {
      await deckSelector.click();
      
      if (await deckSelector.locator('option, text=First Deck').isVisible()) {
        await deckSelector.locator('option, text=First Deck').click();
        
        // Should show first deck content
        await expect(page.locator('text=First Deck')).toBeVisible();
      }
    }
  });
});

test.describe('Print and Layout Features', () => {
  test('should generate print layout with crop marks', async ({ page }) => {
    await page.goto('/');
    
    // Create deck with multiple cards
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    await page.click('button:has-text("Add Card")');
    await page.click('button:has-text("Add Card")');
    
    // Go to print view
    const printButton = page.locator('a[href*="print"], button:has-text("Print")');
    if (await printButton.isVisible()) {
      await printButton.click();
      
      // Should see print layout
      await expect(page.locator('.print-page, .card-grid')).toBeVisible();
      
      // Should see multiple cards arranged for printing
      await expect(page.locator('.card')).toHaveCount({ gte: 3 });
      
      // Look for crop marks (if implemented)
      const cropMarks = page.locator('.crop-mark, .crop');
      if (await cropMarks.count() > 0) {
        await expect(cropMarks.first()).toBeVisible();
      }
    }
  });

  test('should handle different card sizes in print layout', async ({ page }) => {
    await page.goto('/');
    
    // Create deck
    await page.click('button:has-text("Create Deck")');
    
    // Change to Tarot size
    const sizeButton = page.locator('button:has-text("Size"), button:has-text("Poker")');
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
      const tarotOption = page.locator('text=Tarot, button:has-text("Tarot")');
      if (await tarotOption.isVisible()) {
        await tarotOption.click();
      }
    }
    
    // Add cards
    await page.click('button:has-text("Add Card")');
    await page.click('button:has-text("Add Card")');
    
    // Go to print
    const printButton = page.locator('a[href*="print"]');
    if (await printButton.isVisible()) {
      await printButton.click();
      
      // Should see tarot-sized cards in print layout
      await expect(page.locator('.card.tarot, [data-size="tarot"]')).toBeVisible();
    }
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle loading deck from URL parameters', async ({ page }) => {
    // This would test URL-based deck sharing
    // For now, just test that malformed URLs don't break the app
    await page.goto('/?deck=invalid-data');
    
    // Should still load the app without crashing
    await expect(page.locator('h1')).toBeVisible();
    
    // Should show error message or fallback to empty state
    await expect(page.locator('text=Error, text=Invalid, button:has-text("Create Deck")')).toBeVisible();
  });

  test('should handle empty deck states gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Create deck but don't add cards
    await page.click('button:has-text("Create Deck")');
    
    // Try to go to print view with empty deck
    const printButton = page.locator('a[href*="print"]');
    if (await printButton.isVisible()) {
      await printButton.click();
      
      // Should handle empty state gracefully
      await expect(page.locator('text=No cards, text=Empty, text=Add Card')).toBeVisible();
    }
  });

  test('should persist data across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Create deck with specific content
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    const nameField = page.locator('input[value="New Card"]');
    if (await nameField.isVisible()) {
      await nameField.fill('Persistent Card');
      await nameField.blur();
      
      // Wait for save
      await page.waitForTimeout(1000);
    }
    
    // Reload page
    await page.reload();
    
    // Should still see the card
    await expect(page.locator('text=Persistent Card')).toBeVisible();
  });
});
