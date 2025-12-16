/**
 * Authentication Store
 *
 * Manages user session, auth state, and provides auth methods
 */

import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
	error: AuthError | null;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		session: null,
		loading: true,
		error: null
	});

	// Initialize session listener
	async function initialize() {
		// Get initial session
		const {
			data: { session }
		} = await supabase.auth.getSession();

		update((state) => ({
			...state,
			user: session?.user ?? null,
			session: session ?? null,
			loading: false
		}));

		// Listen for auth changes
		supabase.auth.onAuthStateChange(async (event, session) => {
			update((state) => ({
				...state,
				user: session?.user ?? null,
				session: session ?? null,
				loading: false
			}));

			// When a user signs in (including OAuth), ensure they have a user record
			if (event === 'SIGNED_IN' && session?.user) {
				try {
					await fetch('/api/auth/create-user', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${session.access_token}`
						},
						body: JSON.stringify({
							userId: session.user.id,
							email: session.user.email
						})
					});
				} catch (error) {
					// Non-critical - user record might already exist or will be created later
					console.warn('Failed to ensure user record exists:', error);
				}
			}
		});
	}

	// Sign up with email/password
	async function signUp(email: string, password: string) {
		update((state) => ({ ...state, loading: true, error: null }));

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: window.location.origin
			}
		});

		// Explicitly create user record for email/password signup
		// (onAuthStateChange also handles this for OAuth and as a backup)
		if (data.user && !error) {
			try {
				await fetch('/api/auth/create-user', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${data.session?.access_token}`
					},
					body: JSON.stringify({
						userId: data.user.id,
						email: data.user.email
					})
				});
			} catch (userCreateError) {
				console.warn('Failed to create user record:', userCreateError);
				// Non-critical - onAuthStateChange will retry
			}
		}

		update((state) => ({
			...state,
			loading: false,
			error: error ?? null
		}));

		return { data, error };
	}

	// Sign in with email/password
	async function signIn(email: string, password: string) {
		update((state) => ({ ...state, loading: true, error: null }));

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		update((state) => ({
			...state,
			loading: false,
			error: error ?? null
		}));

		return { data, error };
	}

	// Sign in with Google OAuth
	async function signInWithGoogle() {
		update((state) => ({ ...state, loading: true, error: null }));

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: window.location.origin
			}
		});

		// Don't update loading here - OAuth redirect will happen
		if (error) {
			update((state) => ({
				...state,
				loading: false,
				error
			}));
		}

		return { data, error };
	}

	// Sign out
	async function signOut() {
		update((state) => ({ ...state, loading: true, error: null }));

		const { error } = await supabase.auth.signOut();

		update((state) => ({
			...state,
			user: null,
			session: null,
			loading: false,
			error: error ?? null
		}));

		return { error };
	}

	// Reset password
	async function resetPassword(email: string) {
		update((state) => ({ ...state, loading: true, error: null }));

		const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/reset-password`
		});

		update((state) => ({
			...state,
			loading: false,
			error: error ?? null
		}));

		return { data, error };
	}

	// Initialize on store creation
	initialize();

	return {
		subscribe,
		signUp,
		signIn,
		signInWithGoogle,
		signOut,
		resetPassword
	};
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, ($auth) => $auth.user);
export const session = derived(authStore, ($auth) => $auth.session);
export const isAuthenticated = derived(authStore, ($auth) => !!$auth.user);
export const authLoading = derived(authStore, ($auth) => $auth.loading);
