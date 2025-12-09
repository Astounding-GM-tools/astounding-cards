/**
 * Shared Image Generation Logic
 * 
 * Common functions used by both single and batch image generation endpoints.
 * Handles:
 * - Prompt optimization
 * - Image generation with Gemini
 * - Embedding generation
 * - R2 upload
 * - Database storage
 */

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '$lib/server/supabase';
import { uploadImage, generateImageFileName } from '$lib/server/r2';
import { generateEmbedding } from '$lib/server/embeddings';
import { PUBLIC_R2_PUBLIC_URL } from '$env/static/public';
import { AI_CONFIGS } from '$lib/ai/config/models';
import {
	IMAGE_GENERATION_CONTEXT,
	PROMPT_OPTIMIZATION_CONTEXT,
	ART_STYLES,
	createPromptOptimizationRequest
} from '$lib/ai/prompts/image-generation';
import { TOKEN_COSTS } from '$lib/config/token-costs';

export interface GenerationResult {
	success: boolean;
	url?: string;
	imageId?: string;
	cost?: number;
	cached?: boolean;
	error?: string;
	optimizedPrompt?: string;
}

export interface CardData {
	id: string;
	title: string;
	subtitle?: string;
	description?: string;
	traits?: any[];
	stats?: any[];
	image?: string;
	imageMetadata?: any;
}

/**
 * Check if an image already exists in the family for the target style.
 * Returns cached result if found, null otherwise.
 */
export async function checkForExistingImage(
	sourceImageId: string | null,
	style: string
): Promise<GenerationResult | null> {
	if (!sourceImageId || !style) {
		return null;
	}

	console.log(
		`🔍 Checking for existing images: sourceId=${sourceImageId}, targetStyle=${style}`
	);

	// First, get the source image to understand the family
	const { data: sourceImage } = await supabaseAdmin
		.from('community_images')
		.select('id, style, source_image_id')
		.eq('id', sourceImageId)
		.single();

	if (!sourceImage) {
		return null;
	}

	// If the source image itself is already the right style, return it!
	if (sourceImage.style === style) {
		console.log('✅ Source image is already the right style, returning it');
		const { data: sourceImageData } = await supabaseAdmin
			.from('community_images')
			.select('id, url')
			.eq('id', sourceImageId)
			.single();

		if (sourceImageData) {
			return {
				success: true,
				url: sourceImageData.url,
				imageId: sourceImageData.id,
				cost: 0,
				cached: true
			};
		}
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
		console.log('✅ Found existing image in family, returning cached result');
		return {
			success: true,
			url: familyImages[0].url,
			imageId: familyImages[0].id,
			cost: 0,
			cached: true
		};
	}

	return null;
}

/**
 * Optimize a card's content into a visual prompt using Gemini.
 */
export async function optimizePrompt(
	ai: GoogleGenAI,
	card: CardData,
	style: string
): Promise<string> {
	const originalPrompt = createPromptOptimizationRequest(
		card.title || 'Untitled',
		card.subtitle || '',
		card.description || '',
		style,
		card.traits || [],
		card.stats || []
	);

	console.log('📝 Optimizing prompt...');
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
	return optimizedPrompt;
}

/**
 * Generate an image using Gemini based on the optimized prompt and style.
 */
export async function generateImage(
	ai: GoogleGenAI,
	optimizedPrompt: string,
	style: string,
	existingImageUrl?: string
): Promise<{ base64Data: string; mimeType: string }> {
	console.log('🎨 Generating image...');

	// Select art style based on theme
	const selectedArtStyle = ART_STYLES[style as keyof typeof ART_STYLES] || ART_STYLES.classic;

	const artStyleInstructions = `${IMAGE_GENERATION_CONTEXT}

Art style: ${selectedArtStyle}

Visual prompt: ${optimizedPrompt}`;

	// Prepare multi-part content with optional existing image reference
	const contentParts: any[] = [{ text: artStyleInstructions }];

	// If there's an existing image, include it as reference for consistency
	if (existingImageUrl) {
		try {
			const imageResponse = await fetch(existingImageUrl);
			const imageBuffer = await imageResponse.arrayBuffer();
			const base64Image = Buffer.from(imageBuffer).toString('base64');
			const mimeType = imageResponse.headers.get('content-type') || 'image/png';

			contentParts.push({
				inlineData: {
					mimeType,
					data: base64Image
				}
			});
			console.log('✅ Using existing image as reference for consistency');
		} catch (err) {
			console.warn('⚠️ Failed to fetch existing image for reference:', err);
			// Continue without reference - not critical
		}
	}

	// Generate the image
	const imageResponse = await ai.models.generateContent({
		model: AI_CONFIGS.IMAGE_GENERATION.model,
		contents: contentParts,
		config: {
			temperature: AI_CONFIGS.IMAGE_GENERATION.temperature
		}
	});

	// Extract image data from response
	const imageData = imageResponse.candidates?.[0]?.content?.parts?.find(
		(part: any) => part.inlineData
	);

	if (!imageData?.inlineData?.data) {
		console.warn('No image data in response. Received:', imageResponse);

		// Check if this looks like a content filter issue
		const hasCandidate = Array.isArray(imageResponse.candidates) && imageResponse.candidates.length > 0;
		const hasContent = imageResponse.candidates?.[0]?.content;

		if (hasCandidate && !hasContent) {
			throw new Error(
				'Content filtered - try adjusting the prompt to avoid copyrighted characters or sensitive content'
			);
		} else if (hasCandidate && hasContent && !imageData) {
			throw new Error(
				'Generation completed but no image data returned - possibly content filtered'
			);
		} else {
			throw new Error('No image data received from Gemini - generation failed');
		}
	}

	const base64Data = imageData.inlineData.data;
	const mimeType = imageData.inlineData.mimeType || 'image/png';

	console.log('✅ Image generated successfully');

	return { base64Data, mimeType };
}

/**
 * Upload image to R2 and save to database.
 * Returns the public URL and image ID.
 *
 * @param optimizedPrompt - The optimized motif description (saved as 'description' field)
 */
export async function uploadAndSaveImage(
	userId: string,
	base64Data: string,
	mimeType: string,
	cardId: string,
	cardTitle: string,
	style: string,
	optimizedPrompt: string,
	sourceImageId: string | null
): Promise<{ url: string; imageId: string }> {
	// Generate embedding (only for originals, not remixes)
	let embedding: number[] | null = null;
	if (!sourceImageId) {
		console.log('🧮 Generating embedding for original image...');
		embedding = await generateEmbedding(optimizedPrompt);
		console.log('✅ Embedding generated');
	}

	// Upload to R2
	const imageBuffer = Buffer.from(base64Data, 'base64');
	const extension = mimeType.split('/')[1] || 'png';
	const fileName = generateImageFileName(cardId, extension);
	const r2Key = await uploadImage(imageBuffer, fileName, mimeType);
	const publicUrl = PUBLIC_R2_PUBLIC_URL ? `${PUBLIC_R2_PUBLIC_URL}/${r2Key}` : r2Key;

	console.log(`✅ Uploaded to R2: ${publicUrl}`);

	// Get the original image ID for family linking (if this is a remix)
	let originalImageIdForSave: string | null = null;
	if (sourceImageId) {
		const { data: sourceImage } = await supabaseAdmin
			.from('community_images')
			.select('id, source_image_id')
			.eq('id', sourceImageId)
			.single();

		if (sourceImage) {
			originalImageIdForSave = sourceImage.source_image_id || sourceImage.id;
		}
	}

	// Save to community_images table
	const { data: imageRecord, error: dbError } = await supabaseAdmin
		.from('community_images')
		.insert({
			user_id: userId,
			url: publicUrl,
			r2_key: r2Key,
			style,
			source_image_id: originalImageIdForSave,
			embedding: embedding ? `[${embedding.join(',')}]` : null,
			card_title: cardTitle,
			description: optimizedPrompt, // Save optimized motif description
			cost_tokens: TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY
		})
		.select()
		.single();

	if (dbError) {
		console.error('❌ Database insert failed:', dbError);
		throw new Error('Failed to save image record');
	}

	console.log(`✅ Image record saved: ${imageRecord.id}`);

	return { url: publicUrl, imageId: imageRecord.id };
}

/**
 * Record a transaction for image generation.
 */
export async function recordTransaction(
	userId: string,
	cost: number,
	description: string
): Promise<void> {
	const { error: txError } = await supabaseAdmin.from('transactions').insert({
		user_id: userId,
		type: 'usage',
		amount_nok: null,
		credits_delta: -cost,
		description,
		status: 'completed'
	});

	if (txError) {
		console.error('⚠️ Transaction recording failed:', txError);
		// Non-critical - image was generated and tokens were deducted
	} else {
		console.log('✅ Transaction recorded');
	}
}
