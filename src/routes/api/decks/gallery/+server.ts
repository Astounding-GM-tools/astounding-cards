/**
 * Deck Gallery API
 *
 * GET /api/decks/gallery
 *
 * Lists published decks with filtering, search, and pagination.
 * Public endpoint - no authentication required.
 *
 * Query parameters:
 * - search: string - search in title/description
 * - tags: string[] - filter by tags (comma-separated)
 * - theme: string - filter by theme
 * - sort: 'recent' | 'popular' | 'imported' - sort order
 * - limit: number - items per page (default 20, max 100)
 * - offset: number - pagination offset (default 0)
 */

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters
		const search = url.searchParams.get('search');
		const tagsParam = url.searchParams.get('tags');
		const theme = url.searchParams.get('theme');
		const sort = url.searchParams.get('sort') || 'recent';
		const limitParam = url.searchParams.get('limit');
		const offsetParam = url.searchParams.get('offset');

		// Validate and parse limit/offset
		const limit = Math.min(parseInt(limitParam || '20', 10), 100);
		const offset = Math.max(parseInt(offsetParam || '0', 10), 0);

		// Parse tags
		const tags = tagsParam
			? tagsParam
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [];

		// Build query
		let query = supabaseAdmin
			.from('published_decks')
			.select('*', { count: 'exact' })
			.eq('visibility', 'public'); // Only public decks

		// Apply filters
		if (search) {
			// Search in title and description
			query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
		}

		if (tags.length > 0) {
			// Filter by tags (deck must have at least one of the specified tags)
			query = query.overlaps('tags', tags);
		}

		if (theme) {
			query = query.eq('theme', theme);
		}

		// Apply sorting
		switch (sort) {
			case 'popular':
				query = query.order('view_count', { ascending: false });
				break;
			case 'imported':
				query = query.order('import_count', { ascending: false });
				break;
			case 'recent':
			default:
				query = query.order('created_at', { ascending: false });
				break;
		}

		// Apply pagination
		query = query.range(offset, offset + limit - 1);

		const { data: decks, error: queryError, count } = await query;

		if (queryError) {
			console.error('Gallery query error:', queryError);
			return json({ error: 'Failed to fetch decks' }, { status: 500 });
		}

		// Format response with card count and first card image
		const formattedDecks = (decks || []).map((deck) => {
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
				tags: deck.tags,
				cardCount: Array.isArray(deck.cards) ? deck.cards.length : 0,
				firstCardImage, // Add first card image for gallery display
				is_featured: deck.is_featured,
				is_curated: deck.is_curated,
				view_count: deck.view_count,
				import_count: deck.import_count || 0,
				like_count: deck.like_count || 0, // Add like count
				creator_name: deck.creator_name, // Add creator name
				created_at: deck.created_at,
				updated_at: deck.updated_at
			};
		});

		return json(
			{
				success: true,
				decks: formattedDecks,
				pagination: {
					total: count || 0,
					limit,
					offset,
					hasMore: (count || 0) > offset + limit
				}
			},
			{
				headers: {
					// Cache for 2 minutes on client, 30 minutes on CDN, serve stale for 24 hours while revalidating
					'Cache-Control': 'public, max-age=120, s-maxage=1800, stale-while-revalidate=86400'
				}
			}
		);
	} catch (err) {
		console.error('Gallery error:', err);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
