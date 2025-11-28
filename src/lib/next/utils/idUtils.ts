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
 * Falls back to a timestamp-based UUID if crypto is not available (HTTP contexts)
 */
export function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for non-secure contexts (HTTP)
	// Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generate a short, random key (6 characters)
 * Use this for entities that only need local uniqueness (cards, mechanics, stats, etc.)
 */
export function generateKey(): string {
	return Math.random().toString(36).substring(2, 8);
}
