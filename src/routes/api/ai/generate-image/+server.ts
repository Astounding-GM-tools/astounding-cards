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
	recordTransaction
} from '$lib/server/image-generation';

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

	// 3. Check for existing remix (if this is a style variant)
	const cachedResult = await checkForExistingImage(sourceImageId, style);
	if (cachedResult) {
		return json(cachedResult);
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


	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

	// Step 1: Optimize prompt
	const optimizedPrompt = await optimizePrompt(ai, card, style);

	// Step 2: Generate image
	const { base64Data, mimeType } = await generateImage(ai, optimizedPrompt, style, existingImageUrl);

	// 7. Deduct tokens atomically
		const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc('deduct_tokens', {
			p_user_id: userId,
			p_amount: cost
		});

		if (deductError || !deductSuccess) {
			console.error('❌ Token deduction failed:', deductError);
			// TODO: Consider cleanup of uploaded image
			return error(402, 'Failed to deduct tokens - possibly insufficient balance');
		}


	// 8. Upload to R2 and save to database
	const { url: publicUrl, imageId } = await uploadAndSaveImage(
		userId,
		base64Data,
		mimeType,
		card.id || 'unknown',
		card.title,
		style,
		optimizedPrompt,
		sourceImageId
	);

	// 9. Record transaction
	await recordTransaction(userId, cost, `AI image generation: ${card.title}`);

	// 10. Return success
	return json({
		success: true,
		url: publicUrl,
		imageId,
		cost,
		cached: false,
		optimizedPrompt // For debugging/transparency
	});
	} catch (err) {
		console.error('Image generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate image');
	}
};
