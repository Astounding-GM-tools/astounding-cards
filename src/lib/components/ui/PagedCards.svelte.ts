// Logic for PagedCards component
import type { Card, Deck, CardSize } from '$lib/types';

export interface Page {
	index: number;
	cards: Card[];
}

/**
 * Get cards per page based on card size
 */
export function getCardsPerPage(cardSize: CardSize): number {
	return cardSize === 'poker' ? 9 : 4;
}

/**
 * Get card size from deck or default to poker
 */
export function getCardSize(deck: Deck | null): CardSize {
	return deck?.meta.cardSize || 'poker';
}

/**
 * Split cards into pages based on cards per page
 */
export function createPages(cards: Card[], cardsPerPage: number): Page[] {
	if (!cards.length) return [];

	const pageCount = Math.ceil(cards.length / cardsPerPage);
	return Array(pageCount)
		.fill(null)
		.map((_, i) => ({
			index: i,
			cards: cards.slice(i * cardsPerPage, (i + 1) * cardsPerPage)
		}));
}

/**
 * Create paginated cards from deck
 */
export function createPaginatedCards(deck: Deck | null): {
	pages: Page[];
	cardSize: CardSize;
	cardsPerPage: number;
} {
	if (!deck) {
		return {
			pages: [],
			cardSize: 'poker',
			cardsPerPage: 9
		};
	}

	const cardSize = getCardSize(deck);
	const cardsPerPage = getCardsPerPage(cardSize);
	const pages = createPages(deck.cards, cardsPerPage);

	return {
		pages,
		cardSize,
		cardsPerPage
	};
}
