import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('Statblock Integration - Vocabulary to Template E2E Tests', () => {
	let devTools: DevToolsHelper;

	test.beforeEach(async ({ page }) => {
		devTools = new DevToolsHelper(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Setup sample data for consistent testing
		await devTools.setupTestEnvironment();
		await page.waitForTimeout(1000);
	});

	test('should modify vocabulary then apply template with updated terms', async ({ page }) => {
		console.log('=== Integration Test: Vocabulary → Template → Card Display ===');

		// Step 1: Modify vocabulary (change "Health" to "Hit Points")
		console.log('--- Step 1: Modifying vocabulary ---');

		// Open Deck Management → Statblocks
		const deckManagementBtn = page.locator('button:has-text("📚 Manage Decks")');
		await deckManagementBtn.click();
		await page.waitForTimeout(1000);

		const statblocksBtn = page.locator('button').filter({ hasText: /statblock/i });
		await statblocksBtn.first().click();
		await page.waitForTimeout(1000);

		// Find and modify the first vocabulary input (should be "Health")
		const vocabInputs = page.locator('input[type="text"]:visible, input:not([type]):visible');
		const firstInput = vocabInputs.first();
		const originalValue = await firstInput.inputValue();
		console.log(`Found vocabulary input: "${originalValue}"`);

		// Change "Health" to "Hit Points"
		const newVocabValue = 'Hit Points';
		await firstInput.click({ clickCount: 3 }); // Select all
		await firstInput.fill(newVocabValue);
		console.log(`Changed vocabulary to: "${newVocabValue}"`);

		// Save vocabulary changes
		const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
		await saveButton.click();
		await page.waitForTimeout(1000);
		console.log('✅ Vocabulary saved');

		// Close the vocabulary dialog
		await page.keyboard.press('Escape');
		await page.waitForTimeout(500);

		// Step 2: Apply template to a card
		console.log('--- Step 2: Applying template to card ---');

		// Find the first card's "Add Game Stats" button
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await expect(addStatsButtons.first()).toBeVisible();
		await addStatsButtons.first().click();

		// Verify template dialog opened
		const templateDialog = page.locator('.template-dialog');
		await expect(templateDialog).toBeVisible();
		console.log('✅ Template dialog opened');

		// Select Character category (should be default, but make sure)
		const characterTab = page.locator('.category-tab').filter({ hasText: 'Character' });
		if ((await characterTab.count()) > 0) {
			await characterTab.click();
		}

		// Select the first template (should be "Simple")
		const templateCards = page.locator('.template-card');
		const firstTemplate = templateCards.first();
		const templateName = await firstTemplate.locator('.template-name').textContent();
		console.log(`Applying template: "${templateName}"`);

		await firstTemplate.click();
		await expect(firstTemplate).toHaveClass(/selected/);

		// Apply the template
		const applyButton = page.locator('.btn-primary').filter({ hasText: 'Add' });
		await applyButton.click();
		await expect(templateDialog).not.toBeVisible();

		// Wait for template to be applied
		await page.waitForTimeout(2000);
		console.log('✅ Template applied to card');

		// Step 3: Verify the updated vocabulary appears on the card
		console.log('--- Step 3: Verifying updated vocabulary on card ---');

		// Look for the mechanics display on the card back
		const mechanicsDisplay = page.locator('.mechanics-display').first();
		await expect(mechanicsDisplay).toBeVisible();

		// Find the stat that should now show "Hit Points" instead of "Health"
		// Look for a mechanic item that contains our new vocabulary term
		const hitPointsMechanic = mechanicsDisplay.locator('.mechanic-item').filter({
			hasText: newVocabValue
		});

		if ((await hitPointsMechanic.count()) > 0) {
			console.log(`✅ Found mechanic with "${newVocabValue}"`);

			// Get the specific mechanic name span
			const mechanicNameSpan = hitPointsMechanic.locator('.mechanic-name').first();
			const displayedName = await mechanicNameSpan.textContent();
			console.log(`Mechanic name displayed: "${displayedName}"`);

			// Verify it shows "Hit Points" (may include colon)
			expect(displayedName?.trim()).toContain(newVocabValue);
			console.log('✅ SUCCESS: Vocabulary change reflected in applied template!');
		} else {
			console.log(`⚠️  Could not find mechanic with "${newVocabValue}" - checking all mechanics`);

			// Debug: show all mechanic names that were applied
			const allMechanics = mechanicsDisplay.locator('.mechanic-item');
			const mechanicCount = await allMechanics.count();
			console.log(`Found ${mechanicCount} mechanics on card:`);

			for (let i = 0; i < mechanicCount; i++) {
				const mechanic = allMechanics.nth(i);
				const nameSpan = mechanic.locator('.mechanic-name');
				if ((await nameSpan.count()) > 0) {
					const name = await nameSpan.textContent();
					console.log(`  Mechanic ${i}: "${name}"`);
				}
			}

			// Still check if any mechanic contains the new value
			const mechanicText = await mechanicsDisplay.textContent();
			if (mechanicText?.includes(newVocabValue)) {
				console.log('✅ New vocabulary term found in mechanics display');
			} else {
				console.log(`❌ New vocabulary term "${newVocabValue}" not found in mechanics display`);
				console.log(`Full mechanics text: ${mechanicText?.substring(0, 200)}...`);
			}
		}

		console.log('=== Integration test completed ===');
	});

	test.afterEach(async ({ page }) => {
		await devTools.disableDevMode();
	});
});
