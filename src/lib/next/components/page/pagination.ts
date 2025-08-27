/**
 * Pagination Logic for Next System Print Cards
 * 
 * Handles proper pagination for print-ready cards where:
 * - Tarot layout: 4 cards per page (2x2 grid)
 * - Poker layout: 9 cards per page (3x3 grid) 
 * - Each page of front cards is immediately followed by corresponding back cards
 * - Back pages use CSS direction:rtl for proper double-sided printing alignment
 */

import type { Card } from '../../types/card.js';
import type { Layout } from '../../types/deck.js';

export interface CardPage {
    cards: Card[];
    pageType: 'front' | 'back';
}

/**
 * Split cards into pages based on layout, with proper front/back alternation
 */
export function createPaginatedPages(cards: Card[], layout: Layout): CardPage[] {
    if (!cards.length) return [];
    
    const cardsPerPage = layout === 'poker' ? 9 : 4;
    const pages: CardPage[] = [];
    
    // Split cards into chunks and create front/back page pairs
    for (let i = 0; i < cards.length; i += cardsPerPage) {
        const chunk = cards.slice(i, i + cardsPerPage);
        
        // Front page
        pages.push({
            cards: chunk,
            pageType: 'front'
        });
        
        // Back page (same cards, CSS direction:rtl handles visual ordering)
        pages.push({
            cards: chunk,
            pageType: 'back'
        });
    }
    
    return pages;
}
