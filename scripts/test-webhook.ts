/**
 * Test Lemon Squeezy webhook locally
 *
 * This script generates a valid webhook payload, signs it with HMAC SHA-256,
 * and sends it to your local webhook endpoint.
 *
 * Usage:
 *   npx tsx scripts/test-webhook.ts [event_type] [user_id] [packs]
 *
 * Examples:
 *   npx tsx scripts/test-webhook.ts order_created abc-123 3
 *   npx tsx scripts/test-webhook.ts order_refunded abc-123 3
 */

import { createHmac, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
const BASE_URL = process.env.TEST_WEBHOOK_URL || 'http://localhost:5173';

if (!WEBHOOK_SECRET) {
	console.error('❌ Missing LEMON_SQUEEZY_WEBHOOK_SECRET in .env.local');
	process.exit(1);
}

// Parse command line args
const eventType = process.argv[2] || 'order_created';
const userId = process.argv[3] || 'test-user-' + randomBytes(4).toString('hex');
const packs = parseInt(process.argv[4] || '3', 10);

// Validate event type
if (!['order_created', 'order_refunded'].includes(eventType)) {
	console.error('❌ Invalid event type. Use: order_created or order_refunded');
	process.exit(1);
}

// Validate packs
if (![1, 3, 5].includes(packs)) {
	console.error('❌ Invalid packs. Use: 1, 3, or 5');
	process.exit(1);
}

// Calculate values
const orderId = randomBytes(8).toString('hex');
const orderNumber = Math.floor(Math.random() * 10000);
const tokensPerPack = 5000;
const tokens = packs * tokensPerPack;

// Price mapping (in cents)
const priceMap: Record<number, number> = {
	1: 500, // $5.00
	3: 1300, // $13.00
	5: 2000 // $20.00
};
const totalPrice = priceMap[packs];

// Variant mapping
const variantMap: Record<number, { id: string; name: string }> = {
	1: { id: '1146779', name: 'Small' },
	3: { id: '1146782', name: 'Medium' },
	5: { id: '1146783', name: 'Mega' }
};
const variant = variantMap[packs];

// Generate webhook payload
const payload = {
	meta: {
		test_mode: true,
		event_name: eventType,
		custom_data: {
			user_id: userId,
			packs: packs.toString(),
			tier: variant.name
		}
	},
	data: {
		type: 'orders',
		id: orderId,
		attributes: {
			store_id: 243665,
			order_number: orderNumber,
			user_name: 'Test User',
			user_email: 'test@example.com',
			status: eventType === 'order_created' ? 'paid' : 'refunded',
			status_formatted: eventType === 'order_created' ? 'Paid' : 'Refunded',
			total: totalPrice,
			total_formatted: `$${(totalPrice / 100).toFixed(2)}`,
			first_order_item: {
				order_id: orderId,
				product_id: 728715,
				variant_id: variant.id,
				variant_name: variant.name,
				price: totalPrice
			},
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	}
};

// Convert to string
const payloadString = JSON.stringify(payload);

// Generate signature
const hmac = createHmac('sha256', WEBHOOK_SECRET);
const signature = hmac.update(payloadString).digest('hex');

// Send webhook
async function sendWebhook() {
	console.log('🍋 Testing Lemon Squeezy Webhook\n');
	console.log('Event:', eventType);
	console.log('User ID:', userId);
	console.log('Packs:', packs);
	console.log('Tokens:', tokens);
	console.log('Price:', `$${(totalPrice / 100).toFixed(2)}`);
	console.log('Order ID:', orderId);
	console.log('\n📤 Sending webhook to:', `${BASE_URL}/api/tokens/webhook`);
	console.log('Signature:', signature.substring(0, 16) + '...');

	try {
		const response = await fetch(`${BASE_URL}/api/tokens/webhook`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Signature': signature
			},
			body: payloadString
		});

		const statusEmoji = response.ok ? '✅' : '❌';
		console.log(`\n${statusEmoji} Response: ${response.status} ${response.statusText}`);

		if (!response.ok) {
			const text = await response.text();
			console.log('Response body:', text);
			process.exit(1);
		}

		console.log('\n✅ Webhook sent successfully!\n');
		console.log('Next steps:');
		console.log('1. Check your server logs for webhook processing');
		console.log('2. Query the transactions table in Supabase');
		console.log('3. Verify user credits were updated');
	} catch (error) {
		console.error('\n❌ Error sending webhook:', error);
		console.log('\nMake sure your dev server is running:');
		console.log('  npm run dev');
		process.exit(1);
	}
}

// Display payload for debugging
console.log('\n📋 Webhook Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n');

sendWebhook();
