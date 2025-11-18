import { test, expect } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('Preview Mode', () => {
	let devTools: DevToolsHelper;

	test.beforeEach(async ({ page }) => {
		devTools = new DevToolsHelper(page);
		await page.goto('/');
	});

	test('should show preview without auto-importing', async ({ page, context }) => {
		// Setup: Create a sample deck and get share URL
		await devTools.setupTestEnvironment();

		// Wait for deck to load
		await page.waitForSelector('[data-testid="deck-view"]', { timeout: 5000 });

		// Click share button to get URL
		await page.click('[data-testid="header-share-button"]');
		await page.waitForSelector('[data-testid="share-url-input"]');

		const shareUrlInput = page.locator('[data-testid="share-url-input"]');
		const shareUrl = await shareUrlInput.inputValue();

		expect(shareUrl).toContain('#data=');

		// Close share dialog
		await page.keyboard.press('Escape');

		// Open share URL in new incognito context to ensure clean state
		const incognitoContext = await context.browser()?.newContext();
		if (!incognitoContext) throw new Error('Failed to create incognito context');

		const newPage = await incognitoContext.newPage();
		await newPage.goto(shareUrl);

		// Should see preview mode, not auto-import
		await expect(newPage.locator('h1')).toContainText('Welcome to Astounding Cards!');
		await expect(newPage.locator('text=Import to Library')).toBeVisible();
		await expect(newPage.locator('text=Cancel')).toBeVisible();

		// Should see card grid
		const cardWrappers = newPage.locator('.card-wrapper');
		await expect(cardWrappers.first()).toBeVisible();

		// Cards should have Front/Back toggle buttons
		await expect(newPage.locator('button:has-text("Front")').first()).toBeVisible();
		await expect(newPage.locator('button:has-text("Back")').first()).toBeVisible();

		// Verify no database write yet (deck count should be 0)
		const dbInfo = await newPage.evaluate(() => {
			return (window as any).nextDevTools?.getDatabaseInfo();
		});
		expect(dbInfo?.deckCount).toBe(0);

		await incognitoContext.close();
	});

	test('should import deck when clicking Import button', async ({ page, context }) => {
		// Setup: Create share URL
		await devTools.setupTestEnvironment();
		await page.waitForSelector('[data-testid="deck-view"]', { timeout: 5000 });

		await page.click('[data-testid="header-share-button"]');
		await page.waitForSelector('[data-testid="share-url-input"]');

		const shareUrl = await page.locator('[data-testid="share-url-input"]').inputValue();
		await page.keyboard.press('Escape');

		// Open in new context
		const incognitoContext = await context.browser()?.newContext();
		if (!incognitoContext) throw new Error('Failed to create incognito context');

		const newPage = await incognitoContext.newPage();
		await newPage.goto(shareUrl);

		// Wait for preview to load
		await expect(newPage.locator('text=Import to Library')).toBeVisible();

		// Click Import button
		await newPage.click('button:has-text("Import to Library")');

		// Should see success toast
		await expect(newPage.locator('text=imported to your library')).toBeVisible({ timeout: 5000 });

		// Should redirect to root
		await expect(newPage).toHaveURL(/\//);

		// Verify deck was imported to database
		const dbInfo = await newPage.evaluate(() => {
			return (window as any).nextDevTools?.getDatabaseInfo();
		});
		expect(dbInfo?.deckCount).toBe(1);
		expect(dbInfo?.totalCards).toBeGreaterThan(0);

		await incognitoContext.close();
	});

	test('should cancel preview and go to app', async ({ page, context }) => {
		// Setup
		await devTools.setupTestEnvironment();
		await page.waitForSelector('[data-testid="deck-view"]', { timeout: 5000 });

		await page.click('[data-testid="header-share-button"]');
		await page.waitForSelector('[data-testid="share-url-input"]');

		const shareUrl = await page.locator('[data-testid="share-url-input"]').inputValue();
		await page.keyboard.press('Escape');

		// Open in new context
		const incognitoContext = await context.browser()?.newContext();
		if (!incognitoContext) throw new Error('Failed to create incognito context');

		const newPage = await incognitoContext.newPage();
		await newPage.goto(shareUrl);

		await expect(newPage.locator('text=Cancel')).toBeVisible();

		// Click Cancel
		await newPage.click('button:has-text("Cancel")');

		// Should navigate to root
		await expect(newPage).toHaveURL(/\//);

		// Database should still be empty
		const dbInfo = await newPage.evaluate(() => {
			return (window as any).nextDevTools?.getDatabaseInfo();
		});
		expect(dbInfo?.deckCount).toBe(0);

		await incognitoContext.close();
	});

	test('should toggle card front/back in preview', async ({ page, context }) => {
		// Setup
		await devTools.setupTestEnvironment();
		await page.waitForSelector('[data-testid="deck-view"]', { timeout: 5000 });

		await page.click('[data-testid="header-share-button"]');
		await page.waitForSelector('[data-testid="share-url-input"]');

		const shareUrl = await page.locator('[data-testid="share-url-input"]').inputValue();
		await page.keyboard.press('Escape');

		// Open in new context
		const incognitoContext = await context.browser()?.newContext();
		if (!incognitoContext) throw new Error('Failed to create incognito context');

		const newPage = await incognitoContext.newPage();
		await newPage.goto(shareUrl);

		await expect(newPage.locator('.card-wrapper').first()).toBeVisible();

		// Front button should be active by default
		const firstCardFrontBtn = newPage
			.locator('.card-wrapper')
			.first()
			.locator('button:has-text("Front")');
		const firstCardBackBtn = newPage
			.locator('.card-wrapper')
			.first()
			.locator('button:has-text("Back")');

		await expect(firstCardFrontBtn).toHaveClass(/active/);
		await expect(firstCardBackBtn).not.toHaveClass(/active/);

		// Click Back button
		await firstCardBackBtn.click();

		// Back should now be active
		await expect(firstCardBackBtn).toHaveClass(/active/);
		await expect(firstCardFrontBtn).not.toHaveClass(/active/);

		// Click Front button again
		await firstCardFrontBtn.click();

		// Front should be active again
		await expect(firstCardFrontBtn).toHaveClass(/active/);
		await expect(firstCardBackBtn).not.toHaveClass(/active/);

		await incognitoContext.close();
	});
});
