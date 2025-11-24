/**
 * Batch Image Generation API
 *
 * Server-side batch image generation with token economy:
 * - Authentication required
 * - Remix detection per card (only generate if needed)
 * - Token deduction based on actual generations
 * - Staggered requests (2s delay) to avoid rate limiting
 * - Transaction recording
 * - Returns results with cached/generated flags
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import { TOKEN_COSTS } from '$lib/config/token-costs';
import {
	checkForExistingImage,
	optimizePrompt,
	generateImage,
	uploadAndSaveImage,
	recordTransaction,
	type CardData
} from '$lib/server/image-generation';

const STAGGER_DELAY = 2000; // 2 seconds between generation requests

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// Validate API key is configured
		if (!GEMINI_API_KEY) {
			return error(500, 'Server AI configuration missing');
		}

		// 2. Parse request body
		const { cards, style } = await request.json();

		// 3. Validate inputs
		if (!Array.isArray(cards) || cards.length === 0) {
			return error(400, 'Cards array is required');
		}

		if (!style || typeof style !== 'string') {
			return error(400, 'Style is required');
		}

		console.log(`🚀 Batch image generation: ${cards.length} cards in style: ${style}`);

	// 4. Check which cards already have images in target style (remix detection)
	const cardsToGenerate: any[] = [];
	const cachedResults: any[] = [];

	for (const card of cards) {
		// If card doesn't have an image, it definitely needs generation
		const sourceImageId = card.imageMetadata?.imageId;
		if (!sourceImageId) {
			cardsToGenerate.push(card);
			continue;
		}

		// Check for existing image in family
		const cachedResult = await checkForExistingImage(sourceImageId, style);
		if (cachedResult) {
			console.log(`✅ Card ${card.id} already has image in style ${style} (cached)`);
			cachedResults.push({
				cardId: card.id,
				...cachedResult
			});
		} else {
			// No existing image in target style, needs generation
			cardsToGenerate.push(card);
		}
	}

		// 5. Calculate total cost (only for cards that need generation)
		const generationCount = cardsToGenerate.length;
		const totalCost = generationCount * TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY;

		console.log(
			`💰 Cost calculation: ${generationCount} to generate, ${cachedResults.length} cached = ${totalCost} tokens`
		);

		// If everything is cached, return early
		if (generationCount === 0) {
			console.log('✅ All images cached, no generation needed');
			return json({
				success: true,
				results: cachedResults,
				totalCost: 0,
				summary: {
					total: cards.length,
					generated: 0,
					cached: cachedResults.length,
					failed: 0
				}
			});
		}

		// 6. Check user balance
		const { data: userData } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (!userData || userData.credits < totalCost) {
			return error(402, 'Insufficient tokens');
		}

		// 7. Deduct tokens atomically (upfront for all generations)
		const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc('deduct_tokens', {
			p_user_id: userId,
			p_amount: totalCost
		});

		if (deductError || !deductSuccess) {
			console.error('❌ Token deduction failed:', deductError);
			return error(402, 'Failed to deduct tokens - possibly insufficient balance');
		}

		console.log(`✅ Deducted ${totalCost} tokens from user ${userId}`);

	// 8. Generate images with parallel processing and staggered starts
	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

	// Create generation function for a single card
	const generateCardImage = async (card: CardData, index: number) => {
		try {
			console.log(
				`🎨 Generating image ${index + 1}/${cardsToGenerate.length} for card "${card.title}"`
			);

			// Step 1: Optimize prompt
			const optimizedPrompt = await optimizePrompt(ai, card, style);

			// Step 2: Generate image
			const { base64Data, mimeType } = await generateImage(ai, optimizedPrompt, style, card.image);

			// Step 3: Upload to R2 and save to database
			const sourceImageId = card.imageMetadata?.imageId || null;
			const { url: publicUrl, imageId } = await uploadAndSaveImage(
				userId,
				base64Data,
				mimeType,
				card.id,
				card.title,
				style,
				optimizedPrompt,
				sourceImageId
			);

			console.log(`✅ Generated image for "${card.title}"`);

			return {
				cardId: card.id,
				success: true,
				url: publicUrl,
				imageId,
				cached: false,
				cost: TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY
			};
		} catch (err) {
			console.error(`❌ Failed to generate image for card "${card.title}":`, err);
			return {
				cardId: card.id,
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error',
				cached: false
			};
		}
	};

		// Start all generations with staggered delays (2 seconds between starts)
		const generationPromises = cardsToGenerate.map((card, index) => {
			return new Promise((resolve) => {
				setTimeout(async () => {
					const result = await generateCardImage(card, index);
					resolve(result);
				}, index * STAGGER_DELAY);
			});
		});

		// Wait for all generations to complete
		const results = await Promise.all(generationPromises);

		// Add cached results
		results.push(...cachedResults);

	// 9. Record transaction
	const generatedCount = results.filter((r) => r.success && !r.cached).length;
	const failedCount = results.filter((r) => !r.success).length;

	await recordTransaction(
		userId,
		totalCost,
		`Batch image generation: ${generatedCount} generated, ${cachedResults.length} cached, ${failedCount} failed (style: ${style})`
	);

	console.log(
		`📊 Batch complete: ${generatedCount} generated, ${cachedResults.length} cached, ${failedCount} failed`
	);

		// 10. Return results
		return json({
			success: true,
			results,
			totalCost,
			summary: {
				total: cards.length,
				generated: generatedCount,
				cached: cachedResults.length,
				failed: failedCount
			}
		});
	} catch (err) {
		console.error('Batch image generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate images');
	}
};
