import { expect, test } from '@playwright/test';

test('home page loads successfully', async ({ page }) => {
	// Listen for console messages and errors to debug
	page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
	page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

	// Try to navigate to the page
	try {
		await page.goto('/', { waitUntil: 'load', timeout: 15000 });
		console.log('Navigation successful');

		// Get page title to verify it loaded
		const title = await page.title();
		console.log('Page title:', title);

		// Check if there's any h1 element
		const h1Count = await page.locator('h1').count();
		console.log('H1 elements found:', h1Count);

		if (h1Count > 0) {
			await expect(page.locator('h1').first()).toBeVisible();
		} else {
			// If no h1, let's see what's actually on the page
			const bodyText = await page.locator('body').textContent();
			console.log('Body content:', bodyText?.substring(0, 200));
			throw new Error('No h1 elements found on the page');
		}
	} catch (error) {
		console.log('Test error:', error);
		throw error;
	}
});
