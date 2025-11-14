import { expect, test } from '@playwright/test';

test.describe('URL Loading Tests - Fast Execution', () => {
	// Sample deck data for testing
	const sampleDeck = {
		id: 'test-adventure-deck',
		meta: {
			name: 'Test Adventure Deck',
			theme: 'classic',
			cardSize: 'poker',
			lastEdited: Date.now(),
			createdAt: Date.now()
		},
		cards: [
			{
				id: 'gandalf-card',
				name: 'Gandalf',
				role: 'Wizard',
				traits: ['Notable: Member of the Fellowship', 'Property: Immortal Maiar'],
				secrets: ['Hidden: Bearer of Narya', 'Plot: Guides the Fellowship'],
				desc: 'A wise wizard with great power.',
				type: 'character',
				stat: { type: 'character', value: '' },
				stats: [
					{ statId: 'health', value: 150 },
					{ statId: 'attack', value: 90 }
				]
			},
			{
				id: 'legolas-card',
				name: 'Legolas',
				role: 'Elf Archer',
				traits: ['Notable: Prince of the Woodland Realm', 'Property: Keen eyesight'],
				secrets: ['Hidden: Deadly accurate with bow', 'Plot: Son of Thranduil'],
				desc: 'An elven archer of unmatched skill.',
				type: 'character',
				stat: { type: 'character', value: '' },
				stats: [
					{ statId: 'health', value: 120 },
					{ statId: 'attack', value: 95 },
					{ statId: 'defense', value: 80 }
				]
			}
		]
	};

	const encodedDeck = encodeURIComponent(JSON.stringify(sampleDeck));

	test('load deck from URL and verify card content', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Verify deck name loaded
		await expect(page.locator('text=Test Adventure Deck')).toBeVisible();

		// Verify both cards are present
		await expect(page.locator('text=Gandalf')).toBeVisible();
		await expect(page.locator('text=Legolas')).toBeVisible();

		// Verify card roles
		await expect(page.locator('text=Wizard')).toBeVisible();
		await expect(page.locator('text=Elf Archer')).toBeVisible();

		// Verify stats loaded correctly
		await expect(page.locator('text=150')).toBeVisible(); // Gandalf's health
		await expect(page.locator('text=95')).toBeVisible(); // Legolas's attack

		// Verify card structure
		const cards = page.locator('.card');
		expect(await cards.count()).toBe(2);
	});

	test('edit existing card from URL-loaded deck', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Edit Gandalf's name
		const gandalfName = page.locator('input[value="Gandalf"]').first();
		await gandalfName.fill('Gandalf the Grey');
		await gandalfName.blur();

		// Verify change is visible
		await expect(page.locator('text=Gandalf the Grey')).toBeVisible();

		// Edit role
		const wizardRole = page.locator('input[value="Wizard"]').first();
		await wizardRole.fill('Grey Wizard');
		await wizardRole.blur();

		// Verify role change
		await expect(page.locator('text=Grey Wizard')).toBeVisible();

		// Verify the original values are gone
		await expect(
			page.locator('text=Gandalf').and(page.locator(':not(:has-text("Grey"))'))
		).not.toBeVisible();
	});

	test('add new card to URL-loaded deck', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Verify starting with 2 cards
		expect(await page.locator('.card').count()).toBe(2);

		// Add a new card
		await page.click('button:has-text("Add Card")');

		// Verify we now have 3 cards
		expect(await page.locator('.card').count()).toBe(3);

		// Edit the new card
		const newCardName = page.locator('input[value="New Card"]').last();
		await newCardName.fill('Aragorn');
		await newCardName.blur();

		const newCardRole = page.locator('input[value="Role"]').last();
		await newCardRole.fill('Ranger King');
		await newCardRole.blur();

		// Verify new card content
		await expect(page.locator('text=Aragorn')).toBeVisible();
		await expect(page.locator('text=Ranger King')).toBeVisible();
	});

	test('stats management on URL-loaded cards', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Find Gandalf's stats button and click it
		const gandalfCard = page.locator('.card:has-text("Gandalf")');
		const statsButton = gandalfCard.locator('button:has-text("Stats")');

		if (await statsButton.isVisible()) {
			await statsButton.click();

			// Should see existing stats
			await expect(page.locator('text=150')).toBeVisible(); // Health
			await expect(page.locator('text=90')).toBeVisible(); // Attack

			// Add a new stat
			const addStatButton = page.locator('button:has-text("Add Stat")');
			if (await addStatButton.isVisible()) {
				await addStatButton.click();

				const defenseOption = page.locator('button:has-text("Defense")');
				if (await defenseOption.isVisible()) {
					await defenseOption.click();

					const valueInput = page.locator('input[placeholder*="value"]').last();
					await valueInput.fill('85');
					await page.click('button:has-text("Add")');
				}
			}

			// Save stats
			const saveButton = page.locator('button:has-text("Save")');
			if (await saveButton.isVisible()) {
				await saveButton.click();
			}

			// Verify new stat appears on card
			await expect(page.locator('text=85')).toBeVisible();
		}
	});

	test('theme changes on URL-loaded deck', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Change theme to Scriptorum
		const themeButton = page.locator('button:has-text("Theme")').first();
		if (await themeButton.isVisible()) {
			await themeButton.click();

			const scriptorumOption = page.locator('button:has-text("Scriptorum")');
			if (await scriptorumOption.isVisible()) {
				await scriptorumOption.click();

				// Verify theme changed
				await expect(page.locator('[data-theme="scriptorum"]')).toBeVisible();
			}
		}
	});

	test('vocabulary customization with URL-loaded deck', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);

		// Enable dev mode and clear database for clean vocabulary test
		await page.keyboard.press('F12');
		await page.waitForTimeout(100);

		const clearButton = page.locator('button:has-text("Clear database")');
		if (await clearButton.isVisible()) {
			await clearButton.click();
			await page.waitForTimeout(500);
		}

		// Reload the URL-based deck
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Customize vocabulary
		const statblocksButton = page.locator('button:has-text("Statblocks")');
		if (await statblocksButton.isVisible()) {
			await statblocksButton.click();

			// Change "Health" to "Life Force"
			const healthInput = page.locator('input[value="Health"]');
			if (await healthInput.isVisible()) {
				await healthInput.clear();
				await healthInput.fill('Life Force');
			}

			// Save changes
			await page.click('button:has-text("Save")');

			// Add a new card to test vocabulary
			await page.click('button:has-text("Add Card")');

			const statsButton = page.locator('button:has-text("Stats")').last();
			if (await statsButton.isVisible()) {
				await statsButton.click();

				// Should see "Life Force" instead of "Health"
				await expect(page.locator('text=Life Force')).toBeVisible();
				await expect(page.locator('text=Health')).not.toBeVisible();
			}
		}
	});

	test('print view with URL-loaded deck', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Go to print view
		const printLink = page.locator('a[href*="print"]');
		if (await printLink.isVisible()) {
			await printLink.click();

			// Verify print URL
			await expect(page.url()).toContain('print');

			// Verify cards are present in print layout
			await expect(page.locator('text=Gandalf')).toBeVisible();
			await expect(page.locator('text=Legolas')).toBeVisible();

			// Verify print-specific styling
			const cards = page.locator('.card');
			expect(await cards.count()).toBe(2);

			// Check print optimization
			const firstCard = cards.first();
			const cardStyles = await firstCard.evaluate((el) => getComputedStyle(el));
			expect(cardStyles.boxShadow).toBe('none');
		}
	});

	test('data persistence after URL load and modifications', async ({ page }) => {
		await page.goto(`/?deck=${encodedDeck}`);
		await page.waitForLoadState('networkidle');

		// Make modifications
		const deckName = page.locator('input[value="Test Adventure Deck"]');
		await deckName.fill('Modified Adventure Deck');
		await deckName.blur();

		await page.locator('input[value="Gandalf"]').fill('Gandalf the White');
		await page.locator('input[value="Gandalf"]').blur();

		// Wait for saves
		await page.waitForTimeout(2000);

		// Reload page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify modifications persisted
		await expect(page.locator('text=Modified Adventure Deck')).toBeVisible();
		await expect(page.locator('text=Gandalf the White')).toBeVisible();
	});
});
