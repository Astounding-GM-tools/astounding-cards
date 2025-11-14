/**
 * ID Generation Utilities
 *
 * Two simple functions for different ID needs:
 * - generateId(): Full UUID for globally unique entities (decks)
 * - generateKey(): 6-character random string for scoped entities (cards, mechanics, etc.)
 */

/**
 * Generate a full UUID using crypto.randomUUID()
 * Use this for globally unique entities like decks
 */
export function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Generate a short, random key (6 characters)
 * Use this for entities that only need local uniqueness (cards, mechanics, stats, etc.)
 */
export function generateKey(): string {
	return Math.random().toString(36).substring(2, 8);
}
