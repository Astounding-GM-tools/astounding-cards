import { describe, it, expect } from 'vitest';
import {
	resolveCardTheme,
	hasImageDataChanged,
	createBackgroundImageValue,
	createImageUpdateParams,
	validateCardName,
	validateCardRole,
	hasContentChanged,
	getImageButtonText,
	getImageButtonTitle,
	shouldShowTopRightFlourish,
	initializeImageState,
	updateImageState,
	type ImageState
} from './CardFront.svelte.ts';
import type { Card } from '$lib/types';

// Helper to create a basic card
function createBasicCard(overrides: Partial<Card> = {}): Card {
	return {
		id: 'test-card',
		name: 'Test Card',
		role: 'Test Role',
		image: null,
		traits: [],
		secrets: [],
		desc: 'Test description',
		type: 'character',
		stats: [],
		mechanics: [],
		...overrides
	};
}

describe('CardFront Logic', () => {
	describe('resolveCardTheme', () => {
		it('prioritizes card theme over all others', () => {
			const result = resolveCardTheme('card-theme', 'prop-theme', 'deck-theme');
			expect(result).toBe('card-theme');
		});

		it('falls back to prop theme when card theme is undefined', () => {
			const result = resolveCardTheme(undefined, 'prop-theme', 'deck-theme');
			expect(result).toBe('prop-theme');
		});

		it('falls back to deck theme when card and prop themes are undefined', () => {
			const result = resolveCardTheme(undefined, undefined, 'deck-theme');
			expect(result).toBe('deck-theme');
		});

		it('uses fallback theme when all others are undefined', () => {
			const result = resolveCardTheme(undefined, undefined, undefined);
			expect(result).toBe('classic');
		});

		it('accepts custom fallback theme', () => {
			const result = resolveCardTheme(undefined, undefined, undefined, 'custom-fallback');
			expect(result).toBe('custom-fallback');
		});
	});

	describe('hasImageDataChanged', () => {
		it('detects blob change', () => {
			const card = createBasicCard({
				imageBlob: new Blob(['new'], { type: 'image/png' }),
				image: 'same-url'
			});

			const oldBlob = new Blob(['old'], { type: 'image/png' });
			const result = hasImageDataChanged(card, oldBlob, 'same-url');
			expect(result).toBe(true);
		});

		it('detects image URL change', () => {
			const card = createBasicCard({
				image: 'new-url'
			});

			const result = hasImageDataChanged(card, null, 'old-url');
			expect(result).toBe(true);
		});

		it('returns false when nothing has changed', () => {
			const card = createBasicCard({
				imageBlob: undefined,
				image: 'same-url'
			});

			const result = hasImageDataChanged(card, null, 'same-url');
			expect(result).toBe(false);
		});

		it('handles undefined values correctly', () => {
			const card = createBasicCard({
				imageBlob: undefined as any,
				image: undefined
			});

			const result = hasImageDataChanged(card, null, null);
			expect(result).toBe(false); // undefined and null should be treated as equivalent for "no value"
		});
	});

	describe('createBackgroundImageValue', () => {
		it('creates CSS url value for valid URL', () => {
			const result = createBackgroundImageValue('https://example.com/image.jpg');
			expect(result).toBe("url('https://example.com/image.jpg')");
		});

		it('returns none for null URL', () => {
			const result = createBackgroundImageValue(null);
			expect(result).toBe('none');
		});

		it('handles blob URLs', () => {
			const blobUrl = 'blob:http://localhost:3000/123-456-789';
			const result = createBackgroundImageValue(blobUrl);
			expect(result).toBe(`url('${blobUrl}')`);
		});
	});

	describe('createImageUpdateParams', () => {
		it('creates blob parameters when blob is provided', () => {
			const blob = new Blob(['test'], { type: 'image/png' });
			const result = createImageUpdateParams(blob, 'https://example.com');

			expect(result).toEqual({
				imageBlob: blob,
				image: null
			});
		});

		it('creates URL parameters when sourceUrl is provided and no blob', () => {
			const result = createImageUpdateParams(null, 'https://example.com/image.jpg');

			expect(result).toEqual({
				image: 'https://example.com/image.jpg',
				imageBlob: undefined
			});
		});

		it('clears both when neither blob nor sourceUrl provided', () => {
			const result = createImageUpdateParams(null, undefined);

			expect(result).toEqual({
				image: null,
				imageBlob: undefined
			});
		});

		it('prioritizes blob when both blob and sourceUrl provided', () => {
			const blob = new Blob(['test'], { type: 'image/png' });
			const result = createImageUpdateParams(blob, 'https://example.com/image.jpg');

			expect(result).toEqual({
				imageBlob: blob,
				image: null
			});
		});
	});

	describe('validateCardName', () => {
		it('validates correct card name', () => {
			const result = validateCardName('Valid Name');

			expect(result).toEqual({
				isValid: true,
				trimmedName: 'Valid Name'
			});
		});

		it('trims whitespace', () => {
			const result = validateCardName('  Valid Name  ');

			expect(result).toEqual({
				isValid: true,
				trimmedName: 'Valid Name'
			});
		});

		it('rejects empty name', () => {
			const result = validateCardName('');

			expect(result).toEqual({
				isValid: false,
				trimmedName: '',
				error: 'Card name cannot be empty'
			});
		});

		it('rejects whitespace-only name', () => {
			const result = validateCardName('   ');

			expect(result).toEqual({
				isValid: false,
				trimmedName: '',
				error: 'Card name cannot be empty'
			});
		});

		it('rejects name too long', () => {
			const longName = 'a'.repeat(101);
			const result = validateCardName(longName);

			expect(result).toEqual({
				isValid: false,
				trimmedName: longName,
				error: 'Card name cannot exceed 100 characters'
			});
		});

		it('accepts name at maximum length', () => {
			const maxName = 'a'.repeat(100);
			const result = validateCardName(maxName);

			expect(result).toEqual({
				isValid: true,
				trimmedName: maxName
			});
		});
	});

	describe('validateCardRole', () => {
		it('validates correct card role', () => {
			const result = validateCardRole('Valid Role');

			expect(result).toEqual({
				isValid: true,
				trimmedRole: 'Valid Role'
			});
		});

		it('trims whitespace', () => {
			const result = validateCardRole('  Valid Role  ');

			expect(result).toEqual({
				isValid: true,
				trimmedRole: 'Valid Role'
			});
		});

		it('accepts empty role', () => {
			const result = validateCardRole('');

			expect(result).toEqual({
				isValid: true,
				trimmedRole: ''
			});
		});

		it('rejects role too long', () => {
			const longRole = 'a'.repeat(51);
			const result = validateCardRole(longRole);

			expect(result).toEqual({
				isValid: false,
				trimmedRole: longRole,
				error: 'Card role cannot exceed 50 characters'
			});
		});

		it('accepts role at maximum length', () => {
			const maxRole = 'a'.repeat(50);
			const result = validateCardRole(maxRole);

			expect(result).toEqual({
				isValid: true,
				trimmedRole: maxRole
			});
		});
	});

	describe('hasContentChanged', () => {
		it('returns true when content differs', () => {
			const result = hasContentChanged('original', 'changed');
			expect(result).toBe(true);
		});

		it('returns false when content is same', () => {
			const result = hasContentChanged('same', 'same');
			expect(result).toBe(false);
		});

		it('handles empty strings', () => {
			const result1 = hasContentChanged('', 'something');
			const result2 = hasContentChanged('something', '');
			const result3 = hasContentChanged('', '');

			expect(result1).toBe(true);
			expect(result2).toBe(true);
			expect(result3).toBe(false);
		});
	});

	describe('getImageButtonText', () => {
		it('shows updating text when updating', () => {
			const result1 = getImageButtonText(true, true);
			const result2 = getImageButtonText(false, true);

			expect(result1).toBe('Updating...');
			expect(result2).toBe('Updating...');
		});

		it('shows change text when has image and not updating', () => {
			const result = getImageButtonText(true, false);
			expect(result).toBe('Change image');
		});

		it('shows add text when no image and not updating', () => {
			const result = getImageButtonText(false, false);
			expect(result).toBe('Add image');
		});
	});

	describe('getImageButtonTitle', () => {
		it('shows change title when has image', () => {
			const result = getImageButtonTitle(true);
			expect(result).toBe('Change image');
		});

		it('shows add title when no image', () => {
			const result = getImageButtonTitle(false);
			expect(result).toBe('Add image');
		});
	});

	describe('shouldShowTopRightFlourish', () => {
		it('returns true when card has no stat', () => {
			const card = createBasicCard({ stat: undefined });
			const result = shouldShowTopRightFlourish(card);
			expect(result).toBe(true);
		});

		it('returns false when card has stat', () => {
			const card = createBasicCard({ stat: 'some-stat' as any });
			const result = shouldShowTopRightFlourish(card);
			expect(result).toBe(false);
		});

		it('returns true when card stat is null', () => {
			const card = createBasicCard({ stat: null as any });
			const result = shouldShowTopRightFlourish(card);
			expect(result).toBe(true);
		});
	});

	describe('initializeImageState', () => {
		it('returns initial state with null values', () => {
			const result = initializeImageState();

			expect(result).toEqual({
				currentUrl: null,
				lastBlob: null,
				lastUrl: null
			});
		});
	});

	describe('updateImageState', () => {
		it('updates state with new values', () => {
			const initialState: ImageState = {
				currentUrl: 'old-url',
				lastBlob: null,
				lastUrl: 'old-url'
			};

			const result = updateImageState(initialState, {
				currentUrl: 'new-url',
				lastUrl: 'new-url'
			});

			expect(result).toEqual({
				currentUrl: 'new-url',
				lastBlob: null,
				lastUrl: 'new-url'
			});
		});

		it('does not modify original state', () => {
			const initialState: ImageState = {
				currentUrl: 'old-url',
				lastBlob: null,
				lastUrl: 'old-url'
			};

			updateImageState(initialState, { currentUrl: 'new-url' });

			expect(initialState.currentUrl).toBe('old-url');
		});

		it('handles partial updates', () => {
			const initialState: ImageState = {
				currentUrl: 'old-url',
				lastBlob: null,
				lastUrl: 'old-url'
			};

			const result = updateImageState(initialState, {
				currentUrl: 'new-url'
			});

			expect(result).toEqual({
				currentUrl: 'new-url',
				lastBlob: null,
				lastUrl: 'old-url'
			});
		});
	});
});
