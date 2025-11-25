/**
 * Check Image Variants API
 *
 * Checks if images exist in a specific style for given cards
 * Uses the same remix detection logic as image generation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Parse request body
		const { cards, style } = await request.json();

		// 3. Validate inputs
		if (!Array.isArray(cards) || cards.length === 0) {
			return error(400, 'Cards array is required');
		}

		if (!style || typeof style !== 'string') {
			return error(400, 'Style is required and must be a string');
		}


		// 4. Check each card for existing image in the target style
		const variants: Record<string, { exists: boolean; url: string | null; imageId?: string }> = {};

		for (const card of cards) {
			// If card doesn't have an image, it definitely needs generation
			if (!card.imageMetadata?.imageId) {
				variants[card.id] = {
					exists: false,
					url: null
				};
				continue;
			}

			const sourceImageId = card.imageMetadata.imageId;

			// Get the source image to understand the family
			const { data: sourceImage } = await supabaseAdmin
				.from('community_images')
				.select('id, style, source_image_id, url')
				.eq('id', sourceImageId)
				.single();

			if (!sourceImage) {
				// Source image not found, needs generation
				variants[card.id] = {
					exists: false,
					url: null
				};
				continue;
			}

			// If the source image itself is already the right style, return it
			if (sourceImage.style === style) {
				variants[card.id] = {
					exists: true,
					url: sourceImage.url,
					imageId: sourceImage.id
				};
				continue;
			}

			// Find the original (root) image in this family
			const originalImageId = sourceImage.source_image_id || sourceImage.id;

			// Look for any image in the family with the target style
			const { data: familyImages } = await supabaseAdmin
				.from('community_images')
				.select('id, url, style')
				.or(`id.eq.${originalImageId},source_image_id.eq.${originalImageId}`)
				.eq('style', style);

			if (familyImages && familyImages.length > 0) {
				// Found existing image in target style
				variants[card.id] = {
					exists: true,
					url: familyImages[0].url,
					imageId: familyImages[0].id
				};
			} else {
				// No existing image in target style, needs generation
				variants[card.id] = {
					exists: false,
					url: null
				};
			}
		}

		// 5. Return results
		const existingCount = Object.values(variants).filter((v) => v.exists).length;
		const needsGenerationCount = Object.values(variants).filter((v) => !v.exists).length;

		console.log(
			`✅ Variant check complete: ${existingCount} exist, ${needsGenerationCount} need generation`
		);

		return json({
			success: true,
			variants,
			summary: {
				total: cards.length,
				existing: existingCount,
				needsGeneration: needsGenerationCount
			}
		});
	} catch (err) {
		console.error('Check image variants API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to check image variants');
	}
};
