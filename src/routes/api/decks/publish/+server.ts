/**
 * Publish Deck API
 *
 * POST /api/decks/publish
 *
 * Publishes a new deck or updates an existing published deck.
 * Works with the two-table system: copies from user_decks → published_decks
 * Requires authentication.
 */

import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// Helper to generate URL-safe slug from title
function generateSlug(title: string, userId: string): string {
	const baseSlug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	// Add a short hash from user ID to make it unique
	const userHash = userId.slice(0, 8);
	return `${baseSlug}-${userHash}`;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Parse request body
		const {
			title,
			description,
			tags,
			visibility,
			cards,
			theme,
			image_style,
			layout,
			userDeckId, // NEW: ID of the user_deck to publish
			deckId // LEGACY: published_deck ID for updates
		} = await request.json();

		// 3. NEW TWO-TABLE SYSTEM: Check if publishing from user_decks
		if (userDeckId) {
			// Fetch the user_deck
			const { data: userDeck, error: fetchError } = await supabaseAdmin
				.from('user_decks')
				.select('*')
				.eq('id', userDeckId)
				.eq('user_id', userId)
				.single();

			if (fetchError || !userDeck) {
				return error(404, 'User deck not found or access denied');
			}

			// Check if already published (update case)
			if (userDeck.published_deck_id) {
				// UPDATE PUBLISHED VERSION
				const { data: existingPublished } = await supabaseAdmin
					.from('published_decks')
					.select('version, slug')
					.eq('id', userDeck.published_deck_id)
					.single();

				if (!existingPublished) {
					// Published deck was deleted, treat as new publish
					return await publishNewDeck(userId, userDeck, null);
				}

				// Update existing published deck with current user_deck data
				const { data: updatedDeck, error: updateError } = await supabaseAdmin
					.from('published_decks')
					.update({
						title: userDeck.title,
						description: userDeck.description,
						tags: userDeck.tags,
						theme: userDeck.theme,
						image_style: userDeck.image_style,
						layout: userDeck.layout,
						cards: userDeck.cards,
						visibility: visibility || 'public',
						version: existingPublished.version + 1
					})
					.eq('id', userDeck.published_deck_id)
					.select()
					.single();

				if (updateError) {
					console.error('Failed to update published deck:', updateError);
					return error(500, 'Failed to update published deck');
				}

				return json({
					success: true,
					deck: {
						id: updatedDeck.id,
						slug: updatedDeck.slug,
						title: updatedDeck.title,
						description: updatedDeck.description,
						tags: updatedDeck.tags,
						visibility: updatedDeck.visibility,
						version: updatedDeck.version,
						updated_at: updatedDeck.updated_at
					},
					message: 'Published deck updated successfully'
				});
			}

			// FIRST PUBLISH - Create new published deck
			return await publishNewDeck(userId, userDeck, visibility || 'public');
		}

		// 4. LEGACY PATH: Direct publish without user_deck (backwards compatibility)
		// Validate inputs
		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return error(400, 'Title is required');
		}

		if (!cards || !Array.isArray(cards) || cards.length === 0) {
			return error(400, 'Deck must have at least one card');
		}

		if (!theme || typeof theme !== 'string') {
			return error(400, 'Theme is required');
		}

		if (visibility && !['public', 'unlisted'].includes(visibility)) {
			return error(400, 'Visibility must be "public" or "unlisted"');
		}

		// Check if updating existing published deck (legacy path)
		if (deckId) {
			const { data: existingDeck } = await supabaseAdmin
				.from('published_decks')
				.select('id, user_id, slug, version')
				.eq('id', deckId)
				.single();

			if (!existingDeck) {
				return error(404, 'Published deck not found');
			}

			if (existingDeck.user_id !== userId) {
				return error(403, 'You do not own this deck');
			}

			const { data: updatedDeck, error: updateError } = await supabaseAdmin
				.from('published_decks')
				.update({
					title: title.trim(),
					description: description?.trim() || null,
					tags: tags || [],
					visibility: visibility || 'public',
					cards,
					theme,
					image_style: image_style || 'classic',
					layout: layout || 'poker',
					version: existingDeck.version + 1
				})
				.eq('id', deckId)
				.select()
				.single();

			if (updateError) {
				console.error('Failed to update deck:', updateError);
				return error(500, 'Failed to update deck');
			}

			return json({
				success: true,
				deck: {
					id: updatedDeck.id,
					slug: updatedDeck.slug,
					title: updatedDeck.title,
					description: updatedDeck.description,
					tags: updatedDeck.tags,
					visibility: updatedDeck.visibility,
					version: updatedDeck.version,
					updated_at: updatedDeck.updated_at
				},
				message: 'Deck updated successfully'
			});
		}

		// Legacy new publish
		const slug = generateSlug(title, userId);
		const { data: existingSlug } = await supabaseAdmin
			.from('published_decks')
			.select('id')
			.eq('slug', slug)
			.single();

		const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

		return await createDeckLegacy(
			userId,
			title,
			description,
			tags,
			visibility,
			cards,
			theme,
			image_style,
			layout,
			finalSlug
		);
	} catch (err) {
		console.error('Publish deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to publish deck');
	}
};

/**
 * Publish a new deck from user_decks
 */
async function publishNewDeck(
	userId: string,
	userDeck: any,
	visibility: string | null
): Promise<Response> {
	const slug = generateSlug(userDeck.title, userId);

	// Check for slug conflicts
	const { data: existingSlug } = await supabaseAdmin
		.from('published_decks')
		.select('id')
		.eq('slug', slug)
		.single();

	const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

	// Create published deck
	const { data: publishedDeck, error: insertError } = await supabaseAdmin
		.from('published_decks')
		.insert({
			user_id: userId,
			slug: finalSlug,
			title: userDeck.title,
			description: userDeck.description,
			tags: userDeck.tags || [],
			theme: userDeck.theme,
			image_style: userDeck.image_style,
			layout: userDeck.layout,
			cards: userDeck.cards,
			visibility: visibility || 'public',
			source_deck_id: userDeck.id,
			remix_of: userDeck.remix_of || null, // Track remix lineage
			is_curated: false,
			is_featured: false
		})
		.select()
		.single();

	if (insertError) {
		console.error('Failed to create published deck:', insertError);
		throw new Error('Failed to publish deck');
	}

	// If this is a remix, increment the original deck's remix count
	if (userDeck.remix_of) {
		supabaseAdmin.rpc('increment_remix_count', { deck_id: userDeck.remix_of }).then(
			() => {}, // Success - no action needed
			(err) => console.error('Failed to increment remix count:', err)
		);
	}

	// Link user_deck to published_deck
	const { error: linkError } = await supabaseAdmin
		.from('user_decks')
		.update({ published_deck_id: publishedDeck.id })
		.eq('id', userDeck.id);

	if (linkError) {
		console.error('Failed to link user_deck to published_deck:', linkError);
		// Don't fail the request, just log it
	}

	return json({
		success: true,
		deck: {
			id: publishedDeck.id,
			slug: publishedDeck.slug,
			title: publishedDeck.title,
			description: publishedDeck.description,
			tags: publishedDeck.tags,
			visibility: publishedDeck.visibility,
			version: publishedDeck.version,
			created_at: publishedDeck.created_at
		},
		message: 'Deck published successfully'
	});
}

/**
 * Legacy function for direct publish (backwards compatibility)
 */
async function createDeckLegacy(
	userId: string,
	title: string,
	description: string | undefined,
	tags: string[] | undefined,
	visibility: string | undefined,
	cards: any[],
	theme: string,
	image_style: string | undefined,
	layout: string | undefined,
	slug: string
) {
	const { data: newDeck, error: insertError } = await supabaseAdmin
		.from('published_decks')
		.insert({
			user_id: userId,
			slug,
			title: title.trim(),
			description: description?.trim() || null,
			tags: tags || [],
			visibility: visibility || 'public',
			cards,
			theme,
			image_style: image_style || 'classic',
			layout: layout || 'poker',
			is_curated: false,
			is_featured: false
		})
		.select()
		.single();

	if (insertError) {
		console.error('Failed to insert deck:', insertError);
		throw new Error('Failed to publish deck');
	}

	return json({
		success: true,
		deck: {
			id: newDeck.id,
			slug: newDeck.slug,
			title: newDeck.title,
			description: newDeck.description,
			tags: newDeck.tags,
			visibility: newDeck.visibility,
			version: newDeck.version,
			created_at: newDeck.created_at
		},
		message: 'Deck published successfully'
	});
}
