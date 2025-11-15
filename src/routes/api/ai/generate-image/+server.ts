/**
 * AI Image Generation API
 *
 * Server-side image generation using Gemini AI with 2-step optimization process
 * Matches the working client-side implementation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { AI_CONFIGS } from '$lib/ai/config/models';
import {
	IMAGE_GENERATION_CONTEXT,
	PROMPT_OPTIMIZATION_CONTEXT,
	ART_STYLES,
	createPromptOptimizationRequest
} from '$lib/ai/prompts/image-generation';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load static layout reference PNG and convert to base64
const LAYOUT_REFERENCE_BASE64 = readFileSync(
	join(__dirname, '../../../../../static/card-layout-reference.png')
).toString('base64');

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate API key is configured
		if (!GEMINI_API_KEY) {
			return error(500, 'Server AI configuration missing');
		}

		// Parse request body
		const { card, deckTheme = 'classic', existingImageUrl } = await request.json();

		// Validate inputs
		if (!card || typeof card !== 'object') {
			return error(400, 'Card data is required');
		}

		if (!card.title) {
			return error(400, 'Card must have a title');
		}

		console.log(`🎨 Server-side image generation for "${card.title}" (theme: ${deckTheme})`);

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

Art style: ${selectedArtStyle}

Visual prompt: ${optimizedPrompt}`;

		// Prepare multi-part content (matches client-side order)
		const contentParts: any[] = [{ text: artStyleInstructions }];

		// Add user's existing card image if available (for style reference)
		if (existingImageUrl) {
			try {
				console.log('📷 Fetching user\'s existing image for style reference...');
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
					console.log('✅ Added user\'s existing image for style reference');
				} else {
					console.warn('⚠️ Failed to fetch existing image, continuing without it');
				}
			} catch (err) {
				console.warn('⚠️ Error fetching existing image:', err);
				// Continue without the image - not critical
			}
		}

		// Add card layout reference (always included, always last)
		contentParts.push({
			inlineData: {
				mimeType: 'image/png',
				data: LAYOUT_REFERENCE_BASE64
			}
		});

		console.log('📐 Added layout reference for composition guidance');

		// Generate the image with multi-part context
		const imageResponse = await ai.models.generateContent({
			model: AI_CONFIGS.IMAGE_GENERATION.model,
			contents: contentParts,
			config: {
				temperature: AI_CONFIGS.IMAGE_GENERATION.temperature
			}
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

		// Return base64 data directly (client will convert to blob)
		const base64Data = imageData.inlineData.data;
		const mimeType = imageData.inlineData.mimeType || 'image/png';

		console.log(`✅ Image generated successfully for "${card.title}"`);

		return json({
			success: true,
			imageData: base64Data,
			mimeType,
			optimizedPrompt // Include for debugging/transparency
		});
	} catch (err) {
		console.error('Image generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate image');
	}
};
