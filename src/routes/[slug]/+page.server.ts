import { track } from '@vercel/analytics/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request, getClientAddress }) => {
    const slug = params.slug;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = getClientAddress();
    const referer = request.headers.get('referer') || 'direct';
    
    // Track shared deck access
    await track('shared_deck_accessed', {
        slug,
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        referer,
        client_ip: clientIP
    });
    
    console.log(`📊 Shared deck accessed: ${slug} from ${clientIP}`);
    
    return {
        slug
    };
};