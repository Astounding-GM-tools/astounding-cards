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
import { GEMINI_API_KEY, PUBLIC_R2_PUBLIC_URL } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '$lib/server/supabase';
import { uploadImage, generateImageFileName } from '$lib/server/r2';
import { getUserFromSession } from '$lib/server/auth';
import { TOKEN_COSTS } from '$lib/config/token-costs';
import { AI_CONFIGS } from '$lib/ai/config/models';
import {
	IMAGE_GENERATION_CONTEXT,
	PROMPT_OPTIMIZATION_CONTEXT,
	ART_STYLES,
	createPromptOptimizationRequest
} from '$lib/ai/prompts/image-generation';

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
			if (!card.imageMetadata?.imageId) {
				cardsToGenerate.push(card);
				continue;
			}

			const sourceImageId = card.imageMetadata.imageId;

			// Get the source image to understand the family
			const { data: sourceImage } = await supabaseAdmin
				.from('community_images')
				.select('id, style, source_image_id, url')
				.eq('id', sourceImageId)
				.single();

			if (!sourceImage) {
				// Source image not found, needs generation
				cardsToGenerate.push(card);
				continue;
			}

			// If the source image itself is already the right style, it's cached
			if (sourceImage.style === style) {
				console.log(`✅ Card ${card.id} already has image in style ${style} (cached)`);
				cachedResults.push({
					cardId: card.id,
					success: true,
					url: sourceImage.url,
					imageId: sourceImage.id,
					cached: true,
					cost: 0
				});
				continue;
			}

			// Find the original (root) image in this family
			const originalImageId = sourceImage.source_image_id || sourceImage.id;

			// Look for any image in the family with the target style
			const { data: familyImages } = await supabaseAdmin
				.from('community_images')
				.select('id, url, style')
				.or(`id.eq.${originalImageId},source_image_id.eq.${originalImageId}`)
				.eq('style', style);

			if (familyImages && familyImages.length > 0) {
				// Found existing image in target style - cached!
				console.log(`✅ Card ${card.id} has existing variant in style ${style} (cached)`);
				cachedResults.push({
					cardId: card.id,
					success: true,
					url: familyImages[0].url,
					imageId: familyImages[0].id,
					cached: true,
					cost: 0
				});
			} else {
				// No existing image in target style, needs generation
				// Store the originalImageId for linking the new variant
				cardsToGenerate.push({ ...card, _originalImageId: originalImageId });
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

		// 8. Generate images with staggering
		const results: any[] = [];
		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const selectedArtStyle = ART_STYLES[style as keyof typeof ART_STYLES] || ART_STYLES.classic;

		for (let i = 0; i < cardsToGenerate.length; i++) {
			const card = cardsToGenerate[i];

			try {
				console.log(
					`🎨 Generating image ${i + 1}/${cardsToGenerate.length} for card "${card.title}"`
				);

				// Step 1: Optimize the card content into a visual prompt
				const originalPrompt = createPromptOptimizationRequest(
					card.title || 'Untitled',
					card.subtitle || '',
					card.description || '',
					style,
					card.traits || [],
					card.stats || []
				);

				const optimizationResponse = await ai.models.generateContent({
					model: AI_CONFIGS.TEXT_GENERATION.model,
					contents: originalPrompt,
					config: {
						systemInstruction: PROMPT_OPTIMIZATION_CONTEXT,
						temperature: AI_CONFIGS.TEXT_GENERATION.temperature
					}
				});

				const optimizedPrompt =
					optimizationResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
				if (!optimizedPrompt) {
					throw new Error('Failed to optimize prompt');
				}

				// Step 2: Generate the image
				const artStyleInstructions = `${IMAGE_GENERATION_CONTEXT}

Art style: ${selectedArtStyle}

Visual prompt: ${optimizedPrompt}`;

				// Add nano reference image for portrait aspect ratio (5x7, 1KB)
				const contentParts: any[] = [
					{ text: artStyleInstructions },
					{
						inlineData: {
							mimeType: 'image/png',
							data: REFERENCE_IMAGE_BASE64
						}
					}
				];

				const imageResponse = await ai.models.generateContent({
					model: AI_CONFIGS.IMAGE_GENERATION.model,
					contents: contentParts,
					config: {
						temperature: AI_CONFIGS.IMAGE_GENERATION.temperature
					}
				});

				// Extract image data
				const imageData = imageResponse.candidates?.[0]?.content?.parts?.find(
					(part: any) => part.inlineData
				);

				if (!imageData?.inlineData?.data) {
					throw new Error('No image data received from Gemini');
				}

				const base64Data = imageData.inlineData.data;
				const mimeType = imageData.inlineData.mimeType || 'image/png';

				// Step 3: Upload to R2
				const imageBuffer = Buffer.from(base64Data, 'base64');
				const extension = mimeType.split('/')[1] || 'png';
				const fileName = generateImageFileName(card.id || 'unknown', extension);
				const r2Key = await uploadImage(imageBuffer, fileName, mimeType);
				const publicUrl = PUBLIC_R2_PUBLIC_URL ? `${PUBLIC_R2_PUBLIC_URL}/${r2Key}` : r2Key;

				// Step 4: Save to community_images table
				const { data: imageRecord, error: dbError } = await supabaseAdmin
					.from('community_images')
					.insert({
						user_id: userId,
						url: publicUrl,
						r2_key: r2Key,
						style,
						source_image_id: card._originalImageId || null,
						embedding: null,
						card_title: card.title,
						cost_tokens: TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY
					})
					.select()
					.single();

				if (dbError) {
					throw new Error(`Database insert failed: ${dbError.message}`);
				}

				console.log(`✅ Generated image for "${card.title}"`);

				results.push({
					cardId: card.id,
					success: true,
					url: publicUrl,
					imageId: imageRecord.id,
					cached: false,
					cost: TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY
				});

				// Stagger requests (except for the last one)
				if (i < cardsToGenerate.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY));
				}
			} catch (err) {
				console.error(`❌ Failed to generate image for card "${card.title}":`, err);
				results.push({
					cardId: card.id,
					success: false,
					error: err instanceof Error ? err.message : 'Unknown error',
					cached: false
				});
			}
		}

		// Add cached results
		results.push(...cachedResults);

		// 9. Record transaction
		const generatedCount = results.filter((r) => r.success && !r.cached).length;
		const failedCount = results.filter((r) => !r.success).length;

		const { error: txError } = await supabaseAdmin.from('transactions').insert({
			user_id: userId,
			type: 'usage',
			amount_nok: null,
			credits_delta: -totalCost,
			description: `Batch image generation: ${generatedCount} generated, ${cachedResults.length} cached, ${failedCount} failed (style: ${style})`,
			status: 'completed'
		});

		if (txError) {
			console.error('⚠️ Transaction recording failed:', txError);
		}

		console.log('✅ Transaction recorded');
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
