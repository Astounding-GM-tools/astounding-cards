/**
 * AI Deck Generation API
 *
 * Server-side deck generation using Gemini AI with token economy:
 * - Authentication required
 * - Token deduction (10 tokens per card)
 * - Transaction recording
 * - Returns deck JSON for client-side IndexedDB storage
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { generateDeckFromPrompt } from '$lib/ai/generators/gemini';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import { TOKEN_COSTS } from '$lib/config/token-costs';

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
		const { prompt, cardCount = 10 } = await request.json();

		// 3. Validate inputs
		if (!prompt || typeof prompt !== 'string') {
			return error(400, 'Prompt is required and must be a string');
		}

		if (typeof cardCount !== 'number' || cardCount < 3 || cardCount > 52) {
			return error(400, 'Card count must be between 3 and 52');
		}

		// 4. Calculate cost and check user balance
		const cost = cardCount * TOKEN_COSTS.DECK_GENERATION_PER_CARD;
		const { data: userData } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (!userData || userData.credits < cost) {
			return error(402, 'Insufficient tokens');
		}

			`🚀 Server-side deck generation: "${prompt.substring(0, 50)}..." (${cardCount} cards, ${cost} tokens)`
		);

		// 5. Generate deck using existing logic
		const result = await generateDeckFromPrompt(GEMINI_API_KEY, prompt, cardCount);

		if (!result.success || !result.deck) {
			return error(500, result.error || 'Failed to generate deck');
		}


		// 6. Deduct tokens atomically
		const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc('deduct_tokens', {
			p_user_id: userId,
			p_amount: cost
		});

		if (deductError || !deductSuccess) {
			console.error('❌ Token deduction failed:', deductError);
			return error(402, 'Failed to deduct tokens - possibly insufficient balance');
		}


		// 7. Record transaction
		const { error: txError } = await supabaseAdmin.from('transactions').insert({
			user_id: userId,
			type: 'usage',
			amount_nok: null,
			credits_delta: -cost,
			description: `AI deck generation: ${result.deck.deck.meta.name} (${result.deck.deck.cards.length} cards)`,
			status: 'completed'
		});

		if (txError) {
			console.error('⚠️ Transaction recording failed:', txError);
			// Non-critical - deck was generated and tokens were deducted
		}


		// 8. Return success with deck data
		return json({
			success: true,
			deck: result.deck,
			cardCount: result.deck.deck.cards.length,
			cost
		});
	} catch (err) {
		console.error('Deck generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate deck');
	}
};
