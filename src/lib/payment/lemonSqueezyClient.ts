/**
 * Lemon Squeezy API Client
 *
 * Helper functions for interacting with the Lemon Squeezy API
 * Docs: https://docs.lemonsqueezy.com/api
 */

import crypto from 'crypto';
import {
	LEMON_SQUEEZY_API_KEY,
	LEMON_SQUEEZY_STORE_ID,
	LEMON_SQUEEZY_TEST_MODE
} from '$env/static/private';

const API_BASE_URL = 'https://api.lemonsqueezy.com/v1';

// Parse test mode from env var
const TEST_MODE = LEMON_SQUEEZY_TEST_MODE === 'true';

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
					},
					test_mode: TEST_MODE
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

/**
 * Price model for a variant (includes package pricing)
 */
export interface LemonSqueezyPriceModel {
	id: string;
	scheme: 'standard' | 'package' | 'graduated' | 'volume';
	package_size?: number; // Number of units per package (e.g., tokens)
	usage_aggregation?: string;
}

/**
 * Product variant from Lemon Squeezy API
 */
export interface LemonSqueezyVariant {
	id: string;
	product_id: string;
	name: string;
	price: number; // in cents
	is_subscription: boolean;
	interval?: string;
	interval_count?: number;
	description?: string;
	sort: number; // Order in Lemon Squeezy UI
	status: string; // "published", "pending", "draft"
	price_model?: LemonSqueezyPriceModel; // Package pricing data
}

/**
 * Product from Lemon Squeezy API
 */
export interface LemonSqueezyProduct {
	id: string;
	store_id: string;
	name: string;
	description: string;
	status: string;
	variants: LemonSqueezyVariant[];
}

/**
 * Get all products for the store
 *
 * @returns Array of products
 */
export async function getProducts(): Promise<LemonSqueezyProduct[]> {
	const response = await fetch(
		`${API_BASE_URL}/products?filter[store_id]=${LEMON_SQUEEZY_STORE_ID}`,
		{
			headers: getHeaders()
		}
	);

	if (!response.ok) {
		const error = await response.text();
		console.error('[LemonSqueezy] Get products failed:', error);
		throw new Error(`Failed to get products: ${response.status}`);
	}

	const data = await response.json();

	// Transform API response to our format
	return data.data.map((product: any) => ({
		id: product.id,
		store_id: product.attributes.store_id,
		name: product.attributes.name,
		description: product.attributes.description,
		status: product.attributes.status
	}));
}

/**
 * Get variants for a specific product (with price-model for package pricing)
 *
 * @param productId - Product ID
 * @returns Array of variants with package pricing data
 */
export async function getVariants(productId: string): Promise<LemonSqueezyVariant[]> {
	// Include price-model to get package pricing data
	const response = await fetch(
		`${API_BASE_URL}/variants?filter[product_id]=${productId}&include=price-model`,
		{
			headers: getHeaders()
		}
	);

	if (!response.ok) {
		const error = await response.text();
		console.error('[LemonSqueezy] Get variants failed:', error);
		throw new Error(`Failed to get variants: ${response.status}`);
	}

	const data = await response.json();

	// Build a map of price models
	// Note: API returns type "prices" even though we include "price-model"
	const priceModels = new Map<string, LemonSqueezyPriceModel>();
	if (data.included) {
		data.included.forEach((item: any) => {
			if (item.type === 'prices') {
				priceModels.set(item.id, {
					id: item.id,
					scheme: item.attributes.scheme,
					package_size: item.attributes.package_size,
					usage_aggregation: item.attributes.usage_aggregation
				});
			}
		});
	}

	// Transform API response to our format
	return data.data
		.map((variant: any) => {
			// Get price model ID from relationships
			const priceModelId = variant.relationships?.['price-model']?.data?.id;
			const priceModel = priceModelId ? priceModels.get(priceModelId) : undefined;

			return {
				id: variant.id,
				product_id: variant.attributes.product_id,
				name: variant.attributes.name,
				price: variant.attributes.price,
				is_subscription: variant.attributes.is_subscription,
				interval: variant.attributes.interval,
				interval_count: variant.attributes.interval_count,
				description: variant.attributes.description,
				sort: variant.attributes.sort,
				status: variant.attributes.status,
				price_model: priceModel
			};
		})
		.filter((v: LemonSqueezyVariant) => {
			// Only published variants with package pricing
			return (
				v.status === 'published' &&
				v.price_model?.scheme === 'package' &&
				v.price_model?.package_size
			);
		})
		.sort((a: LemonSqueezyVariant, b: LemonSqueezyVariant) => a.sort - b.sort); // Sort by LS UI order
}

/**
 * Get a product with its variants
 *
 * @param productId - Product ID
 * @returns Product with variants
 */
export async function getProductWithVariants(productId: string): Promise<LemonSqueezyProduct> {
	const [products, variants] = await Promise.all([
		getProducts(),
		getVariants(productId)
	]);

	const product = products.find(p => p.id === productId);

	if (!product) {
		throw new Error(`Product ${productId} not found`);
	}

	return {
		...product,
		variants
	};
}
