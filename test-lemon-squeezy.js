/**
 * Test Lemon Squeezy API integration
 * Run with: node test-lemon-squeezy.js
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

console.log('🍋 Testing Lemon Squeezy Integration\n');
console.log('================================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`API Key: ${LEMON_SQUEEZY_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`Store ID: ${LEMON_SQUEEZY_STORE_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`Webhook Secret: ${LEMON_SQUEEZY_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID) {
	console.log('❌ Missing required environment variables!');
	console.log('Make sure .env.local has:');
	console.log('  LEMON_SQUEEZY_API_KEY=...');
	console.log('  LEMON_SQUEEZY_STORE_ID=...');
	console.log('  LEMON_SQUEEZY_WEBHOOK_SECRET=...');
	process.exit(1);
}

// Test 1: Verify API key by fetching store info
console.log('🧪 Test 1: Verify API Key');
try {
	const response = await fetch(`https://api.lemonsqueezy.com/v1/stores/${LEMON_SQUEEZY_STORE_ID}`, {
		headers: {
			'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
			'Accept': 'application/vnd.api+json'
		}
	});

	if (response.ok) {
		const data = await response.json();
		console.log(`✅ API Key valid! Store: ${data.data.attributes.name}`);
	} else {
		const error = await response.text();
		console.log(`❌ API request failed (${response.status}):`, error);
	}
} catch (error) {
	console.log('❌ API request error:', error.message);
}

console.log('');

// Test 2: Fetch variants to verify they exist
console.log('🧪 Test 2: Check Product Variants');
const variantIds = ['1144926', '1144938', '1144972']; // From your config

for (const variantId of variantIds) {
	try {
		const response = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
			headers: {
				'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
				'Accept': 'application/vnd.api+json'
			}
		});

		if (response.ok) {
			const data = await response.json();
			const name = data.data.attributes.name;
			const price = data.data.attributes.price;
			console.log(`✅ Variant ${variantId}: ${name} ($${price / 100})`);
		} else {
			console.log(`❌ Variant ${variantId}: Not found or invalid`);
		}
	} catch (error) {
		console.log(`❌ Variant ${variantId}: Error - ${error.message}`);
	}
}

console.log('');

// Test 3: Test creating a checkout session (won't actually charge)
console.log('🧪 Test 3: Create Test Checkout Session');
try {
	const testVariantId = '1144926'; // Starter pack
	const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
			'Accept': 'application/vnd.api+json',
			'Content-Type': 'application/vnd.api+json'
		},
		body: JSON.stringify({
			data: {
				type: 'checkouts',
				attributes: {
					checkout_data: {
						custom: {
							user_id: 'test-user-123',
							packs: '1',  // Must be string
							tier: 'Starter'
						}
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
							id: testVariantId
						}
					}
				}
			}
		})
	});

	if (response.ok) {
		const data = await response.json();
		const checkoutUrl = data.data.attributes.url;
		console.log(`✅ Checkout session created!`);
		console.log(`   URL: ${checkoutUrl}`);
		console.log(`   (This is a test - no payment will be charged)`);
	} else {
		const error = await response.text();
		console.log(`❌ Checkout creation failed (${response.status}):`, error);
	}
} catch (error) {
	console.log('❌ Checkout creation error:', error.message);
}

console.log('');
console.log('================================');
console.log('✅ Lemon Squeezy integration test complete!');
