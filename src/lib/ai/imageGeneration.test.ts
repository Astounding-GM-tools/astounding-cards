/**
 * Image Generation Tests
 * 
 * Tests different configurations for Gemini image generation to find what works best
 * 
 * Run with: npm run test:unit -- imageGeneration.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';

// These tests hit the real Gemini API and cost tokens
// Run with: npx vitest run --config=vitest.api.config.ts src/lib/ai/imageGeneration.test.ts
describe('Image Generation - API Tests', () => {
	let ai: GoogleGenAI;
	let refImageBase64: string;

	beforeAll(() => {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY not found in environment');
		}
		ai = new GoogleGenAI({ apiKey });

		// Load reference image
		const refImagePath = join(process.cwd(), 'static', 'card-layout-reference.png');
		const refImageBuffer = readFileSync(refImagePath);
		refImageBase64 = refImageBuffer.toString('base64');

		console.log('\n📐 Reference image loaded:', {
			size: refImageBuffer.length,
			base64Length: refImageBase64.length,
			first80: refImageBase64.substring(0, 80)
		});
	});

	async function generateImage(config: {
		model: string;
		prompt: string;
		includeReference: boolean;
	}) {
		const contentParts: any[] = [{ text: config.prompt }];

		if (config.includeReference) {
			contentParts.push({
				inlineData: {
					mimeType: 'image/png',
					data: refImageBase64
				}
			});
		}

		const response = await ai.models.generateContent({
			model: config.model,
			contents: contentParts,
			config: { temperature: 0.7 }
		});

		const imageData = response.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		return {
			success: !!imageData?.inlineData?.data,
			imageSize: imageData?.inlineData?.data
				? Buffer.from(imageData.inlineData.data, 'base64').length
				: 0,
			mimeType: imageData?.inlineData?.mimeType
		};
	}

	it('should generate image with stable model (no reference)', async () => {
		const result = await generateImage({
			model: 'gemini-2.5-flash-image',
			prompt: 'PORTRAIT orientation (taller than wide). A fantasy elf ranger with silver hair.',
			includeReference: false
		});

		expect(result.success).toBe(true);
		expect(result.imageSize).toBeGreaterThan(0);
		console.log('  Result:', result);
	}, 30000);

	it('should generate with tiny 50x70 reference image', async () => {
		// Create a minimal 50x70 white PNG in memory
		const width = 50;
		const height = 70;

		// Minimal PNG: signature + IHDR + IDAT (white) + IEND
		const png = Buffer.from([
			// PNG signature
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
			// IHDR chunk
			0x00, 0x00, 0x00, 0x0d, // length
			0x49, 0x48, 0x44, 0x52, // "IHDR"
			0x00, 0x00, 0x00, width, // width
			0x00, 0x00, 0x00, height, // height  
			0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc
			0x00, 0x00, 0x00, 0x00, // CRC placeholder
			// IDAT chunk (minimal white data)
			0x00, 0x00, 0x00, 0x0c,
			0x49, 0x44, 0x41, 0x54,
			0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f, 0x00,
			0x05, 0xfe, 0x02, 0xfe,
			0x00, 0x00, 0x00, 0x00,
			// IEND chunk
			0x00, 0x00, 0x00, 0x00,
			0x49, 0x45, 0x4e, 0x44,
			0xae, 0x42, 0x60, 0x82
		]);

		const tinyBase64 = png.toString('base64');
		console.log('\n  Tiny PNG:', png.length, 'bytes, base64:', tinyBase64.length, 'chars');

		const contentParts: any[] = [
			{ text: 'A fantasy elf ranger with silver hair.' },
			{
				inlineData: {
					mimeType: 'image/png',
					data: tinyBase64
				}
			}
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash-image',
			contents: contentParts,
			config: { temperature: 0.7 }
		});

		const imageData = response.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		const result = {
			success: !!imageData?.inlineData?.data,
			imageSize: imageData?.inlineData?.data
				? Buffer.from(imageData.inlineData.data, 'base64').length
				: 0
		};

		expect(result.success).toBe(true);
		console.log('  Result with tiny reference:', result);
		console.log('  ', result.imageSize > 2000000 ? '✅ Portrait!' : '❌ Square');
	}, 30000);

	it('should generate portrait with aspectRatio config (no reference)', async () => {
		const contentParts: any[] = [
			{ text: 'A fantasy elf ranger with silver hair in a forest.' }
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash-image',
			contents: contentParts,
			config: {
				temperature: 0.7,
			}
		});

		const imageData = response.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		const result = {
			success: !!imageData?.inlineData?.data,
			imageSize: imageData?.inlineData?.data
				? Buffer.from(imageData.inlineData.data, 'base64').length
				: 0
		};

		expect(result.success).toBe(true);
		console.log('  Result with aspectRatio config:', result);
		console.log('  If size ~2.5MB = portrait, if ~1.7MB = square');
	}, 30000);

	it('should generate image with stable model (with reference)', async () => {
		const result = await generateImage({
			model: 'gemini-2.5-flash-image',
			prompt: 'A fantasy elf ranger with silver hair.',
			includeReference: true
		});

		expect(result.success).toBe(true);
		expect(result.imageSize).toBeGreaterThan(0);
		console.log('  Result:', result);
	}, 30000);

	it('should generate with actual tiny 50x70 PNG file', async () => {
		// Load the real tiny PNG file
		const tinyImagePath = join(process.cwd(), 'static', 'card-layout-reference-tiny.png');
		const tinyImageBuffer = readFileSync(tinyImagePath);
		const tinyBase64 = tinyImageBuffer.toString('base64');

		console.log('\n  Real tiny PNG:', tinyImageBuffer.length, 'bytes, base64:', tinyBase64.length, 'chars');

		const result = await generateImage({
			model: 'gemini-2.5-flash-image',
			prompt: 'A fantasy elf ranger with silver hair.',
			includeReference: false // We'll add it manually
		});

		// Generate with tiny reference
		const contentParts: any[] = [
			{ text: 'A fantasy elf ranger with silver hair.' },
			{
				inlineData: {
					mimeType: 'image/png',
					data: tinyBase64
				}
			}
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash-image',
			contents: contentParts,
			config: { temperature: 0.7 }
		});

		const imageData = response.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		const tinyResult = {
			success: !!imageData?.inlineData?.data,
			imageSize: imageData?.inlineData?.data
				? Buffer.from(imageData.inlineData.data, 'base64').length
				: 0
		};

		expect(tinyResult.success).toBe(true);
		console.log('  Tiny reference result:', tinyResult);
		console.log('  ', tinyResult.imageSize > 2000000 ? '✅ Portrait!' : '❌ Square');
	}, 30000);

	it('should generate with NANO 5x7 PNG file', async () => {
		// Load the ultra-tiny nano PNG file
		const nanoImagePath = join(process.cwd(), 'static', 'card-layout-reference-nano.png');
		const nanoImageBuffer = readFileSync(nanoImagePath);
		const nanoBase64 = nanoImageBuffer.toString('base64');

		console.log('\n  NANO PNG (5x7):', nanoImageBuffer.length, 'bytes, base64:', nanoBase64.length, 'chars');
		console.log('\n  FULL BASE64 (copy this for constant):\n  ', nanoBase64);

		// Generate with nano reference
		const contentParts: any[] = [
			{ text: 'A fantasy elf ranger with silver hair.' },
			{
				inlineData: {
					mimeType: 'image/png',
					data: nanoBase64
				}
			}
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash-image',
			contents: contentParts,
			config: { temperature: 0.7 }
		});

		const imageData = response.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		const nanoResult = {
			success: !!imageData?.inlineData?.data,
			imageSize: imageData?.inlineData?.data
				? Buffer.from(imageData.inlineData.data, 'base64').length
				: 0
		};

		expect(nanoResult.success).toBe(true);
		console.log('  NANO result:', nanoResult);
		console.log('  ', nanoResult.imageSize > 2000000 ? '✅ Portrait!' : '❌ Square');
		console.log('  ', 'Savings vs full:', Math.round((1 - (nanoImageBuffer.length / 5380)) * 100) + '%');
	}, 30000);

	it('should compare image sizes (portrait vs square)', async () => {
		// Generate without reference (likely square)
		const square = await generateImage({
			model: 'gemini-2.5-flash-image',
			prompt: 'A fantasy elf ranger.',
			includeReference: false
		});

		// Wait to avoid rate limits
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Generate with reference (hopefully portrait)
		const portrait = await generateImage({
			model: 'gemini-2.5-flash-image',
			prompt: 'A fantasy elf ranger.',
			includeReference: true
		});

		console.log('\n📊 Size comparison:');
		console.log('  Square (no ref):', square.imageSize, 'bytes');
		console.log('  Portrait (with ref):', portrait.imageSize, 'bytes');
		console.log('  Difference:', Math.abs(portrait.imageSize - square.imageSize), 'bytes');

		// Both should succeed
		expect(square.success).toBe(true);
		expect(portrait.success).toBe(true);

		// Log if they're different sizes (might indicate different aspect ratios)
		if (Math.abs(portrait.imageSize - square.imageSize) > 50000) {
			console.log('  ✅ Significant size difference - likely different aspect ratios!');
		} else {
			console.log('  ⚠️  Similar sizes - might both be same aspect ratio');
		}
	}, 60000);
});

describe('Image Generation - Unit Tests', () => {
	it('should validate reference image exists and is valid PNG', () => {
		const refImagePath = join(process.cwd(), 'static', 'card-layout-reference.png');
		const refImageBuffer = readFileSync(refImagePath);

		// Check PNG signature
		expect(refImageBuffer[0]).toBe(0x89);
		expect(refImageBuffer[1]).toBe(0x50);
		expect(refImageBuffer[2]).toBe(0x4e);
		expect(refImageBuffer[3]).toBe(0x47);

		// Check reasonable size
		expect(refImageBuffer.length).toBeGreaterThan(1000);
		expect(refImageBuffer.length).toBeLessThan(10000); // Should be small

		console.log('  ✅ Reference image is valid PNG:', refImageBuffer.length, 'bytes');
	});

	it('should encode reference image to base64 correctly', () => {
		const refImagePath = join(process.cwd(), 'static', 'card-layout-reference.png');
		const refImageBuffer = readFileSync(refImagePath);
		const base64 = refImageBuffer.toString('base64');

		// Base64 should start with PNG header encoded
		expect(base64.startsWith('iVBORw0KGgo')).toBe(true);

		// Base64 length should be ~1.33x binary size
		const expectedLength = Math.ceil((refImageBuffer.length * 4) / 3);
		expect(Math.abs(base64.length - expectedLength)).toBeLessThan(10);

		console.log('  ✅ Base64 encoding valid:', {
			binarySize: refImageBuffer.length,
			base64Length: base64.length,
			ratio: (base64.length / refImageBuffer.length).toFixed(2)
		});
	});
});
