import { expect, test } from '@playwright/test';

test.describe('Complete Integration Tests - Clean State', () => {
  // Use dev mode clear database for reliable clean state
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Enable dev mode to access clear database
    await page.keyboard.press('F12');
    await page.waitForTimeout(100);
    
    // Clear database using the built-in dev mode feature
    const clearButton = page.locator('button:has-text("Clear database")');
    if (await clearButton.isVisible({ timeout: 1000 })) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('complete card creation workflow with markup verification', async ({ page }) => {
    // Start from completely clean state
    await expect(page.locator('h1')).toBeVisible();
    
    // Step 1: Create a new deck
    await page.click('button:has-text("Create Deck")');
    await expect(page.locator('text=New Deck, text=Untitled')).toBeVisible();
    
    // Step 2: Customize deck name
    const deckNameInput = page.locator('input[value*="Deck"]').first();
    if (await deckNameInput.isVisible()) {
      await deckNameInput.fill('Integration Test Deck');
      await deckNameInput.blur();
    }
    
    // Step 3: Add first card
    await page.click('button:has-text("Add Card")');
    
    // Verify card was created with default values
    await expect(page.locator('.card')).toBeVisible();
    await expect(page.locator('text=New Card')).toBeVisible();
    await expect(page.locator('text=Role')).toBeVisible();
    
    // Step 4: Edit card details
    const nameField = page.locator('input[value="New Card"]').first();
    await nameField.fill('Aragorn');
    await nameField.blur();
    
    const roleField = page.locator('input[value="Role"]').first();
    await roleField.fill('Ranger King');
    await roleField.blur();
    
    // Step 5: Edit traits
    const traitField = page.locator('input[value*="Notable"], textarea[value*="Notable"]').first();
    await traitField.fill('Notable: Heir of Isildur, rightful king');
    await traitField.blur();
    
    // Step 6: Edit secrets
    const secretField = page.locator('input[value*="Hidden"], textarea[value*="Hidden"]').first();
    await secretField.fill('Hidden: Bears the shards of Narsil');
    await secretField.blur();
    
    // Step 7: Edit description
    const descField = page.locator('textarea[placeholder*="description"], input[value*="Add a description"]').first();
    if (await descField.isVisible()) {
      await descField.fill('A weathered ranger with the bearing of nobility, carrying ancient burdens.');
      await descField.blur();
    }
    
    // Wait for saves to complete
    await page.waitForTimeout(1000);
    
    // Step 8: Verify the markup structure is correct
    const cardElement = page.locator('.card').first();
    await expect(cardElement).toBeVisible();
    
    // Verify card content structure
    await expect(cardElement.locator('text=Aragorn')).toBeVisible();
    await expect(cardElement.locator('text=Ranger King')).toBeVisible();
    await expect(cardElement.locator('text=Heir of Isildur')).toBeVisible();
    await expect(cardElement.locator('text=Bears the shards of Narsil')).toBeVisible();
    
    // Step 9: Add stats to the card
    const statsButton = page.locator('button:has-text("Stats"), .stats-add').first();
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Add Health stat
      const addStatButton = page.locator('button:has-text("Add Stat")');
      if (await addStatButton.isVisible()) {
        await addStatButton.click();
        
        const healthOption = page.locator('button:has-text("Health"), .stat-option').first();
        if (await healthOption.isVisible()) {
          await healthOption.click();
          
          const valueInput = page.locator('input[placeholder*="value"]').first();
          await valueInput.fill('120');
          await page.click('button:has-text("Add")');
        }
      }
      
      // Save stats
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
      
      // Verify stat appears on card
      await expect(page.locator('text=120')).toBeVisible();
    }
  });

  test('theme and size changes with visual verification', async ({ page }) => {
    // Create deck and card
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Edit card to have distinctive content
    await page.locator('input[value="New Card"]').fill('Test Character');
    await page.locator('input[value="Role"]').fill('Test Role');
    
    // Test theme change
    const themeButton = page.locator('button:has-text("Theme"), button:has-text("Classic")').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // Switch to Scriptorum theme
      const scriptorumOption = page.locator('button:has-text("Scriptorum"), text=Scriptorum').first();
      if (await scriptorumOption.isVisible()) {
        await scriptorumOption.click();
        
        // Verify theme change in DOM
        await expect(page.locator('[data-theme="scriptorum"]')).toBeVisible();
        
        // Verify theme-specific styling is applied
        const cardWithTheme = page.locator('.card[data-theme="scriptorum"], [data-theme="scriptorum"] .card').first();
        await expect(cardWithTheme).toBeVisible();
      }
    }
    
    // Test size change
    const sizeButton = page.locator('button:has-text("Size"), button:has-text("Poker")').first();
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
      
      // Switch to Tarot size
      const tarotOption = page.locator('button:has-text("Tarot"), text=Tarot').first();
      if (await tarotOption.isVisible()) {
        await tarotOption.click();
        
        // Verify size change in DOM
        await expect(page.locator('.card[data-size="tarot"], [data-size="tarot"] .card')).toBeVisible();
        
        // Verify card dimensions changed (Tarot cards should be larger)
        const card = page.locator('.card').first();
        const cardBox = await card.boundingBox();
        expect(cardBox?.height).toBeGreaterThan(300); // Tarot cards should be tall
      }
    }
  });

  test('vocabulary customization end-to-end workflow', async ({ page }) => {
    // Create deck
    await page.click('button:has-text("Create Deck")');
    
    // Step 1: Customize vocabulary
    const statblocksButton = page.locator('button:has-text("Statblocks")').first();
    if (await statblocksButton.isVisible()) {
      await statblocksButton.click();
      
      // Change "Health" to "Hit Points"
      const healthInput = page.locator('input[value="Health"]').first();
      if (await healthInput.isVisible()) {
        await healthInput.clear();
        await healthInput.fill('Hit Points');
      }
      
      // Change "Attack" to "Damage"
      const attackInput = page.locator('input[value="Attack"]').first();
      if (await attackInput.isVisible()) {
        await attackInput.clear();
        await attackInput.fill('Damage');
      }
      
      // Add a custom stat
      const addButton = page.locator('button:has-text("Add Stat")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const customNameInput = page.locator('input[placeholder*="stat name"]').last();
        if (await customNameInput.isVisible()) {
          await customNameInput.fill('Magic Power');
        }
      }
      
      // Save vocabulary changes
      await page.click('button:has-text("Save")');
    }
    
    // Step 2: Add a card and verify custom vocabulary is used
    await page.click('button:has-text("Add Card")');
    
    const statsButton = page.locator('button:has-text("Stats")').first();
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Verify custom vocabulary appears in stats dialog
      await expect(page.locator('text=Hit Points')).toBeVisible();
      await expect(page.locator('text=Damage')).toBeVisible();
      await expect(page.locator('text=Magic Power')).toBeVisible();
      
      // Verify old names don't appear
      await expect(page.locator('text=Health')).not.toBeVisible();
      await expect(page.locator('text=Attack')).not.toBeVisible();
    }
  });

  test('complete print workflow with layout verification', async ({ page }) => {
    // Create deck with multiple cards
    await page.click('button:has-text("Create Deck")');
    
    // Add 6 cards with different content
    for (let i = 1; i <= 6; i++) {
      await page.click('button:has-text("Add Card")');
      
      const nameField = page.locator('input[value="New Card"]').last();
      await nameField.fill(`Character ${i}`);
      await nameField.blur();
      
      const roleField = page.locator('input[value="Role"]').last();
      await roleField.fill(`Role ${i}`);
      await roleField.blur();
    }
    
    // Go to print view
    const printLink = page.locator('a[href*="print"]').first();
    if (await printLink.isVisible()) {
      await printLink.click();
      
      // Verify we're in print mode
      await expect(page.url()).toContain('print');
      
      // Verify all cards are present in print layout
      for (let i = 1; i <= 6; i++) {
        await expect(page.locator(`text=Character ${i}`)).toBeVisible();
      }
      
      // Verify print-specific elements
      await expect(page.locator('.print-page, .card-grid')).toBeVisible();
      
      // Verify cards are arranged in a grid
      const cards = page.locator('.card');
      const cardCount = await cards.count();
      expect(cardCount).toBe(6);
      
      // Check that cards have appropriate print styling
      const firstCard = cards.first();
      const cardStyles = await firstCard.evaluate(el => getComputedStyle(el));
      
      // Verify print-optimized styling (no shadows, appropriate borders, etc.)
      expect(cardStyles.boxShadow).toBe('none');
    }
  });

  test('data persistence and reload verification', async ({ page }) => {
    // Create deck with specific data
    await page.click('button:has-text("Create Deck")');
    
    const deckNameInput = page.locator('input[value*="Deck"]').first();
    await deckNameInput.fill('Persistent Test Deck');
    await deckNameInput.blur();
    
    await page.click('button:has-text("Add Card")');
    
    const nameField = page.locator('input[value="New Card"]');
    await nameField.fill('Persistent Character');
    await nameField.blur();
    
    // Wait for IndexedDB save
    await page.waitForTimeout(2000);
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify data persisted
    await expect(page.locator('text=Persistent Test Deck')).toBeVisible();
    await expect(page.locator('text=Persistent Character')).toBeVisible();
  });

  test('error handling with malformed URL data', async ({ page }) => {
    // Test with malformed deck data in URL
    await page.goto('/?deck=invalid-json-data');
    
    // Should still load without crashing
    await expect(page.locator('h1')).toBeVisible();
    
    // Should show error state or fallback to clean state
    const hasErrorMessage = await page.locator('text=Error, text=Invalid').isVisible();
    const hasCreateButton = await page.locator('button:has-text("Create Deck")').isVisible();
    
    expect(hasErrorMessage || hasCreateButton).toBeTruthy();
  });

  test('accessibility verification in complete workflow', async ({ page }) => {
    // Create complete setup
    await page.click('button:has-text("Create Deck")');
    await page.click('button:has-text("Add Card")');
    
    // Add stats with drag handles (test our ARIA fix)
    const statsButton = page.locator('button:has-text("Stats")');
    if (await statsButton.isVisible()) {
      await statsButton.click();
      
      // Add multiple stats to test drag accessibility
      const addButton = page.locator('button:has-text("Add Stat")');
      if (await addButton.isVisible()) {
        // Add Health
        await addButton.click();
        await page.locator('button:has-text("Health")').first().click();
        await page.locator('input[placeholder*="value"]').fill('100');
        await page.click('button:has-text("Add")');
        
        // Add Attack
        await addButton.click();
        await page.locator('button:has-text("Attack")').first().click();
        await page.locator('input[placeholder*="value"]').fill('75');
        await page.click('button:has-text("Add")');
      }
      
      // Verify drag handles have proper ARIA roles (our fix)
      const dragElements = page.locator('[draggable="true"]');
      if (await dragElements.count() > 0) {
        await expect(dragElements.first()).toHaveAttribute('role', 'listitem');
      }
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify focus is visible and accessible
      const focusStyles = await focusedElement.evaluate(el => getComputedStyle(el));
      expect(focusStyles.outline).not.toBe('none');
    }
  });

  test('complete sharing workflow', async ({ page }) => {
    // Create deck with rich content
    await page.click('button:has-text("Create Deck")');
    
    const deckName = page.locator('input[value*="Deck"]');
    await deckName.fill('Shared Adventure Deck');
    await deckName.blur();
    
    await page.click('button:has-text("Add Card")');
    await page.locator('input[value="New Card"]').fill('Shared Hero');
    await page.locator('input[value="Role"]').fill('Adventurer');
    
    // Test sharing
    const shareButton = page.locator('button:has-text("Share"), button:has-text("Export")').first();
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Should see URL
      const urlField = page.locator('input[value*="http"], textarea[value*="http"]').first();
      if (await urlField.isVisible()) {
        const sharedUrl = await urlField.inputValue();
        expect(sharedUrl).toContain('deck=');
        
        // Test that the URL actually contains deck data
        const urlObj = new URL(sharedUrl);
        const deckParam = urlObj.searchParams.get('deck');
        expect(deckParam).toBeTruthy();
        
        // Parse the deck data to verify it's valid JSON
        const deckData = JSON.parse(decodeURIComponent(deckParam!));
        expect(deckData.meta.name).toBe('Shared Adventure Deck');
        expect(deckData.cards[0].name).toBe('Shared Hero');
      }
    }
  });
});
