import type { PageLoad } from './$types';

// Enable SSR for analytics tracking, but disable prerender since URLs are dynamic
export const prerender = false;

export const load: PageLoad = async ({ params, url, fetch }) => {
	// Check if this is a curated deck request
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
	
	// No curated deck, return just the slug
	return {
		slug: params.slug,
		curatedDeck: null,
		curatedId: null
	};
};
