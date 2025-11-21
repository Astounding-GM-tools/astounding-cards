/**
 * User Decks API
 *
 * CRUD operations for user's private working copies
 * These sync across user's devices and serve as source for publishing
 *
 * GET    /api/user-decks          - List all user's decks
 * POST   /api/user-decks          - Create/upsert user deck (sync from client)
 * PATCH  /api/user-decks/[id]     - Update user deck
 * DELETE /api/user-decks/[id]     - Delete user deck
 */

import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * GET - List all user's decks
 */
export const GET: RequestHandler = async ({ request, cookies, url }) => {
	try {
		// Authenticate
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// Optional filters
		const includePublished = url.searchParams.get('includePublished') === 'true';

		// Query user's decks
		let query = supabaseAdmin
			.from('user_decks')
			.select('*')
			.eq('user_id', userId)
			.order('last_edited', { ascending: false });

		// Filter by published status if requested
		if (includePublished === false) {
			query = query.is('published_deck_id', null);
		}

		const { data: decks, error: queryError } = await query;

		if (queryError) {
			console.error('Failed to fetch user decks:', queryError);
			return error(500, 'Failed to fetch decks');
		}

		return json({ decks });
	} catch (err) {
		console.error('Get user decks error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to fetch decks');
	}
};

/**
 * POST - Create or upsert user deck
 * Client provides ID to ensure sync consistency with IndexedDB
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Authenticate
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// Parse request
		const body = await request.json();

		const {
			id,
			title,
			description,
			theme,
			image_style,
			layout,
			cards,
			tags,
			is_synced,
			published_deck_id
		} = body;

		// Validate required fields
		if (!id || typeof id !== 'string') {
			console.error('[API] Validation error: Deck ID missing or invalid');
			return error(400, 'Deck ID is required');
		}

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			console.error('[API] Validation error: Title missing or invalid');
			return error(400, 'Title is required');
		}

		if (!cards || !Array.isArray(cards)) {
			console.error('[API] Validation error: Cards missing or not an array');
			return error(400, 'Cards array is required');
		}

		// Check if deck already exists (upsert)
		const { data: existingDeck } = await supabaseAdmin
			.from('user_decks')
			.select('id, user_id')
			.eq('id', id)
			.single();

		if (existingDeck) {
			// Verify ownership
			if (existingDeck.user_id !== userId) {
				console.error('[API] Ownership error: Deck belongs to different user');
				return error(403, 'Cannot sync deck owned by another user');
			}

			// Update existing deck
			const updatePayload = {
				title: title.trim(),
				description: description?.trim() || null,
				theme: theme || 'classic',
				image_style: image_style || 'classic',
				layout: layout || 'poker',
				cards,
				tags: tags || [],
				is_synced: is_synced ?? true,
				published_deck_id: published_deck_id || null,
				last_edited: new Date().toISOString()
			};

			console.log('[API] Update payload:', JSON.stringify(updatePayload, null, 2));

			const { data: updatedDeck, error: updateError } = await supabaseAdmin
				.from('user_decks')
				.update(updatePayload)
				.eq('id', id)
				.select()
				.single();

			if (updateError) {
				console.error('[API] Supabase update error:', updateError);
				console.error('[API] Update payload was:', updatePayload);
				return error(500, 'Failed to sync deck');
			}

			return json({
				success: true,
				deck: updatedDeck,
				message: 'Deck synced successfully'
			});
		}

		// Create new deck
		const insertPayload = {
			id,
			user_id: userId,
			title: title.trim(),
			description: description?.trim() || null,
			theme: theme || 'classic',
			image_style: image_style || 'classic',
			layout: layout || 'poker',
			cards,
			tags: tags || [],
			is_synced: is_synced ?? true,
			published_deck_id: published_deck_id || null
		};

		console.log('[API] Insert payload:', JSON.stringify(insertPayload, null, 2));

		const { data: newDeck, error: insertError } = await supabaseAdmin
			.from('user_decks')
			.insert(insertPayload)
			.select()
			.single();

		if (insertError) {
			console.error('[API] Supabase insert error:', insertError);
			console.error('[API] Insert payload was:', insertPayload);
			return error(500, 'Failed to create deck');
		}

		return json({
			success: true,
			deck: newDeck,
			message: 'Deck created successfully'
		});
	} catch (err) {
		console.error('Create/upsert user deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to save deck');
	}
};

/**
 * PATCH - Update specific fields of a user deck
 */
export const PATCH: RequestHandler = async ({ request, cookies, url }) => {
	try {
		// Authenticate
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// Get deck ID from query params
		const deckId = url.searchParams.get('id');
		if (!deckId) {
			return error(400, 'Deck ID is required');
		}

		// Parse update fields
		const updates = await request.json();

		// Verify ownership
		const { data: existingDeck } = await supabaseAdmin
			.from('user_decks')
			.select('user_id')
			.eq('id', deckId)
			.single();

		if (!existingDeck) {
			return error(404, 'Deck not found');
		}

		if (existingDeck.user_id !== userId) {
			return error(403, 'You do not own this deck');
		}

		// Update deck
		const { data: updatedDeck, error: updateError } = await supabaseAdmin
			.from('user_decks')
			.update({
				...updates,
				last_edited: new Date().toISOString()
			})
			.eq('id', deckId)
			.select()
			.single();

		if (updateError) {
			console.error('Failed to update user deck:', updateError);
			return error(500, 'Failed to update deck');
		}

		return json({
			success: true,
			deck: updatedDeck,
			message: 'Deck updated successfully'
		});
	} catch (err) {
		console.error('Update user deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to update deck');
	}
};

/**
 * DELETE - Delete user deck
 */
export const DELETE: RequestHandler = async ({ request, cookies, url }) => {
	try {
		// Authenticate
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// Get deck ID from query params
		const deckId = url.searchParams.get('id');
		if (!deckId) {
			return error(400, 'Deck ID is required');
		}

		// Verify ownership and check if published
		const { data: existingDeck } = await supabaseAdmin
			.from('user_decks')
			.select('user_id, published_deck_id')
			.eq('id', deckId)
			.single();

		if (!existingDeck) {
			return error(404, 'Deck not found');
		}

		if (existingDeck.user_id !== userId) {
			return error(403, 'You do not own this deck');
		}

		// If deck is published, optionally unpublish first
		// (Foreign key is set to SET NULL, so published_deck will just lose the link)
		if (existingDeck.published_deck_id) {
			// Note: We're NOT deleting the published deck automatically
			// The published deck remains in gallery as a snapshot
			// This is intentional - published decks can outlive their source
			console.log(
				`Deleting user_deck ${deckId} which is linked to published_deck ${existingDeck.published_deck_id}`
			);
		}

		// Delete the deck
		const { error: deleteError } = await supabaseAdmin
			.from('user_decks')
			.delete()
			.eq('id', deckId);

		if (deleteError) {
			console.error('Failed to delete user deck:', deleteError);
			return error(500, 'Failed to delete deck');
		}

		return json({
			success: true,
			message: 'Deck deleted successfully',
			was_published: !!existingDeck.published_deck_id
		});
	} catch (err) {
		console.error('Delete user deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to delete deck');
	}
};
