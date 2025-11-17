/**
 * Publish Deck API
 *
 * POST /api/decks/publish
 *
 * Publishes a new deck or updates an existing published deck.
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
		const { title, description, tags, visibility, cards, theme, deckId } = await request.json();

		// 3. Validate inputs
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

		// 4. Check if updating existing deck
		if (deckId) {
			// Verify ownership
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

			// Update existing deck
			const { data: updatedDeck, error: updateError } = await supabaseAdmin
				.from('published_decks')
				.update({
					title: title.trim(),
					description: description?.trim() || null,
					tags: tags || [],
					visibility: visibility || 'public',
					cards,
					theme,
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

		// 5. Publish new deck
		const slug = generateSlug(title, userId);

		// Check if slug already exists (unlikely but possible)
		const { data: existingSlug } = await supabaseAdmin
			.from('published_decks')
			.select('id')
			.eq('slug', slug)
			.single();

		if (existingSlug) {
			// Add timestamp to make it unique
			const timestampedSlug = `${slug}-${Date.now()}`;
			return await createDeck(
				userId,
				title,
				description,
				tags,
				visibility,
				cards,
				theme,
				timestampedSlug
			);
		}

		return await createDeck(userId, title, description, tags, visibility, cards, theme, slug);
	} catch (err) {
		console.error('Publish deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to publish deck');
	}
};

async function createDeck(
	userId: string,
	title: string,
	description: string | undefined,
	tags: string[] | undefined,
	visibility: string | undefined,
	cards: any[],
	theme: string,
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
