/**
 * Lemon Squeezy Variant Management
 *
 * Fetches product variants dynamically from Lemon Squeezy API
 * instead of hardcoding them.
 */

import {
	getProductWithVariants,
	type LemonSqueezyVariant
} from '$lib/payment/lemonSqueezyClient';
import { LEMON_SQUEEZY_PRODUCT_ID } from '$env/static/private';

export const TOKENS_PER_PACK = 5000;

/**
 * Token pack tier structure
 */
export interface TokenTier {
	name: string;
	packs: number;
	tokens: number;
	price: number; // in USD
	discount: number;
	variantId: string;
}

/**
 * In-memory cache for variants (refreshed on server restart)
 */
let cachedTiers: TokenTier[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get token count from variant's package pricing
 *
 * Uses the package_size field from Lemon Squeezy's package pricing feature.
 * This is much more reliable than parsing descriptions.
 *
 * @param variant - Variant with package pricing data
 * @returns Number of tokens in the package
 */
function getTokenCount(variant: LemonSqueezyVariant): number {
	// Use package_size if available (package pricing)
	if (variant.price_model?.package_size) {
		return variant.price_model.package_size;
	}

	// This shouldn't happen as we filter for package pricing in getVariants()
	// But just in case, estimate from price (assumes ~$1 per 1000 tokens)
	console.warn(
		`[LemonSqueezy] Variant ${variant.id} (${variant.name}) has no package_size, estimating from price`
	);
	return Math.round((variant.price / 100) * 1000);
}

/**
 * Calculate discount percentage based on price per token
 *
 * Compares the price-per-token of this variant against a base rate.
 * Base rate is calculated from the smallest pack (assuming it has no discount).
 *
 * @param tokens - Total tokens in this variant
 * @param priceInCents - Price in cents
 * @param allVariants - All variants to find the base rate (optional, for accurate calculation)
 * @returns Discount as a decimal (0.15 = 15% discount)
 */
function calculateDiscount(
	tokens: number,
	priceInCents: number,
	baseRatePerToken?: number
): number {
	const pricePerToken = priceInCents / tokens;

	// If we don't have a base rate, assume this is the base (0% discount)
	if (!baseRatePerToken) {
		return 0;
	}

	// Calculate discount compared to base rate
	const discount = Math.max(0, (baseRatePerToken - pricePerToken) / baseRatePerToken);
	return discount;
}

/**
 * Fetch and cache token pack tiers from Lemon Squeezy
 */
export async function getTokenTiers(): Promise<TokenTier[]> {
	const now = Date.now();

	// Return cached data if still valid
	if (cachedTiers && (now - cacheTimestamp) < CACHE_TTL) {
		return cachedTiers;
	}

	try {
		// Fetch product with variants from Lemon Squeezy
		const product = await getProductWithVariants(LEMON_SQUEEZY_PRODUCT_ID);

		// Calculate base rate from the smallest pack (first variant after sorting)
		const baseVariant = product.variants[0];
		const baseTokens = baseVariant ? getTokenCount(baseVariant) : TOKENS_PER_PACK;
		const baseRatePerToken = baseVariant ? baseVariant.price / baseTokens : 0;

		// Transform variants into our tier structure
		const tiers: TokenTier[] = product.variants.map((variant: LemonSqueezyVariant, index) => {
			const tokens = getTokenCount(variant);
			const packs = Math.round(tokens / TOKENS_PER_PACK);

			// First variant has no discount (it's the base)
			const discount =
				index === 0 ? 0 : calculateDiscount(tokens, variant.price, baseRatePerToken);

			return {
				name: variant.name,
				packs,
				tokens,
				price: variant.price / 100, // Convert cents to USD
				discount,
				variantId: variant.id
			};
		});
		// Variants are already sorted by `sort` field from API

		if (tiers.length === 0) {
			console.error('[LemonSqueezy] No valid package pricing variants found');
			console.error('Ensure variants have:');
			console.error('  1. status: "published"');
			console.error('  2. Package pricing enabled');
			console.error('  3. Package size set to token count');
			throw new Error('No valid token pack variants found');
		}

		// Update cache
		cachedTiers = tiers;
		cacheTimestamp = now;

		return tiers;
	} catch (error) {
		console.error('[LemonSqueezy] Failed to fetch token tiers:', error);

		// If we have stale cached data, return it rather than failing
		if (cachedTiers) {
			console.warn('[LemonSqueezy] Using stale cached data');
			return cachedTiers;
		}

		throw error;
	}
}

/**
 * Get variant ID for a given pack count
 */
export async function getVariantId(packs: number): Promise<string | null> {
	const tiers = await getTokenTiers();
	const tier = tiers.find(t => t.packs === packs);
	return tier?.variantId || null;
}

/**
 * Get tier info for a given pack count
 */
export async function getTierInfo(packs: number): Promise<TokenTier | null> {
	const tiers = await getTokenTiers();
	return tiers.find(t => t.packs === packs) || null;
}

/**
 * Calculate total tokens for a pack count
 */
export function calculateTokens(packs: number): number {
	return packs * TOKENS_PER_PACK;
}

/**
 * Validate pack count against available tiers
 */
export async function isValidPackCount(packs: unknown): Promise<boolean> {
	if (typeof packs !== 'number') return false;

	const tiers = await getTokenTiers();
	return tiers.some(t => t.packs === packs);
}

/**
 * Get all available tiers (for UI display)
 */
export async function getAllTiers(): Promise<TokenTier[]> {
	return getTokenTiers();
}

/**
 * Force refresh the cache (useful for testing or admin purposes)
 */
export function clearCache(): void {
	cachedTiers = null;
	cacheTimestamp = 0;
}
