/**
 * Fetch Published Deck API
 * 
 * GET /api/deck/[id]
 * 
 * Fetches a published deck by ID or slug.
 * Increments view count on successful fetch.
 */

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id) {
		return json({ error: 'Deck ID is required' }, { status: 400 });
	}

	try {
		// Try to fetch by UUID first, then by slug
		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
		
		let query = supabaseAdmin
			.from('published_decks')
			.select('*')
			.eq('visibility', 'public') // Only return public decks
			.single();

		if (isUuid) {
			query = query.eq('id', id);
		} else {
			query = query.eq('slug', id);
		}

		const { data: deck, error } = await query;

		if (error) {
			if (error.code === 'PGRST116') {
				// No rows returned
				return json({ error: 'Deck not found' }, { status: 404 });
			}
			console.error('Database error:', error);
			return json({ error: 'Failed to fetch deck' }, { status: 500 });
		}

		if (!deck) {
			return json({ error: 'Deck not found' }, { status: 404 });
		}

		// Increment view count asynchronously (don't wait)
		supabaseAdmin.rpc('increment_view_count', { deck_id: deck.id }).then(
			() => {},
			(err) => console.error('Failed to increment view count:', err)
		);

		return json({
			success: true,
			deck: {
				id: deck.id,
				slug: deck.slug,
				title: deck.title,
				description: deck.description,
				theme: deck.theme,
				cards: deck.cards,
				tags: deck.tags,
				is_featured: deck.is_featured,
				is_curated: deck.is_curated,
				view_count: deck.view_count,
				created_at: deck.created_at,
				updated_at: deck.updated_at,
				version: deck.version
			}
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
};
