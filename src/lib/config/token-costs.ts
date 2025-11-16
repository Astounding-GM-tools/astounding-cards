/**
 * Token Costs Configuration
 * 
 * Defines token costs for various premium features.
 * 1 token = 0.01 NOK
 */

/**
 * Welcome bonus for new users (in tokens)
 * 
 * 500 tokens = 5 NOK value = ~5 community image generations
 * This gives new users a chance to try the AI generation features.
 * 
 * To change this value:
 * 1. Update this constant
 * 2. Update the value in grant_welcome_bonus() function in supabase/schema.sql
 * 3. Apply the migration via Supabase dashboard or migration script
 */
export const NEW_USER_WELCOME_BONUS = 500;

export const TOKEN_COSTS = {
	/** Community image generation (100 tokens = 1 NOK) */
	IMAGE_GENERATION_COMMUNITY: 100,
	
	/** AI deck generation (10 tokens per card to prevent abuse while staying generous) */
	DECK_GENERATION_PER_CARD: 10,
	
	/** Future: Private image generation (240 tokens = 2.40 NOK) */
	IMAGE_GENERATION_PRIVATE: 240,
	
	/** Future: Monthly cloud storage (50 tokens = 0.50 NOK per month) */
	CLOUD_STORAGE_MONTHLY: 50
} as const;

export type TokenCostType = keyof typeof TOKEN_COSTS;

/**
 * Get token cost for a specific feature
 */
export function getTokenCost(feature: TokenCostType): number {
	return TOKEN_COSTS[feature];
}

/**
 * Format token amount with NOK equivalent
 * @param tokens Token amount
 * @returns Formatted string like "100 tokens (1 NOK)"
 */
export function formatTokenCost(tokens: number): string {
	const nok = (tokens * 0.01).toFixed(2).replace(/\.00$/, '');
	return `${tokens} tokens (${nok} NOK)`;
}

/**
 * Format token balance
 * @param balance Current token balance
 * @returns Formatted string like "500 tokens"
 */
export function formatTokenBalance(balance: number): string {
	return `${balance.toLocaleString()} tokens`;
}

/**
 * Calculate deck generation cost based on card count
 * @param cardCount Number of cards in the deck
 * @returns Total token cost
 */
export function calculateDeckGenerationCost(cardCount: number): number {
	return cardCount * TOKEN_COSTS.DECK_GENERATION_PER_CARD;
}
