/**
 * Lemon Squeezy Variant IDs
 *
 * Simplified to 3 variants for easier management:
 * - Starter (1 pack)
 * - Popular (3 packs)
 * - Power User (5 packs)
 *
 * To get these IDs:
 * 1. Go to Lemon Squeezy Dashboard → Products
 * 2. Click on "Token Packs" product
 * 3. Find each variant and copy its ID
 */

export const TOKENS_PER_PACK = 5000;

/**
 * Available token pack tiers
 */
export const TOKEN_PACK_TIERS = {
	STARTER: {
		name: 'Starter',
		packs: 1,
		tokens: 5000,
		price: 4.78,
		discount: 0,
		variantId: '1144926' // Replace with actual ID
	},
	POPULAR: {
		name: 'Popular',
		packs: 3,
		tokens: 15000,
		price: 14.34,
		discount: 0.08, // 8% off
		variantId: '1144938' // Replace with actual ID
	},
	POWER: {
		name: 'Power User',
		packs: 5,
		tokens: 25000,
		price: 23.9,
		discount: 0.16, // 16% off
		variantId: '1144972' // Replace with actual ID
	}
} as const;

export type TokenTier = keyof typeof TOKEN_PACK_TIERS;

/**
 * Map of pack count to tier
 */
export const PACK_COUNT_TO_TIER: Record<number, TokenTier> = {
	1: 'STARTER',
	3: 'POPULAR',
	5: 'POWER'
} as const;

/**
 * Get variant ID for a given pack count
 */
export function getVariantId(packs: number): string | null {
	const tier = PACK_COUNT_TO_TIER[packs];
	if (!tier) return null;
	return TOKEN_PACK_TIERS[tier].variantId;
}

/**
 * Get tier info for a given pack count
 */
export function getTierInfo(packs: number) {
	const tier = PACK_COUNT_TO_TIER[packs];
	if (!tier) return null;
	return TOKEN_PACK_TIERS[tier];
}

/**
 * Calculate total tokens for a pack count
 */
export function calculateTokens(packs: number): number {
	return packs * TOKENS_PER_PACK;
}

/**
 * Validate pack count (only 1, 3, or 5 allowed)
 */
export function isValidPackCount(packs: unknown): packs is number {
	return typeof packs === 'number' && packs in PACK_COUNT_TO_TIER;
}

/**
 * Get all available tiers (for UI display)
 */
export function getAllTiers() {
	return Object.values(TOKEN_PACK_TIERS);
}
