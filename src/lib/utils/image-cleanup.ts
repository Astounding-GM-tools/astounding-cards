/**
 * Image cleanup utilities for handling blob URL issues
 */

/**
 * Check if a card has old local blob URLs that won't display correctly
 */
export function hasOldBlobUrls(card: any): boolean {
  if (!card.image) return false;
  
  // Check for old blob URLs that are no longer valid
  return card.image === 'blob:local' || 
         (card.image.startsWith('blob:') && !card.image.includes('http')) ||
         (!card.image.includes(':') && !card.image.startsWith('http'));
}

/**
 * Clean up invalid blob URLs from a card
 */
export function cleanupCardImage(card: any): any {
  if (hasOldBlobUrls(card)) {
    return {
      ...card,
      image: null, // Clear invalid blob URL
      imageBlob: undefined // Clear any associated blob data
    };
  }
  return card;
}

/**
 * Clean up invalid blob URLs from all cards in a deck
 */
export function cleanupDeckImages(deck: any): any {
  return {
    ...deck,
    cards: deck.cards.map(cleanupCardImage)
  };
}

/**
 * Count cards with old blob URLs that need cleanup
 */
export function countOldBlobImages(deck: any): number {
  return deck.cards.filter(hasOldBlobUrls).length;
}
