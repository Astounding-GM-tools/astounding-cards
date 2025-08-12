import { expect, test } from '@playwright/test';

test.describe('CardMechanicsEditor Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create a new deck - click Manage Decks first to open the menu
    await page.click('button:has-text("📚 Manage Decks")');
    await page.waitForTimeout(500);
    
    // Then click Create New Deck
    await page.click('button:has-text("➕ Create New Deck")');
    await page.waitForTimeout(500);
    
    // Fill in deck name and create
    const nameInput = page.locator('input[placeholder*="deck"], input[placeholder*="name"]');
    await nameInput.fill('Test Deck');
    await page.click('button.primary:has-text("Create")');
    await page.waitForTimeout(1000);
    
    // Add a card to the deck
    await page.click('button:has-text("➕ Add Card")');
    await page.waitForTimeout(1000);
  });

  test('should open mechanics dialog and add/remove mechanics', async ({ page }) => {
    // 1. Open the mechanics dialog
    const editMechanicsButton = page.locator('.edit-mechanics-btn');
    await editMechanicsButton.click();
    await expect(page.locator('.mechanics-dialog')).toBeVisible();

    // 2. Add a new mechanic
    const addMechanicButton = page.locator('button:has-text("+ Add Mechanic")');
    await addMechanicButton.click();
    await expect(page.locator('.mechanic-item')).toHaveCount(1);
    
    // 3. Edit the new mechanic's name
    const nameInput = page.locator('input[placeholder*="Longsword"]');
    await nameInput.fill('Longsword');
    await expect(nameInput).toHaveValue('Longsword');

    // 4. Remove the mechanic
    const removeButton = page.locator('button[title="Remove"]');
    await removeButton.click();
    await expect(page.locator('.mechanic-item')).toHaveCount(0);
    
    // 5. Close the dialog
    const closeButton = page.locator('button[aria-label="Close"]');
    await closeButton.click();
    await expect(page.locator('.mechanics-dialog')).not.toBeVisible();
  });
  
  test('should edit and save mechanics correctly', async ({ page }) => {
    // 1. Open the mechanics dialog
    const editMechanicsButton = page.locator('.edit-mechanics-btn');
    await editMechanicsButton.click();

    // 2. Add a mechanic and edit it
    await page.click('button:has-text("+ Add Mechanic")');
    await page.locator('input[placeholder*="Longsword"]').fill('Broadsword');
    await page.locator('input[placeholder*="+5"]').fill('+7');
    
    // 3. Save changes
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    
    // 4. Verify dialog closed
    await expect(page.locator('.mechanics-dialog')).not.toBeVisible();
    
    // 5. Verify changes are displayed on the card
    await expect(page.locator('.mechanic-name')).toHaveText('Broadsword:');
    await expect(page.locator('.mechanic-value')).toHaveText('+7');
  });
  
  test('should reorder mechanics using move buttons', async ({ page }) => {
    // 1. Open the mechanics dialog
    const editMechanicsButton = page.locator('.edit-mechanics-btn');
    await editMechanicsButton.click();

    // 2. Add two mechanics
    await page.click('button:has-text("+ Add Mechanic")');
    await page.click('button:has-text("+ Add Mechanic")');
    
    // 3. Name them for identification
    await page.locator('input[placeholder*="Longsword"]').first().fill('First');
    await page.locator('input[placeholder*="Longsword"]').last().fill('Second');
    
    // 4. Move the first mechanic down
    const moveDownButton = page.locator('button[title="Move down"]').first();
    await moveDownButton.click();
    
    // 5. Verify the new order in the editor
    await expect(page.locator('input[placeholder*="Longsword"]').first()).toHaveValue('Second');
    await expect(page.locator('input[placeholder*="Longsword"]').last()).toHaveValue('First');
    
    // 6. Save and verify on card
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('.mechanic-name').first()).toHaveText('Second:');
    await expect(page.locator('.mechanic-name').last()).toHaveText('First:');
  });
});
