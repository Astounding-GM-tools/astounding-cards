import { expect, test } from '@playwright/test';

test('test basic setup flow', async ({ page }) => {
	// Navigate to the app
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	console.log('Step 1: Page loaded');

	// Create a new deck - click Manage Decks first to open the menu
	await page.click('button:has-text("📚 Manage Decks")');
	console.log('Step 2: Clicked Manage Decks');

	// Wait a moment for menu to appear
	await page.waitForTimeout(1000);

	// Then click Create New Deck
	const createButton = page.locator('button:has-text("➕ Create New Deck")');
	await expect(createButton).toBeVisible();
	await createButton.click();
	console.log('Step 3: Clicked Create New Deck');

	// Wait for dialog to appear - the Create button might be disabled until we enter a name
	await page.waitForTimeout(500);

	// Look for deck name input and fill it
	const nameInput = page.locator('input[placeholder*="deck"], input[placeholder*="name"]');
	const nameInputCount = await nameInput.count();
	if (nameInputCount > 0) {
		await nameInput.fill('Test Deck');
		console.log('Step 3b: Filled deck name');
	}

	// Now click the Create button (not the "Create New Deck" button)
	const confirmCreateButton = page.locator('button.primary:has-text("Create")');
	await expect(confirmCreateButton).toBeVisible();
	await expect(confirmCreateButton).not.toBeDisabled();
	await confirmCreateButton.click();
	console.log('Step 3c: Clicked Create to confirm deck creation');

	// Wait for deck to be created
	await page.waitForTimeout(2000);

	// Debug: see what buttons are available after deck creation
	const buttonsAfterDeck = await page.locator('button').all();
	console.log(`Found ${buttonsAfterDeck.length} buttons after deck creation`);

	for (const button of buttonsAfterDeck) {
		const text = await button.textContent();
		const isVisible = await button.isVisible();
		console.log(`Button: "${text}" - Visible: ${isVisible}`);
	}

	// Try different variations of "Add Card" button
	const addCardVariations = [
		'button:has-text("Add Card")',
		'button:has-text("+ Add Card")',
		'button:has-text("➕ Add Card")',
		'button[title*="Add"]',
		'.add-card',
		'.add-button'
	];

	for (const selector of addCardVariations) {
		const count = await page.locator(selector).count();
		if (count > 0) {
			const isVisible = await page.locator(selector).first().isVisible();
			console.log(`Found ${count} elements for selector "${selector}", visible: ${isVisible}`);
		}
	}

	// Wait for card to be added
	await page.waitForTimeout(1000);

	// Take a screenshot to see what we have
	await page.screenshot({ path: 'after-setup.png' });

	// Look for elements that might be related to mechanics editing
	const buttons = await page.locator('button').all();
	console.log(`Found ${buttons.length} buttons after setup`);

	for (const button of buttons) {
		const text = await button.textContent();
		const isVisible = await button.isVisible();
		if (
			text &&
			(text.toLowerCase().includes('mechanic') ||
				text.toLowerCase().includes('stat') ||
				text.includes('✎'))
		) {
			console.log(`Relevant button: "${text}" - Visible: ${isVisible}`);
		}
	}
});
