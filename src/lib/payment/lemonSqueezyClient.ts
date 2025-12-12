/**
 * Lemon Squeezy API Client
 *
 * Helper functions for interacting with the Lemon Squeezy API
 * Docs: https://docs.lemonsqueezy.com/api
 */

import { LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID } from '$env/static/private';

const API_BASE_URL = 'https://api.lemonsqueezy.com/v1';

/**
 * Headers for Lemon Squeezy API requests
 */
function getHeaders() {
	return {
		Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
		Accept: 'application/vnd.api+json',
		'Content-Type': 'application/vnd.api+json'
	};
}

/**
 * Create a checkout session
 *
 * @param variantId - Lemon Squeezy variant ID
 * @param customData - Custom data to attach (e.g., user_id)
 * @returns Checkout URL
 */
export async function createCheckout(
	variantId: string,
	customData: Record<string, unknown>
): Promise<{ url: string; checkoutId: string }> {
	// Lemon Squeezy requires all custom data values to be strings
	const stringifiedCustomData: Record<string, string> = {};
	for (const [key, value] of Object.entries(customData)) {
		stringifiedCustomData[key] = String(value);
	}

	const response = await fetch(`${API_BASE_URL}/checkouts`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify({
			data: {
				type: 'checkouts',
				attributes: {
					checkout_data: {
						custom: stringifiedCustomData
					}
				},
				relationships: {
					store: {
						data: {
							type: 'stores',
							id: LEMON_SQUEEZY_STORE_ID
						}
					},
					variant: {
						data: {
							type: 'variants',
							id: variantId
						}
					}
				}
			}
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('[LemonSqueezy] Checkout creation failed:', error);
		throw new Error(`Failed to create checkout: ${response.status}`);
	}

	const data = await response.json();
	const checkoutUrl = data.data.attributes.url;
	const checkoutId = data.data.id;

	if (!checkoutUrl) {
		throw new Error('No checkout URL returned from Lemon Squeezy');
	}

	return { url: checkoutUrl, checkoutId };
}

/**
 * Get order details
 *
 * @param orderId - Lemon Squeezy order ID
 * @returns Order data
 */
export async function getOrder(orderId: string) {
	const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
		headers: getHeaders()
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('[LemonSqueezy] Get order failed:', error);
		throw new Error(`Failed to get order: ${response.status}`);
	}

	return response.json();
}

/**
 * Verify webhook signature
 *
 * @param payload - Raw webhook payload (string)
 * @param signature - Signature from X-Signature header
 * @param secret - Webhook secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string
): boolean {
	// Lemon Squeezy uses HMAC SHA-256
	const crypto = require('crypto');

	try {
		const hmac = crypto.createHmac('sha256', secret);
		const digest = hmac.update(payload).digest('hex');

		// Use timing-safe comparison
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
	} catch (error) {
		console.error('[LemonSqueezy] Signature verification error:', error);
		return false;
	}
}

/**
 * Parse webhook payload
 *
 * Extracts relevant data from Lemon Squeezy webhook
 */
export interface WebhookData {
	eventName: string;
	orderId: string;
	orderNumber: number;
	customData: Record<string, unknown>;
	status: string;
	total: number;
	variantId: string;
	variantName: string;
}

export function parseWebhookPayload(payload: any): WebhookData {
	const meta = payload.meta || {};
	const data = payload.data || {};
	const attributes = data.attributes || {};
	const firstItem = attributes.first_order_item || {};

	return {
		eventName: meta.event_name,
		orderId: data.id,
		orderNumber: attributes.order_number,
		customData: meta.custom_data || {},
		status: attributes.status,
		total: attributes.total,
		variantId: firstItem.variant_id,
		variantName: firstItem.variant_name
	};
}
