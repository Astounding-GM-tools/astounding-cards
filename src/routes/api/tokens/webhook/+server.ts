/**
 * POST /api/tokens/webhook
 *
 * Handle Lemon Squeezy webhook events for token purchases
 * CRITICAL: Must verify signature for security!
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { verifyWebhookSignature, parseWebhookPayload } from '$lib/payment/lemonSqueezyClient';
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// 1. Get raw body and signature
		const rawBody = await request.text();
		const signature = request.headers.get('x-signature');

		if (!signature) {
			console.error('[Webhook] No signature header');
			return new Response('No signature', { status: 401 });
		}

		// 2. Verify webhook signature (CRITICAL FOR SECURITY!)
		const isValid = verifyWebhookSignature(rawBody, signature, LEMON_SQUEEZY_WEBHOOK_SECRET);

		if (!isValid) {
			console.error('[Webhook] Invalid signature');
			return new Response('Invalid signature', { status: 401 });
		}

		// 3. Parse webhook payload
		const payload = JSON.parse(rawBody);
		const webhookData = parseWebhookPayload(payload);

		console.log(`[Webhook] Event: ${webhookData.eventName}, Order: ${webhookData.orderId}`);

		// 4. Extract user ID and packs from custom data (all values are strings from Lemon Squeezy)
		const userId = webhookData.customData.user_id as string;
		const packsStr = webhookData.customData.packs as string;
		const packs = parseInt(packsStr, 10);

		if (!userId) {
			console.error('[Webhook] Missing user_id in custom data');
			return new Response('Missing user_id', { status: 400 });
		}

		if (isNaN(packs)) {
			console.error('[Webhook] Invalid packs value in custom data');
			return new Response('Invalid packs value', { status: 400 });
		}

		// 5. Handle different event types
		if (webhookData.eventName === 'order_created') {
			await handleOrderCreated(userId, packs, webhookData, payload);
		} else if (webhookData.eventName === 'order_refunded') {
			await handleOrderRefunded(userId, packs, webhookData, payload);
		} else {
			console.log(`[Webhook] Unhandled event: ${webhookData.eventName}`);
		}

		// Always return 200 OK to prevent Lemon Squeezy from retrying
		return new Response('OK', { status: 200 });
	} catch (error) {
		console.error('[Webhook] Error processing webhook:', error);
		// Still return 200 to prevent retries - log error for manual investigation
		return new Response('Error logged', { status: 200 });
	}
};

/**
 * Handle order_created event - Add tokens to user's account
 */
async function handleOrderCreated(userId: string, packs: number, webhookData: any, fullPayload: any) {
	try {
		const orderId = webhookData.orderId;
		const tokensToAdd = packs * 5000; // 5000 tokens per pack

		console.log(`[Webhook] Order created: ${orderId} - Adding ${tokensToAdd} tokens to user ${userId}`);

		// Check if we've already processed this order (idempotency)
		const { data: existingTx } = await supabaseAdmin
			.from('transactions')
			.select('id, status')
			.eq('lemon_squeezy_order_id', orderId)
			.single();

		if (existingTx && existingTx.status === 'completed') {
			console.log(`[Webhook] Order ${orderId} already processed - skipping`);
			return;
		}

		// Begin transaction: Update/create transaction record AND add tokens
		// Note: These should ideally be in a database transaction, but we'll handle errors gracefully

		// 1. Create or update transaction record
		const { error: txError } = await supabaseAdmin.from('transactions').upsert(
			{
				lemon_squeezy_order_id: orderId,
				user_id: userId,
				variant_id: webhookData.variantId,
				variant_name: webhookData.variantName,
				amount_usd: webhookData.total / 100, // Lemon Squeezy returns cents
				tokens_purchased: tokensToAdd,
				status: 'completed',
				webhook_payload: fullPayload,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'lemon_squeezy_order_id' }
		);

		if (txError) {
			console.error('[Webhook] Failed to upsert transaction:', txError);
			throw txError;
		}

		// 2. Add tokens to user's balance
		// First get current balance
		const { data: userData, error: getUserError } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (getUserError) {
			console.error('[Webhook] Failed to get user credits:', getUserError);
			throw getUserError;
		}

		const currentCredits = userData?.credits || 0;
		const newCredits = currentCredits + tokensToAdd;

		// Update balance
		const { error: updateError } = await supabaseAdmin
			.from('users')
			.update({ credits: newCredits })
			.eq('id', userId);

		if (updateError) {
			console.error('[Webhook] Failed to update user credits:', updateError);
			throw updateError;
		}

		console.log(
			`[Webhook] Success! Added ${tokensToAdd} tokens to user ${userId}. New balance: ${newCredits}`
		);
	} catch (error) {
		console.error('[Webhook] Error handling order_created:', error);
		// Don't throw - we've logged the error and can manually fix if needed
	}
}

/**
 * Handle order_refunded event - Deduct tokens from user's account
 */
async function handleOrderRefunded(userId: string, packs: number, webhookData: any, fullPayload: any) {
	try {
		const orderId = webhookData.orderId;
		const tokensToDeduct = packs * 5000;

		console.log(
			`[Webhook] Order refunded: ${orderId} - Deducting ${tokensToDeduct} tokens from user ${userId}`
		);

		// 1. Update transaction status to refunded
		const { error: txError } = await supabaseAdmin
			.from('transactions')
			.update({
				status: 'refunded',
				webhook_payload: fullPayload,
				updated_at: new Date().toISOString()
			})
			.eq('lemon_squeezy_order_id', orderId);

		if (txError) {
			console.error('[Webhook] Failed to update transaction:', txError);
			throw txError;
		}

		// 2. Deduct tokens from user's balance
		const { data: userData, error: getUserError } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (getUserError) {
			console.error('[Webhook] Failed to get user credits:', getUserError);
			throw getUserError;
		}

		const currentCredits = userData?.credits || 0;
		const newCredits = Math.max(0, currentCredits - tokensToDeduct); // Don't go below 0

		const { error: updateError } = await supabaseAdmin
			.from('users')
			.update({ credits: newCredits })
			.eq('id', userId);

		if (updateError) {
			console.error('[Webhook] Failed to update user credits:', updateError);
			throw updateError;
		}

		console.log(
			`[Webhook] Success! Deducted ${tokensToDeduct} tokens from user ${userId}. New balance: ${newCredits}`
		);
	} catch (error) {
		console.error('[Webhook] Error handling order_refunded:', error);
		// Don't throw - we've logged the error and can manually fix if needed
	}
}
