import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('StatblockTemplateDialog - Comprehensive E2E Tests', () => {
	let devTools: DevToolsHelper;

	test.beforeEach(async ({ page }) => {
		devTools = new DevToolsHelper(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Setup sample data for consistent testing
		await devTools.setupTestEnvironment();
		await page.waitForTimeout(1000);
	});

	test('should open StatblockTemplateDialog with all UI elements', async ({ page }) => {
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
			const dialogExists = (await templateDialog.count()) > 0;
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

	test('should display and select character templates', async ({ page }) => {
		console.log('=== Testing Character Template Selection ===');

		// Open dialog
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await addStatsButtons.first().click();

		// Verify dialog opened
		const templateDialog = page.locator('.template-dialog');
		await expect(templateDialog).toBeVisible();

		// Select Character category
		const characterTab = page.locator('.category-tab').filter({ hasText: 'Character' });
		await characterTab.click();
		await expect(characterTab).toHaveClass(/active/);

		// Check for character templates
		const templateCards = page.locator('.template-card');
		const templateCount = await templateCards.count();
		expect(templateCount).toBeGreaterThan(0);
		console.log(`Found ${templateCount} character templates`);

		// Test template selection
		const firstTemplate = templateCards.first();
		const templateName = await firstTemplate.locator('.template-name').textContent();
		console.log(`Testing template: ${templateName}`);

		await firstTemplate.click();
		await expect(firstTemplate).toHaveClass(/selected/);

		// Verify preview appears
		const preview = page.locator('.template-preview');
		await expect(preview).toBeVisible();
		await expect(preview.locator('h3')).toContainText(templateName || '');

		// Check stats in preview
		const previewStats = page.locator('.preview-stat');
		const statCount = await previewStats.count();
		expect(statCount).toBeGreaterThan(0);
		console.log(`Template has ${statCount} stats`);

		// Verify apply button is enabled and shows stat count
		const applyButton = page.locator('.btn-primary').filter({ hasText: 'Add' });
		await expect(applyButton).toBeVisible();
		await expect(applyButton).not.toBeDisabled();
		await expect(applyButton).toContainText('Stats');

		console.log('✅ Character template selection working correctly');

		// Close dialog using Escape key
		await page.keyboard.press('Escape');
	});

	test('should display and select item templates', async ({ page }) => {
		console.log('=== Testing Item Template Selection ===');

		// Open dialog
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await addStatsButtons.first().click();

		// Select Item category
		const itemTab = page.locator('.category-tab').filter({ hasText: 'Item' });
		await itemTab.click();
		await expect(itemTab).toHaveClass(/active/);

		// Check for item templates
		const templateCards = page.locator('.template-card');
		const templateCount = await templateCards.count();
		expect(templateCount).toBeGreaterThan(0);
		console.log(`Found ${templateCount} item templates`);

		// Test different templates
		for (let i = 0; i < Math.min(templateCount, 3); i++) {
			const template = templateCards.nth(i);
			const templateName = await template.locator('.template-name').textContent();
			console.log(`Testing item template: ${templateName}`);

			await template.click();
			await expect(template).toHaveClass(/selected/);

			// Verify preview updates
			const preview = page.locator('.template-preview');
			await expect(preview).toBeVisible();
			await expect(preview.locator('h3')).toContainText(templateName || '');
		}

		console.log('✅ Item template selection working correctly');

		// Close dialog using Escape key
		await page.keyboard.press('Escape');
	});

	test('should handle ability templates', async ({ page }) => {
		console.log('=== Testing Ability Template Category ===');

		// Open dialog
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await addStatsButtons.first().click();

		// Select Ability category
		const abilityTab = page.locator('.category-tab').filter({ hasText: 'Ability' });
		await abilityTab.click();
		await expect(abilityTab).toHaveClass(/active/);

		// Check for ability templates (might be empty)
		const templateCards = page.locator('.template-card');
		const templateCount = await templateCards.count();
		console.log(`Found ${templateCount} ability templates`);

		if (templateCount > 0) {
			// Test template selection if templates exist
			const firstTemplate = templateCards.first();
			const templateName = await firstTemplate.locator('.template-name').textContent();
			console.log(`Testing ability template: ${templateName}`);

			await firstTemplate.click();
			await expect(firstTemplate).toHaveClass(/selected/);

			// Verify preview
			const preview = page.locator('.template-preview');
			await expect(preview).toBeVisible();
		} else {
			// Should show empty state
			const emptyCategory = page.locator('.empty-category');
			if (await emptyCategory.isVisible()) {
				await expect(emptyCategory).toContainText('No templates available');
				console.log('✅ Empty ability category handled correctly');
			}
		}

		// Close dialog using Escape key
		await page.keyboard.press('Escape');
	});

	test('should handle custom template creation', async ({ page }) => {
		console.log('=== Testing Custom Template Option ===');

		// Open dialog
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await addStatsButtons.first().click();

		// Select Custom category
		const customTab = page.locator('.category-tab').filter({ hasText: 'Custom' });
		await customTab.click();
		await expect(customTab).toHaveClass(/active/);

		// Should show custom option
		const customCard = page.locator('.custom-card');
		await expect(customCard).toBeVisible();
		await expect(customCard).toContainText('Start from Scratch');
		await expect(customCard).toContainText('Create custom stats manually');

		// Click custom option
		await customCard.click();

		// Should show some action button - let's find any button that's enabled
		const actionButtons = page.locator('button:not(.category-tab):not([disabled]):visible');
		const enabledButtonCount = await actionButtons.count();
		console.log(`Found ${enabledButtonCount} enabled action buttons after selecting custom option`);

		// There should be at least one enabled action button (either Apply/Create/Start)
		expect(enabledButtonCount).toBeGreaterThan(0);

		// Check if we can find a likely action button text
		let foundActionButton = false;
		for (let i = 0; i < enabledButtonCount; i++) {
			const button = actionButtons.nth(i);
			const buttonText = await button.textContent();
			console.log(`Action button ${i}: "${buttonText}"`);

			if (buttonText && /(Create|Start|Apply|Add)/i.test(buttonText)) {
				foundActionButton = true;
				console.log(`✅ Found action button: "${buttonText}"`);
				break;
			}
		}

		expect(foundActionButton).toBe(true);

		console.log('✅ Custom template option working correctly');

		// Close dialog using Escape key
		await page.keyboard.press('Escape');
	});

	test('should apply template and add stats to card', async ({ page }) => {
		console.log('=== Testing Template Application ===');

		// Find a card that doesn't have stats yet
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await expect(addStatsButtons.first()).toBeVisible();

		// Click to open dialog
		await addStatsButtons.first().click();

		// Select Character category
		await page.locator('.category-tab').filter({ hasText: 'Character' }).click();

		// Select first template
		const templates = page.locator('.template-card');
		if ((await templates.count()) > 0) {
			const firstTemplate = templates.first();
			const templateName = await firstTemplate.locator('.template-name').textContent();
			console.log(`Applying template: ${templateName}`);

			await firstTemplate.click();

			// Apply the template
			const applyButton = page
				.locator('.btn-primary')
				.filter({ hasText: 'Add' })
				.and(page.locator(':has-text("Stats")'));
			await applyButton.click();

			// Dialog should close
			const templateDialog = page.locator('.template-dialog');
			await expect(templateDialog).not.toBeVisible();

			// Wait for stats to be applied
			await page.waitForTimeout(2000);

			// Verify stats were added - the button should change to show mechanics
			const mechanicsDisplay = page.locator('.mechanics-display').first();
			await expect(mechanicsDisplay).toBeVisible();

			// Should show Game Stats title
			await expect(page.locator('text=Game Stats').first()).toBeVisible();

			// Should show individual stat items
			const statItems = page.locator('.mechanic-item');
			const statCount = await statItems.count();
			expect(statCount).toBeGreaterThan(0);
			console.log(`✅ Template applied successfully - ${statCount} stats added`);

			// Should show edit button instead of add button
			const editButton = page.locator('.edit-mechanics-btn');
			await expect(editButton.first()).toBeVisible();

			console.log('✅ Stats application and UI update working correctly');
		}
	});

	test('should handle dialog keyboard navigation', async ({ page }) => {
		console.log('=== Testing Keyboard Navigation ===');

		// Open dialog
		const addStatsButtons = page.locator('button:has-text("+ Add Game Stats")');
		await addStatsButtons.first().click();

		const templateDialog = page.locator('.template-dialog');
		await expect(templateDialog).toBeVisible();

		// Test Escape key closes dialog
		await page.keyboard.press('Escape');
		await expect(templateDialog).not.toBeVisible();

		console.log('✅ Escape key closes dialog correctly');
	});

	test.afterEach(async ({ page }) => {
		await devTools.disableDevMode();
	});
});
