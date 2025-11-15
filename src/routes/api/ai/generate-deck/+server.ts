/**
 * AI Deck Generation API
 *
 * Server-side deck generation using Gemini AI
 * Replaces client-side BYOK implementation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { generateDeckFromPrompt } from '$lib/ai/generators/gemini';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate API key is configured
		if (!GEMINI_API_KEY) {
			return error(500, 'Server AI configuration missing');
		}

		// Parse request body
		const { theme, cardCount = 8 } = await request.json();

		// Validate inputs
		if (!theme || typeof theme !== 'string') {
			return error(400, 'Theme is required and must be a string');
		}

		if (typeof cardCount !== 'number' || cardCount < 1 || cardCount > 20) {
			return error(400, 'Card count must be between 1 and 20');
		}

		console.log(`🚀 Server-side deck generation: "${theme}" (${cardCount} cards)`);

		// Generate deck using existing logic
		const result = await generateDeckFromPrompt(GEMINI_API_KEY, theme, cardCount);

		if (result.success && result.deck) {
			return json({
				success: true,
				deck: result.deck,
				cardCount: result.deck.deck.cards.length
			});
		} else {
			return error(500, result.error || 'Failed to generate deck');
		}
	} catch (err) {
		console.error('Deck generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate deck');
	}
};
