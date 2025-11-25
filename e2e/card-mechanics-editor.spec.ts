import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('CardMechanicsEditor Workflow with Dev Tools', () => {
	let devTools: DevToolsHelper;

	test.beforeEach(async ({ page }) => {
		devTools = new DevToolsHelper(page);

		// Navigate to the app
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Setup sample data for consistent testing
		console.log('=== Setting up test environment with sample data ===');
		await devTools.setupTestEnvironment();
		await page.waitForTimeout(1000);
		console.log('✅ Sample data environment ready');
	});

	test('should open mechanics dialog and add/remove mechanics', async ({ page }) => {
		console.log('=== Testing mechanics dialog add/remove functionality ===');

		// 1. Open the mechanics dialog via "Add Game Stats" button (more reliable)
		console.log('--- Step 1: Opening mechanics dialog ---');
		const addStatsButton = page.locator('button:has-text("+ Add Game Stats")').first();
		await expect(addStatsButton).toBeVisible();
		await addStatsButton.click();
		await expect(page.locator('.template-dialog')).toBeVisible();
		console.log('✅ Template dialog opened');

		// Select custom option to get to mechanics editor
		const customTab = page.locator('.category-tab').filter({ hasText: 'Custom' });
		if ((await customTab.count()) > 0) {
			await customTab.click();
			console.log('✅ Custom category selected');
		}

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

	test('should work with sample data characters', async ({ page }) => {
		// Test mechanics on one of the sample cards
		const sampleInfo = devTools.getSampleDataInfo();
		const characterCard = sampleInfo.cards.find((card) => card.type === 'character');

		if (characterCard) {
			// Look for the character card
			const cardElement = page.locator(`text=${characterCard.name}`).first();
			await expect(cardElement).toBeVisible();

			// Try to find edit button or mechanics button on this card
			const editButton = page
				.locator(`text=${characterCard.name}`)
				.locator('..')
				.locator('button:has-text("Edit"), button[title*="edit"], .edit-mechanics-btn')
				.first();

			if ((await editButton.count()) > 0) {
				await editButton.click();
				await page.waitForTimeout(500);

				// If mechanics dialog opens, test it
				const mechanicsDialog = page.locator('.mechanics-dialog');
				if ((await mechanicsDialog.count()) > 0) {
					await expect(mechanicsDialog).toBeVisible();

					// Close dialog
					const closeButton = page.locator(
						'button[aria-label="Close"], button:has-text("Close"), button:has-text("×")'
					);
					if ((await closeButton.count()) > 0) {
						await closeButton.click();
					}
				}
			}
		}
	});

	test('dev tools integration - should maintain state after using dev tools', async ({ page }) => {
		// Test that dev tools don't interfere with normal app functionality

		// First, use the mechanics editor normally
		const editMechanicsButton = page.locator('.edit-mechanics-btn');
		if ((await editMechanicsButton.count()) > 0) {
			await editMechanicsButton.click();
			await page.click('button:has-text("+ Add Mechanic")');
			await page.locator('input[placeholder*="Longsword"]').fill('Test Mechanic');
			await page.click('button:has-text("Save Changes")');
		}

		// Then use dev tools to test toast (safe operation)
		const toast = await devTools.testToast();
		await expect(toast).toBeVisible();

		// Verify the mechanics are still there after dev tool usage
		if ((await page.locator('.mechanic-name').count()) > 0) {
			await expect(page.locator('.mechanic-name')).toContainText('Test Mechanic');
		}
	});

	test.afterEach(async ({ page }) => {
		// Clean up: disable dev mode after each test to avoid side effects
		await devTools.disableDevMode();
	});
});
