/**
 * Featured Decks API
 *
 * GET /api/decks/featured
 *
 * Returns the most liked decks for display on the front page.
 * Public endpoint - no authentication required.
 *
 * Query parameters:
 * - limit: number - number of decks to return (default 1, max 20)
 * - exclude: string - comma-separated deck IDs to exclude (e.g., for excluding #1 deck)
 */

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters
		const limitParam = url.searchParams.get('limit');
		const excludeParam = url.searchParams.get('exclude');

		// Validate and parse limit
		const limit = Math.min(parseInt(limitParam || '1', 10), 20);

		// Parse excluded IDs
		const excludedIds = excludeParam
			? excludeParam
					.split(',')
					.map((id) => id.trim())
					.filter(Boolean)
			: [];

		// Build query - get most liked decks
		let query = supabaseAdmin
			.from('published_decks')
			.select('*')
			.eq('visibility', 'public')
			.order('like_count', { ascending: false })
			.order('created_at', { ascending: false }); // Secondary sort by newest

		// Exclude specific deck IDs if provided
		if (excludedIds.length > 0) {
			query = query.not('id', 'in', `(${excludedIds.join(',')})`);
		}

		// Apply limit
		query = query.limit(limit);

		const { data: decks, error: queryError } = await query;

		if (queryError) {
			console.error('Featured decks query error:', queryError);
			return json({ error: 'Failed to fetch featured decks' }, { status: 500 });
		}

		// If no decks found, return empty array
		if (!decks || decks.length === 0) {
			return json({
				success: true,
				decks: [],
				message: 'No decks found'
			});
		}

		// Format response with full deck data including cards
		const formattedDecks = decks.map((deck) => {
			// Extract first card image (if any card has an image)
			let firstCardImage: string | null = null;
			if (Array.isArray(deck.cards) && deck.cards.length > 0) {
				const cardWithImage = deck.cards.find((card: any) => card.image);
				if (cardWithImage) {
					firstCardImage = cardWithImage.image;
				}
			}

			return {
				id: deck.id,
				slug: deck.slug,
				title: deck.title,
				description: deck.description,
				theme: deck.theme,
				imageStyle: deck.image_style,
				layout: deck.layout,
				cards: deck.cards, // Include full cards for hero display
				tags: deck.tags,
				cardCount: Array.isArray(deck.cards) ? deck.cards.length : 0,
				firstCardImage,
				is_featured: deck.is_featured,
				is_curated: deck.is_curated,
				view_count: deck.view_count,
				import_count: deck.import_count || 0,
				like_count: deck.like_count || 0,
				creator_name: deck.creator_name,
				created_at: deck.created_at,
				updated_at: deck.updated_at
			};
		});

		return json({
			success: true,
			decks: formattedDecks
		});
	} catch (err) {
		console.error('Featured decks error:', err);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
