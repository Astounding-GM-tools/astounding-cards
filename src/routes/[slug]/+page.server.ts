import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request, getClientAddress }) => {
	const slug = params.slug;
	const clientIP = getClientAddress();

	return {
		slug
	};
};
