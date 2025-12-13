/**
 * Inspect Lemon Squeezy package pricing details
 *
 * Package pricing is stored in the price-model relationship.
 * This script fetches and displays package pricing data.
 *
 * Usage: npx tsx scripts/inspect-package-pricing.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const PRODUCT_ID = process.env.LEMON_SQUEEZY_PRODUCT_ID;

if (!API_KEY || !PRODUCT_ID) {
	console.error('❌ Missing required environment variables');
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

async function inspectPackagePricing() {
	console.log('🍋 Inspecting Package Pricing\n');

	// Fetch variants with price-model included
	const variantsResponse = await fetch(
		`${API_BASE_URL}/variants?filter[product_id]=${PRODUCT_ID}&include=price-model`,
		{
			headers: getHeaders()
		}
	);

	if (!variantsResponse.ok) {
		const error = await variantsResponse.text();
		console.error('❌ Failed to fetch variants:', error);
		process.exit(1);
	}

	const data = await variantsResponse.json();

	console.log('📦 Variants with Package Pricing:\n');

	// The included price-models (API returns type "prices")
	const priceModels = new Map(
		(data.included || [])
			.filter((item: any) => item.type === 'prices')
			.map((pm: any) => [pm.id, pm.attributes])
	);

	data.data.forEach((variant: any, index: number) => {
		const attrs = variant.attributes;
		console.log(`\n${index + 1}. ${attrs.name} (ID: ${variant.id})`);
		console.log('   Price:', `$${attrs.price / 100}`);
		console.log('   Status:', attrs.status);
		console.log('   Sort:', attrs.sort);

		// Get price model ID from relationships
		const priceModelId = variant.relationships?.['price-model']?.data?.id;

		if (priceModelId && priceModels.has(priceModelId)) {
			const priceModel = priceModels.get(priceModelId);
			console.log('   Package Pricing:');
			console.log('     Scheme:', priceModel.scheme);
			console.log('     Package Size:', priceModel.package_size || 'Not set');
			console.log('     Usage Aggregation:', priceModel.usage_aggregation || 'N/A');

			if (priceModel.package_size) {
				const tokensPerDollar = priceModel.package_size / (attrs.price / 100);
				console.log(`     Rate: ${Math.round(tokensPerDollar)} tokens per $1`);
			}
		} else {
			console.log('   Package Pricing: ❌ Not configured');
			console.log('   → Enable "Package pricing" in variant settings');
		}
	});

	console.log('\n\n📊 Summary:\n');
	const withPackaging = data.data.filter((v: any) => {
		const pmId = v.relationships?.['price-model']?.data?.id;
		const pm = pmId ? priceModels.get(pmId) : null;
		return pm?.package_size;
	});

	console.log(`Total variants: ${data.data.length}`);
	console.log(`With package pricing: ${withPackaging.length}`);
	console.log(`Without package pricing: ${data.data.length - withPackaging.length}`);

	if (withPackaging.length === 0) {
		console.log('\n⚠️  No variants have package pricing enabled!');
		console.log('\nTo enable package pricing:');
		console.log('1. Go to Lemon Squeezy → Products → Edit variant');
		console.log('2. Scroll to "Advanced pricing"');
		console.log('3. Enable "Package pricing"');
		console.log('4. Set "Package size" to number of tokens (e.g., 5000)');
		console.log('5. Save the variant\n');
	}

	console.log('\n✅ Inspection complete!\n');
}

inspectPackagePricing().catch(error => {
	console.error('❌ Error:', error);
	process.exit(1);
});
