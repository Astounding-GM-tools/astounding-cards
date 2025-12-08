/**
 * Standalone test script for image generation
 * 
 * Usage: node test-image-gen.js
 * 
 * Tests different configurations to find what works with Gemini image generation
 */

import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
	console.error('❌ GEMINI_API_KEY not found in environment');
	process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Test configurations
const TESTS = [
	{
		name: 'No reference image, portrait in prompt',
		model: 'gemini-2.5-flash-image',
		prompt: 'PORTRAIT orientation (taller than wide). A fantasy elf ranger with silver hair in a forest.',
		includeReference: false
	},
	{
		name: 'With 350x490 reference image',
		model: 'gemini-2.5-flash-image',
		prompt: 'A fantasy elf ranger with silver hair in a forest.',
		includeReference: true
	}
];

async function testImageGeneration(testConfig) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`Test: ${testConfig.name}`);
	console.log(`Model: ${testConfig.model}`);
	console.log(`${'='.repeat(60)}\n`);

	try {
		const contentParts = [{ text: testConfig.prompt }];

		// Add reference image if requested
		if (testConfig.includeReference) {
			const refImagePath = './static/card-layout-reference.png';
			const refImageBuffer = readFileSync(refImagePath);
			const refImageBase64 = refImageBuffer.toString('base64');

			console.log('📐 Reference image:');
			console.log(`  Size: ${refImageBuffer.length} bytes`);
			console.log(`  Base64 length: ${refImageBase64.length} chars`);
			console.log(`  First 80: ${refImageBase64.substring(0, 80)}...`);

			contentParts.push({
				inlineData: {
					mimeType: 'image/png',
					data: refImageBase64
				}
			});
		}

		console.log('\n🎨 Generating image...');
		const startTime = Date.now();

		const response = await ai.models.generateContent({
			model: testConfig.model,
			contents: contentParts,
			config: {
				temperature: 0.7
			}
		});

		const duration = Date.now() - startTime;

		// Check for image in response
		const imageData = response.candidates?.[0]?.content?.parts?.find(
			(part) => part.inlineData
		);

		if (imageData?.inlineData?.data) {
			const imgBase64 = imageData.inlineData.data;
			const imgBuffer = Buffer.from(imgBase64, 'base64');

			console.log(`\n✅ SUCCESS (${duration}ms)`);
			console.log(`  Image size: ${imgBuffer.length} bytes`);
			console.log(`  MIME type: ${imageData.inlineData.mimeType}`);

			// Try to determine dimensions (rough estimate from file size)
			// Square 1024x1024 PNG ≈ 400-600KB, Portrait might be different
			const estimatedPixels = imgBuffer.length / 3; // Very rough
			console.log(`  Estimated pixels: ~${Math.round(estimatedPixels)}`);

			return { success: true, size: imgBuffer.length, duration };
		} else {
			console.log('\n❌ FAILED - No image data in response');
			console.log('Response:', JSON.stringify(response, null, 2));
			return { success: false };
		}
	} catch (error) {
		console.log(`\n❌ ERROR: ${error.message}`);
		if (error.status) {
			console.log(`  Status: ${error.status}`);
		}
		return { success: false, error: error.message };
	}
}

async function runTests() {
	console.log('🧪 Testing Gemini Image Generation');
	console.log(`Using API key: ${GEMINI_API_KEY.substring(0, 20)}...`);

	const results = [];

	for (const test of TESTS) {
		const result = await testImageGeneration(test);
		results.push({ ...test, ...result });

		// Wait between tests to avoid rate limits
		if (TESTS.indexOf(test) < TESTS.length - 1) {
			console.log('\n⏳ Waiting 3 seconds before next test...');
			await new Promise((resolve) => setTimeout(resolve, 3000));
		}
	}

	// Summary
	console.log(`\n${'='.repeat(60)}`);
	console.log('SUMMARY');
	console.log(`${'='.repeat(60)}\n`);

	results.forEach((result, i) => {
		const status = result.success ? '✅' : '❌';
		console.log(`${status} Test ${i + 1}: ${result.name}`);
		if (result.success) {
			console.log(`   Size: ${result.size} bytes, Duration: ${result.duration}ms`);
		} else if (result.error) {
			console.log(`   Error: ${result.error}`);
		}
	});
}

runTests().catch(console.error);
