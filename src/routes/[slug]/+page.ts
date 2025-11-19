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

	// Check if slug looks like a UUID (local deck ID) - if so, skip API call
	// UUIDs follow pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const isLocalDeckId = uuidPattern.test(params.slug);

	// Only try API for published deck slugs (not local UUIDs)
	if (!isLocalDeckId) {
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
	}

	// Local deck or not found - will check IndexedDB client-side
	return {
		slug: params.slug,
		curatedDeck: null,
		curatedId: null
	};
};
