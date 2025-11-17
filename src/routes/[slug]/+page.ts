import type { PageLoad } from './$types';

// Enable SSR for analytics tracking, but disable prerender since URLs are dynamic
export const prerender = false;

export const load: PageLoad = async ({ params, url, fetch }) => {
	// Check if this is a curated deck request (legacy support)
	const curatedId = url.searchParams.get('curated');

	if (curatedId) {
		// Fetch the curated deck from the API
		try {
			const response = await fetch(`/api/deck/${curatedId}`);

			if (response.ok) {
				const data = await response.json();
				return {
					slug: params.slug,
					curatedDeck: data.deck,
					curatedId
				};
			}
		} catch (error) {
			console.error('Failed to load curated deck:', error);
		}
	}

	// Try to fetch published deck by slug (using /api/deck which handles both ID and slug)
	try {
		const response = await fetch(`/api/deck/${params.slug}`);
		if (response.ok) {
			const data = await response.json();
			return {
				slug: params.slug,
				curatedDeck: data.deck,
				curatedId: data.deck.id
			};
		}
	} catch (error) {
		console.error('Failed to load published deck:', error);
	}

	// No deck found, return just the slug (will show URL hash data if present)
	return {
		slug: params.slug,
		curatedDeck: null,
		curatedId: null
	};
};
