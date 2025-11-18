/**
 * AI Image Generation API
 *
 * Server-side image generation with complete token economy integration:
 * - Authentication required
 * - Token deduction (100 tokens = 1 NOK)
 * - R2 storage upload
 * - Database tracking in community_images
 * - Transaction recording
 * - Remix detection (cached results)
 * - Embedding generation for semantic search
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY, PUBLIC_R2_PUBLIC_URL } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '$lib/server/supabase';
import { uploadImage, generateImageFileName } from '$lib/server/r2';
import { generateEmbedding } from '$lib/server/embeddings';
import { getUserFromSession } from '$lib/server/auth';
import { TOKEN_COSTS } from '$lib/config/token-costs';
import { AI_CONFIGS } from '$lib/ai/config/models';
import {
	IMAGE_GENERATION_CONTEXT,
	PROMPT_OPTIMIZATION_CONTEXT,
	ART_STYLES,
	createPromptOptimizationRequest
} from '$lib/ai/prompts/image-generation';
import { REFERENCE_IMAGE_BASE64 } from '$lib/ai/assets/referenceImage';

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
		const {
			card,
			deckTheme = 'classic',
			existingImageUrl,
			sourceImageId = null
		} = await request.json();

		// Validate inputs
		if (!card || typeof card !== 'object') {
			return error(400, 'Card data is required');
		}

		if (!card.title) {
			return error(400, 'Card must have a title');
		}

		const style = deckTheme; // Using deckTheme as style

		// Track the original image ID for proper family linking
		let originalImageIdForSave: string | null = null;

		// 3. Check for existing remix (if this is a style variant)
		if (sourceImageId && style) {
			console.log(
				`🔍 Checking for existing images: sourceId=${sourceImageId}, targetStyle=${style}`
			);

			// First, get the source image to understand the family
			const { data: sourceImage } = await supabaseAdmin
				.from('community_images')
				.select('id, style, source_image_id')
				.eq('id', sourceImageId)
				.single();

			if (sourceImage) {
				// If the source image itself is already the right style, return it!
				if (sourceImage.style === style) {
					console.log('✅ Source image is already the right style, returning it');
					const { data: sourceImageData } = await supabaseAdmin
						.from('community_images')
						.select('id, url')
						.eq('id', sourceImageId)
						.single();

					if (sourceImageData) {
						return json({
							success: true,
							url: sourceImageData.url,
							imageId: sourceImageData.id,
							cost: 0,
							cached: true
						});
					}
				}

				// Find the original (root) image in this family
				const originalImageId = sourceImage.source_image_id || sourceImage.id;
				originalImageIdForSave = originalImageId;

				// Look for any image in the family with the target style
				// This includes checking the original and all its remixes
				const { data: familyImages } = await supabaseAdmin
					.from('community_images')
					.select('id, url, style')
					.or(`id.eq.${originalImageId},source_image_id.eq.${originalImageId}`)
					.eq('style', style);

				if (familyImages && familyImages.length > 0) {
					console.log('✅ Found existing image in family, returning cached result');
					return json({
						success: true,
						url: familyImages[0].url,
						imageId: familyImages[0].id,
						cost: 0,
						cached: true
					});
				}

				// No existing image found, will need to generate
				// But make sure we store the original ID for proper family linking
				console.log(
					`🎨 No existing ${style} image in family, will generate with originalId=${originalImageId}`
				);
			}
		}

		// 4. Check user balance
		const cost = TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY;
		const { data: userData } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (!userData || userData.credits < cost) {
			return error(402, 'Insufficient tokens');
		}

		console.log(`🎨 Server-side image generation for "${card.title}" (style: ${style})`);

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

		// Step 1: Optimize the card content into a visual prompt
		const originalPrompt = createPromptOptimizationRequest(
			card.title || 'Untitled',
			card.subtitle || '',
			card.description || '',
			deckTheme,
			card.traits || [],
			card.stats || []
		);

		console.log('📝 Step 1: Optimizing prompt...');
		const optimizationResponse = await ai.models.generateContent({
			model: AI_CONFIGS.TEXT_GENERATION.model,
			contents: originalPrompt,
			config: {
				systemInstruction: PROMPT_OPTIMIZATION_CONTEXT,
				temperature: AI_CONFIGS.TEXT_GENERATION.temperature
			}
		});

		const optimizedPrompt = optimizationResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
		if (!optimizedPrompt) {
			throw new Error('Failed to optimize prompt - no response from Gemini');
		}

		console.log(`✅ Optimized prompt: "${optimizedPrompt.substring(0, 100)}..."`);

		// Step 2: Generate the image with multi-part request
		console.log('🎨 Step 2: Generating image...');

		// Select art style based on theme
		const selectedArtStyle = ART_STYLES[deckTheme as keyof typeof ART_STYLES] || ART_STYLES.classic;

		const artStyleInstructions = `${IMAGE_GENERATION_CONTEXT}

IMPORTANT: Generate in PORTRAIT orientation (taller than wide), approximately 2:3 aspect ratio.

Art style: ${selectedArtStyle}

Visual prompt: ${optimizedPrompt}`;

		// Prepare multi-part content (matches client-side order)
		const contentParts: any[] = [{ text: artStyleInstructions }];

		// Add user's existing card image if available (for style reference)
		if (existingImageUrl) {
			try {
				console.log("📷 Fetching user's existing image for style reference...");
				const imageResponse = await fetch(existingImageUrl);
				if (imageResponse.ok) {
					const imageBuffer = await imageResponse.arrayBuffer();
					const imageBase64 = Buffer.from(imageBuffer).toString('base64');
					const mimeType = imageResponse.headers.get('content-type') || 'image/png';

					contentParts.push({
						inlineData: {
							mimeType,
							data: imageBase64
						}
					});
					console.log("✅ Added user's existing image for style reference");
				} else {
					console.warn('⚠️ Failed to fetch existing image, continuing without it');
				}
			} catch (err) {
				console.warn('⚠️ Error fetching existing image:', err);
				// Continue without the image - not critical
			}
		}

		// Add pre-encoded nano reference image for portrait aspect ratio
		// 5x7 pixels, 1KB, costs ~$0.0002 per generation
		contentParts.push({
			inlineData: {
				mimeType: 'image/png',
				data: REFERENCE_IMAGE_BASE64
			}
		});
		console.log('📐 Added nano reference image (5×7, 1KB, 81% smaller!)');

		// Generate the image (keeping config for future compatibility)
		const generationConfig = {
			temperature: AI_CONFIGS.IMAGE_GENERATION.temperature
		};

		const imageResponse = await ai.models.generateContent({
			model: AI_CONFIGS.IMAGE_GENERATION.model,
			contents: contentParts,
			config: generationConfig
		});

		// Extract image data from response (matches client-side format)
		const imageData = imageResponse.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		if (!imageData?.inlineData?.data) {
			console.warn('No image data in response. Received:', imageResponse);

			// Check if this looks like a content filter issue
			const hasCandidate = imageResponse.candidates?.length > 0;
			const hasContent = imageResponse.candidates?.[0]?.content;

			if (hasCandidate && !hasContent) {
				return error(
					400,
					'Content filtered - try adjusting the prompt to avoid copyrighted characters or sensitive content'
				);
			} else if (hasCandidate && hasContent && !imageData) {
				return error(
					400,
					'Generation completed but no image data returned - possibly content filtered'
				);
			} else {
				return error(500, 'No image data received from Gemini - generation failed');
			}
		}

		const base64Data = imageData.inlineData.data;
		const mimeType = imageData.inlineData.mimeType || 'image/png';

		console.log('✅ Image generated successfully');

		// 7. Generate embedding (only for originals, not remixes)
		// TODO: Fix embedding API format - temporarily disabled
		let embedding: number[] | null = null;
		// if (!sourceImageId) {
		// 	console.log('🧮 Generating embedding for original image...');
		// 	embedding = await generateEmbedding(optimizedPrompt);
		// 	console.log('✅ Embedding generated');
		// }
		console.log('⚠️ Embedding generation temporarily disabled - will add back later');

		// 8. Upload to R2
		const imageBuffer = Buffer.from(base64Data, 'base64');
		const extension = mimeType.split('/')[1] || 'png';
		const fileName = generateImageFileName(card.id || 'unknown', extension);
		const r2Key = await uploadImage(imageBuffer, fileName, mimeType);
		const publicUrl = PUBLIC_R2_PUBLIC_URL ? `${PUBLIC_R2_PUBLIC_URL}/${r2Key}` : r2Key;

		console.log(`✅ Uploaded to R2: ${publicUrl}`);

		// 9. Deduct tokens atomically
		const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc('deduct_tokens', {
			p_user_id: userId,
			p_amount: cost
		});

		if (deductError || !deductSuccess) {
			console.error('❌ Token deduction failed:', deductError);
			// TODO: Consider cleanup of uploaded image
			return error(402, 'Failed to deduct tokens - possibly insufficient balance');
		}

		console.log(`✅ Deducted ${cost} tokens from user ${userId}`);

		// 10. Save to community_images table
		const { data: imageRecord, error: dbError } = await supabaseAdmin
			.from('community_images')
			.insert({
				user_id: userId,
				url: publicUrl,
				r2_key: r2Key,
				style,
				source_image_id: originalImageIdForSave,
				embedding: embedding ? `[${embedding.join(',')}]` : null,
				card_title: card.title,
				cost_tokens: cost
			})
			.select()
			.single();

		if (dbError) {
			console.error('❌ Database insert failed:', dbError);
			// Tokens already deducted - partial failure
			// TODO: Consider refund or retry logic
			return error(500, 'Failed to save image record');
		}

		console.log(`✅ Image record saved: ${imageRecord.id}`);

		// 11. Record transaction
		const { error: txError } = await supabaseAdmin.from('transactions').insert({
			user_id: userId,
			type: 'usage',
			amount_nok: null,
			credits_delta: -cost,
			description: `AI image generation: ${card.title}`,
			status: 'completed'
		});

		if (txError) {
			console.error('⚠️ Transaction recording failed:', txError);
			// Non-critical - image was generated and tokens were deducted
		}

		console.log('✅ Transaction recorded');

		// 12. Return success with R2 URL
		return json({
			success: true,
			url: publicUrl,
			imageId: imageRecord.id,
			cost,
			cached: false,
			optimizedPrompt // For debugging/transparency
		});
	} catch (err) {
		console.error('Image generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate image');
	}
};
