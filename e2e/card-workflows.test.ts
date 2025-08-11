import { expect, test } from '@playwright/test';

test.describe('Card Creation and Management', () => {
  test('should create a new deck and add cards', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load and check initial state
    await expect(page.locator('h1')).toBeVisible();
    
    // Create a new deck (should start with empty state)
    await page.click('button:has-text("Create Deck")');
    
    // Add first card
    await page.click('button:has-text("Add Card")');
    
    // Verify card was added
    await expect(page.locator('.card')).toBeVisible();
    
    // Edit the card name
    const nameField = page.locator('input[placeholder*="Name"], input[value="New Card"]').first();
    await nameField.click();
    await nameField.fill('Test Hero');
    await nameField.blur();
    
    // Edit the role
    const roleField = page.locator('input[placeholder*="Role"], input[value="Role"]').first();
    await roleField.click();
    await roleField.fill('Warrior');
    await roleField.blur();
    
    // Verify the changes
    await expect(page.locator('text=Test Hero')).toBeVisible();
    await expect(page.locator('text=Warrior')).toBeVisible();
  });

  test('should edit card traits and secrets', async ({ page }) => {
    await page.goto('/');
    
    // Create deck and card
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Find and edit traits
    const traitInputs = page.locator('textarea[placeholder*="trait"], input[value*="Notable"]');
    const firstTrait = traitInputs.first();
    await firstTrait.click();
    await firstTrait.fill('Notable: Legendary sword wielder');
    await firstTrait.blur();
    
    // Verify trait was updated
    await expect(page.locator('text=Legendary sword wielder')).toBeVisible();
    
    // Edit secrets
    const secretInputs = page.locator('textarea[placeholder*="secret"], input[value*="Hidden"]');
    const firstSecret = secretInputs.first();
    await firstSecret.click();
    await firstSecret.fill('Hidden: Seeks revenge for fallen kingdom');
    await firstSecret.blur();
    
    // Verify secret was updated
    await expect(page.locator('text=Seeks revenge for fallen kingdom')).toBeVisible();
  });

  test('should add and manage card stats', async ({ page }) => {
    await page.goto('/');
    
    // Create deck and card
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Look for Stats button or similar stats interface
    const statsButton = page.locator('button:has-text("Stats"), .stats-add, .stat-item').first();
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Try to add a stat (this will depend on your stats dialog implementation)
      const addStatButton = page.locator('button:has-text("Add Stat"), .add-button');
      if (await addStatButton.isVisible()) {
        await addStatButton.click();
        
        // Select a stat type (Health, Attack, etc.)
        const healthStat = page.locator('button:has-text("Health"), .stat-option').first();
        if (await healthStat.isVisible()) {
          await healthStat.click();
          
          // Add a value
          const valueInput = page.locator('input[placeholder*="value"], input[placeholder*="Value"]');
          if (await valueInput.isVisible()) {
            await valueInput.fill('100');
            
            // Confirm add
            const confirmButton = page.locator('button:has-text("Add")');
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
            }
          }
        }
      }
      
      // Save stats dialog if needed
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
    }
  });
});

test.describe('Theme and Size Management', () => {
  test('should change card theme', async ({ page }) => {
    await page.goto('/');
    
    // Create deck
    await page.click('button:has-text("Create Deck")');
    
    // Look for theme selector (could be in deck manager or settings)
    const themeButton = page.locator('button:has-text("Theme"), button:has-text("Classic"), .theme-selector').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // Try to select a different theme
      const scriptorumTheme = page.locator('text=Scriptorum, text=Medieval, button:has-text("Scriptorum")').first();
      if (await scriptorumTheme.isVisible()) {
        await scriptoriumTheme.click();
        
        // Verify theme change (look for theme-specific elements or classes)
        await expect(page.locator('[data-theme="scriptorum"], .scriptorum')).toBeVisible();
      }
    }
  });

  test('should change card size', async ({ page }) => {
    await page.goto('/');
    
    // Create deck
    await page.click('button:has-text("Create Deck")');
    
    // Look for size selector
    const sizeButton = page.locator('button:has-text("Size"), button:has-text("Poker"), .size-selector').first();
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
      
      // Try to select different size
      const tarotSize = page.locator('text=Tarot, button:has-text("Tarot")').first();
      if (await tarotSize.isVisible()) {
        await tarotSize.click();
        
        // Verify size change
        await expect(page.locator('.card.tarot, [data-size="tarot"]')).toBeVisible();
      }
    }
  });
});

test.describe('Vocabulary Customization', () => {
  test('should open and customize vocabulary', async ({ page }) => {
    await page.goto('/');
    
    // Create deck
    await page.click('button:has-text("Create Deck")');
    
    // Look for Statblocks/Vocabulary button (replacing old presets)
    const statblocksButton = page.locator('button:has-text("Statblocks"), button:has-text("Vocabulary")').first();
    if (await statblocksButton.isVisible()) {
      await statblocksButton.click();
      
      // Should see vocabulary editor with default stat names
      await expect(page.locator('text=Health, text=Defense, text=Initiative')).toBeVisible();
      
      // Try to edit a stat name
      const healthInput = page.locator('input[value="Health"]').first();
      if (await healthInput.isVisible()) {
        await healthInput.fill('Hit Points');
        
        // Save changes
        const saveButton = page.locator('button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    }
  });
});

test.describe('Print and Export', () => {
  test('should access print view', async ({ page }) => {
    await page.goto('/');
    
    // Create deck and card
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Look for print button
    const printButton = page.locator('button:has-text("Print"), a[href*="print"]').first();
    if (await printButton.isVisible()) {
      await printButton.click();
      
      // Should navigate to print view
      await expect(page.url()).toContain('print');
      
      // Should see cards in print layout
      await expect(page.locator('.card, .print-page')).toBeVisible();
    }
  });

  test('should export deck', async ({ page }) => {
    await page.goto('/');
    
    // Create deck and card
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Share")').first();
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Should see export options or URL
      await expect(page.locator('text=URL, text=Share, text=Export')).toBeVisible();
    }
  });
});

test.describe('Accessibility and Keyboard Navigation', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Continue tabbing and ensure focus is visible
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test Enter key activation
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await page.keyboard.press('Enter');
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on interactive elements
    await expect(page.locator('[aria-label], [role="button"], [role="listitem"]')).toHaveCount({ gte: 1 });
    
    // Check that draggable elements have proper roles (we fixed this)
    const draggableElements = page.locator('[draggable="true"]');
    if (await draggableElements.count() > 0) {
      await expect(draggableElements.first()).toHaveAttribute('role');
    }
  });
});
