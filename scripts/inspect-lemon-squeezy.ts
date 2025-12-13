/**
 * Script to inspect Lemon Squeezy product and variant data
 *
 * Usage: npx tsx scripts/inspect-lemon-squeezy.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
const PRODUCT_ID = process.env.LEMON_SQUEEZY_PRODUCT_ID;

if (!API_KEY || !STORE_ID || !PRODUCT_ID) {
	console.error('❌ Missing required environment variables:');
	console.error('   LEMON_SQUEEZY_API_KEY:', API_KEY ? '✓' : '✗');
	console.error('   LEMON_SQUEEZY_STORE_ID:', STORE_ID ? '✓' : '✗');
	console.error('   LEMON_SQUEEZY_PRODUCT_ID:', PRODUCT_ID ? '✓' : '✗');
	process.exit(1);
}

const API_BASE_URL = 'https://api.lemonsqueezy.com/v1';

function getHeaders() {
	return {
		Authorization: `Bearer ${API_KEY}`,
		Accept: 'application/vnd.api+json',
		'Content-Type': 'application/vnd.api+json'
	};
}

async function inspectProduct() {
	console.log('🍋 Inspecting Lemon Squeezy Product\n');
	console.log('Store ID:', STORE_ID);
	console.log('Product ID:', PRODUCT_ID);
	console.log('');

	// Fetch product
	console.log('📦 Fetching product...');
	const productResponse = await fetch(`${API_BASE_URL}/products/${PRODUCT_ID}`, {
		headers: getHeaders()
	});

	if (!productResponse.ok) {
		const error = await productResponse.text();
		console.error('❌ Failed to fetch product:', error);
		process.exit(1);
	}

	const productData = await productResponse.json();
	console.log('\n📦 Product Data:');
	console.log(JSON.stringify(productData, null, 2));

	// Fetch variants
	console.log('\n\n🔢 Fetching variants...');
	const variantsResponse = await fetch(
		`${API_BASE_URL}/variants?filter[product_id]=${PRODUCT_ID}`,
		{
			headers: getHeaders()
		}
	);

	if (!variantsResponse.ok) {
		const error = await variantsResponse.text();
		console.error('❌ Failed to fetch variants:', error);
		process.exit(1);
	}

	const variantsData = await variantsResponse.json();
	console.log('\n🔢 Variants Data:');
	console.log(JSON.stringify(variantsData, null, 2));

	// Summary
	console.log('\n\n📊 Summary:');
	console.log('Product:', productData.data.attributes.name);
	console.log('Status:', productData.data.attributes.status);
	console.log('Variants:', variantsData.data.length);
	console.log('');

	variantsData.data.forEach((variant: any, index: number) => {
		const attrs = variant.attributes;
		console.log(`\nVariant ${index + 1}:`);
		console.log('  ID:', variant.id);
		console.log('  Name:', attrs.name);
		console.log('  Price:', `$${attrs.price / 100}`);
		console.log('  Sort:', attrs.sort);
		console.log('  Status:', attrs.status);
		console.log('  Subscription:', attrs.is_subscription);

		// Check for package pricing
		if (attrs.pay_what_you_want) {
			console.log('  Pricing:', 'Pay What You Want');
			console.log('    Min Price:', `$${attrs.min_price / 100}`);
			console.log('    Suggested:', `$${attrs.suggested_price / 100}`);
		}

		console.log('  Description:', attrs.description || '(none)');
		console.log('  Created:', attrs.created_at);
	});

	console.log('\n\n💡 Package Pricing Setup:');
	console.log('To use package pricing for tokens:');
	console.log('1. Edit each variant in Lemon Squeezy');
	console.log('2. Under "Advanced pricing" → enable "Package pricing"');
	console.log('3. Set "Package size" to the number of tokens (e.g., 5000)');
	console.log('4. The API will then include "price_model" data with package_size');
	console.log('');
	console.log('Note: Package pricing data requires fetching the price-model relationship');
	console.log('      Run: npx tsx scripts/inspect-package-pricing.ts');

	console.log('\n✅ Inspection complete!\n');
}

inspectProduct().catch(error => {
	console.error('❌ Error:', error);
	process.exit(1);
});
