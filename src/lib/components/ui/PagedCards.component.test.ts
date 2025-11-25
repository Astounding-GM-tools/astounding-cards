/**
 * Integration test for PagedCards
 */

import { describe, it, expect } from 'vitest';
import {
	getCardsPerPage,
	getCardSize,
	createPages,
	createPaginatedCards
} from './PagedCards.svelte.ts';

describe('PagedCards Component Integration', () => {
	it('should import all extracted logic functions', () => {
		expect(typeof getCardsPerPage).toBe('function');
		expect(typeof getCardSize).toBe('function');
		expect(typeof createPages).toBe('function');
		expect(typeof createPaginatedCards).toBe('function');
	});

	it('should calculate cards per page correctly', () => {
		expect(getCardsPerPage('poker')).toBe(9);
		expect(getCardsPerPage('tarot')).toBe(4);
	});

	it('should get card size with fallback', () => {
		expect(getCardSize(null)).toBe('poker');
		expect(getCardSize({ meta: { cardSize: 'tarot' } } as any)).toBe('tarot');
	});

	it('should create pages correctly', () => {
		const cards = Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}` })) as any[];
		const pages = createPages(cards, 4);

		expect(pages).toHaveLength(3); // ceil(10/4) = 3
		expect(pages[0].cards).toHaveLength(4);
		expect(pages[1].cards).toHaveLength(4);
		expect(pages[2].cards).toHaveLength(2);
	});
});
