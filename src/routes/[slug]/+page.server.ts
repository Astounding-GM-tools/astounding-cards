import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request, getClientAddress }) => {
    const slug = params.slug;
    const clientIP = getClientAddress();
    
    // Log shared deck access for server logs
    console.log(`📊 Shared deck accessed: ${slug} from ${clientIP}`);
    
    return {
        slug
    };
};
