/**
 * Token Costs Configuration
 * 
 * Defines token costs for various premium features.
 * 1 token = 0.01 NOK
 */

export const TOKEN_COSTS = {
	/** Community image generation (100 tokens = 1 NOK) */
	IMAGE_GENERATION_COMMUNITY: 100,
	
	/** AI deck generation (200 tokens = 2 NOK) */
	DECK_GENERATION: 200,
	
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
