import { test, expect } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('Improved Dev Tools Helper', () => {
	let devTools: DevToolsHelper;

	test.beforeEach(async ({ page }) => {
		devTools = new DevToolsHelper(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('can setup test environment using console shortcuts', async ({ page }) => {
		console.log('=== Testing Console-based Setup ===');

		// Use the console-based setup method
		const result = await devTools.setupTestEnvironment();
		console.log('Setup result:', result);

		// Verify sample data is loaded
		const sampleInfo = devTools.getSampleDataInfo();
		await expect(page.locator('h1')).toContainText(sampleInfo.deckName);

		// Verify cards are visible
		const cards = page.locator('.card');
		const cardCount = await cards.count();
		console.log(`Found ${cardCount} cards`);
		expect(cardCount).toBeGreaterThan(0);

		// Test individual console shortcuts
		console.log('=== Testing Individual Console Functions ===');

		const clearResult = await devTools.clearDatabaseConsole();
		console.log('Clear result:', clearResult);

		// Verify database was cleared
		await expect(page.locator('h1')).toContainText('Astounding Game Cards');

		const addResult = await devTools.addSampleDataConsole();
		console.log('Add sample data result:', addResult);

		// Verify sample data was added back
		await expect(page.locator('h1')).toContainText(sampleInfo.deckName);
	});

	test('console shortcuts work without UI interaction', async ({ page }) => {
		console.log('=== Testing Console-only Workflow ===');

		// Don't open any UI dialogs, just use console
		const setupResult = await page.evaluate(async () => {
			// @ts-ignore - Using window global for E2E helpers
			return await window.e2eHelpers.setupTestEnvironment();
		});

		console.log('Console setup result:', setupResult);
		await page.waitForLoadState('networkidle');

		// Verify the setup worked
		const sampleInfo = devTools.getSampleDataInfo();
		await expect(page.locator('h1')).toContainText(sampleInfo.deckName);

		// Get sample info from console too
		const consoleInfo = await page.evaluate(() => {
			// @ts-ignore
			return window.e2eHelpers.getSampleInfo();
		});

		console.log('Console sample info:', consoleInfo);
		expect(consoleInfo.deckName).toBe(sampleInfo.deckName);
		expect(consoleInfo.cardCount).toBe(sampleInfo.cardCount);
	});

	test('can access dev tools via UI with test IDs', async ({ page }) => {
		console.log('=== Testing UI Access with Test IDs ===');

		await devTools.enableDevMode();

		// Use the new test ID to open deck manager
		const manageDecksButton = page.getByTestId('manage-decks-button');
		await expect(manageDecksButton).toBeVisible();
		await manageDecksButton.click();

		// Check for dev tools section with test ID
		const devSection = page.getByTestId('dev-tools-section');
		await expect(devSection).toBeVisible();

		// Check individual dev tool buttons
		const clearButton = page.getByTestId('clear-database-button');
		const sampleButton = page.getByTestId('add-sample-data-button');
		const toastButton = page.getByTestId('test-toast-button');

		await expect(clearButton).toBeVisible();
		await expect(sampleButton).toBeVisible();
		await expect(toastButton).toBeVisible();

		// Test the toast button (safe)
		await toastButton.click();
		const toast = page.locator('.toast').first(); // Get first toast to avoid duplication
		await expect(toast).toBeVisible();

		console.log('UI dev tools are accessible and working');
	});

	test.afterEach(async ({ page }) => {
		await devTools.disableDevMode();
	});
});
