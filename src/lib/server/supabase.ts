/**
 * Supabase Server Client
 * 
 * Server-side Supabase client with service role key for admin operations.
 * Use this for API routes that need to bypass RLS.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	throw new Error('Missing Supabase environment variables');
}

// Server client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

// Database types (will be generated from Supabase later)
export interface PublishedDeck {
	id: string;
	user_id: string | null;
	slug: string;
	title: string;
	description: string | null;
	theme: string | null;
	cards: any; // JSONB
	tags: string[];
	is_featured: boolean;
	is_curated: boolean;
	visibility: 'public' | 'unlisted';
	view_count: number;
	created_at: string;
	updated_at: string;
	version: number;
}

export interface User {
	id: string;
	email: string;
	credits: number;
	daily_free_decks_used: number;
	daily_free_decks_reset_at: string;
	created_at: string;
}

export interface Transaction {
	id: string;
	user_id: string;
	type: 'purchase' | 'usage' | 'refund';
	amount_nok: number | null;
	credits_delta: number;
	description: string | null;
	lemon_squeezy_order_id: string | null;
	status: 'pending' | 'completed' | 'failed';
	created_at: string;
}

export interface GeneratedImage {
	id: string;
	deck_id: string;
	card_id: string;
	url: string;
	prompt_hash: string | null;
	gemini_model: string | null;
	tier: 'public' | 'private';
	created_at: string;
}
