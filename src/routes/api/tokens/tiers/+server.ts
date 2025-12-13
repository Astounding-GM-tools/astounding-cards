/**
 * GET /api/tokens/tiers
 *
 * Get available token pack tiers from Lemon Squeezy
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllTiers } from '$lib/payment/lemonSqueezyVariants';

export const GET: RequestHandler = async () => {
	try {
		const tiers = await getAllTiers();

		return json({
			success: true,
			tiers: tiers.map(tier => ({
				name: tier.name,
				packs: tier.packs,
				tokens: tier.tokens,
				price: tier.price,
				discount: tier.discount
				// Don't expose variant IDs to the client
			}))
		});
	} catch (error) {
		console.error('[Tiers] Failed to fetch token tiers:', error);
		return json(
			{
				success: false,
				error: 'Failed to load token pack options'
			},
			{ status: 500 }
		);
	}
};
