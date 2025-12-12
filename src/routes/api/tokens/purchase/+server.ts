/**
 * POST /api/tokens/purchase
 *
 * Create a Lemon Squeezy checkout session for token purchase
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import { createCheckout } from '$lib/payment/lemonSqueezyClient';
import {
	getVariantId,
	getTierInfo,
	isValidPackCount
} from '$lib/payment/lemonSqueezyVariants';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Verify user authentication
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// 2. Parse and validate request body
		const body = await request.json();
		const { packs } = body;

		if (!isValidPackCount(packs)) {
			return json(
				{ success: false, error: 'Invalid pack count. Must be 1, 3, or 5.' },
				{ status: 400 }
			);
		}

		// 3. Get variant ID and tier info
		const variantId = getVariantId(packs);
		const tierInfo = getTierInfo(packs);

		if (!variantId || !tierInfo) {
			console.error('[Purchase] No variant ID found for packs:', packs);
			return json({ success: false, error: 'Invalid pack configuration' }, { status: 500 });
		}

		console.log(`[Purchase] User ${userId} purchasing ${packs} pack(s) (${tierInfo.name})`);

		// 4. Create Lemon Squeezy checkout session
		let checkoutUrl: string;
		let checkoutId: string;

		try {
			const checkout = await createCheckout(variantId, {
				user_id: userId,
				packs: packs,
				tier: tierInfo.name
			});
			checkoutUrl = checkout.url;
			checkoutId = checkout.checkoutId;
		} catch (error) {
			console.error('[Purchase] Lemon Squeezy checkout creation failed:', error);
			return json(
				{ success: false, error: 'Failed to create checkout session' },
				{ status: 500 }
			);
		}

		// 5. Calculate expected values
		const basePrice = tierInfo.price;
		const BASE_FEE = 0.5;
		const FEE_PERCENTAGE = 0.05;
		const discountedPrice = basePrice * (1 - tierInfo.discount);
		const transactionFee = BASE_FEE + discountedPrice * FEE_PERCENTAGE;
		const totalPrice = discountedPrice + transactionFee;

		// 6. Store pending transaction in database
		try {
			const { error: insertError } = await supabaseAdmin.from('transactions').insert({
				user_id: userId,
				lemon_squeezy_order_id: `pending-${checkoutId}`, // Temporary, will be updated by webhook
				lemon_squeezy_checkout_id: checkoutId,
				variant_id: variantId,
				variant_name: tierInfo.name,
				amount_usd: totalPrice,
				tokens_purchased: tierInfo.tokens,
				status: 'pending'
			});

			if (insertError) {
				console.error('[Purchase] Failed to store transaction:', insertError);
				// Don't fail the request - user can still checkout
				// We'll create the transaction from the webhook
			}
		} catch (dbError) {
			console.error('[Purchase] Database error:', dbError);
			// Continue anyway - webhook will create the record
		}

		console.log(`[Purchase] Checkout created: ${checkoutUrl}`);

		// 7. Return checkout URL
		return json({
			success: true,
			checkoutUrl
		});
	} catch (error) {
		console.error('[Purchase] Unexpected error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
