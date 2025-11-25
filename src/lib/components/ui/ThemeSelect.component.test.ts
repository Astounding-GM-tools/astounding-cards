import { describe, it, expect } from 'vitest';

describe('ThemeSelect Component Integration', () => {
	it('should import extracted logic functions without errors', async () => {
		// This test verifies that the ThemeSelect component can import all extracted logic
		const module = await import('./ThemeSelect.svelte.ts');

		// Verify all expected exports are present and are functions
		expect(typeof module.createPreviewCard).toBe('function');

		// Test createPreviewCard functionality
		const mockTheme = {
			id: 'test-theme',
			name: 'Test Theme',
			description: 'A test theme',
			colors: { primary: '#000', secondary: '#fff' },
			typography: { fontFamily: 'Arial', fontSize: '14px' },
			decoration: { border: 'none' },
			preview: {
				title: 'Preview Title',
				role: 'Preview Role',
				traits: ['trait1', 'trait2'],
				portrait: 'test-portrait.jpg'
			}
		} as any;

		const card = module.createPreviewCard(mockTheme);

		expect(card.id).toBe('preview');
		expect(card.name).toBe('Preview Title');
		expect(card.role).toBe('Preview Role');
		expect(card.traits).toEqual(['trait1', 'trait2']);
		expect(card.image).toBe('/portraits/test-portrait.jpg');
		expect(card.type).toBe('Preview');
	});

	it('should handle theme with no preview data', async () => {
		const module = await import('./ThemeSelect.svelte.ts');

		const mockTheme = {
			id: 'minimal-theme',
			name: 'Minimal Theme',
			description: 'A minimal theme',
			colors: { primary: '#000', secondary: '#fff' },
			typography: { fontFamily: 'Arial', fontSize: '14px' },
			decoration: { border: 'none' }
		} as any;

		const card = module.createPreviewCard(mockTheme);

		expect(card.name).toBe('Minimal Theme');
		expect(card.role).toBe('A minimal theme');
		expect(card.traits).toEqual([]);
		expect(card.image).toBe(null);
	});
});
