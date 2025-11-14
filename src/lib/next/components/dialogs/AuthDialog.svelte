<script lang="ts">
	import { authStore } from '$lib/next/stores/auth';
	import { toasts } from '$lib/stores/toast';

	let { open = $bindable(false) } = $props<{
		open?: boolean;
	}>();

	let mode: 'sign-in' | 'sign-up' | 'reset' = $state('sign-in');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	async function handleEmailAuth() {
		if (!email || !password) {
			toasts.error('Please enter email and password');
			return;
		}

		loading = true;

		if (mode === 'sign-up') {
			const { error } = await authStore.signUp(email, password);
			
			if (error) {
				toasts.error(error.message);
			} else {
				toasts.success('Check your email to confirm your account!');
				open = false;
			}
		} else {
			const { error } = await authStore.signIn(email, password);
			
			if (error) {
				toasts.error(error.message);
			} else {
				toasts.success('Signed in successfully!');
				open = false;
			}
		}

		loading = false;
	}

	async function handleGoogleAuth() {
		loading = true;
		const { error } = await authStore.signInWithGoogle();
		
		if (error) {
			toasts.error(error.message);
			loading = false;
		}
		// OAuth redirect will happen if successful
	}

	async function handleResetPassword() {
		if (!email) {
			toasts.error('Please enter your email address');
			return;
		}

		loading = true;
		const { error } = await authStore.resetPassword(email);
		
		if (error) {
			toasts.error(error.message);
		} else {
			toasts.success('Password reset email sent! Check your inbox.');
			mode = 'sign-in';
		}

		loading = false;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (mode === 'reset') {
			handleResetPassword();
		} else {
			handleEmailAuth();
		}
	}

	function switchMode(newMode: typeof mode) {
		mode = newMode;
		email = '';
		password = '';
	}
</script>

{#if open}
	<div class="dialog-backdrop" onclick={() => (open = false)}>
		<div class="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<h2>
					{#if mode === 'sign-in'}
						Sign In
					{:else if mode === 'sign-up'}
						Create Account
					{:else}
						Reset Password
					{/if}
				</h2>
				<button class="close-button" onclick={() => (open = false)} aria-label="Close">
					×
				</button>
			</div>

			<div class="dialog-content">
				<form onsubmit={handleSubmit}>
					<div class="form-group">
						<label for="email">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
							disabled={loading}
						/>
					</div>

					{#if mode !== 'reset'}
						<div class="form-group">
							<label for="password">Password</label>
							<input
								id="password"
								type="password"
								bind:value={password}
								placeholder="••••••••"
								required
								disabled={loading}
								minlength="6"
							/>
						</div>
					{/if}

					<button type="submit" class="primary-button" disabled={loading}>
						{#if loading}
							Loading...
						{:else if mode === 'sign-in'}
							Sign In
						{:else if mode === 'sign-up'}
							Create Account
						{:else}
							Send Reset Email
						{/if}
					</button>
				</form>

				{#if mode !== 'reset'}
					<div class="divider">
						<span>or</span>
					</div>

					<button class="google-button" onclick={handleGoogleAuth} disabled={loading}>
						<svg viewBox="0 0 24 24" width="18" height="18">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</button>
				{/if}

				<div class="auth-footer">
					{#if mode === 'sign-in'}
						<button class="link-button" onclick={() => switchMode('sign-up')}>
							Need an account? Sign up
						</button>
						<button class="link-button" onclick={() => switchMode('reset')}>
							Forgot password?
						</button>
					{:else if mode === 'sign-up'}
						<button class="link-button" onclick={() => switchMode('sign-in')}>
							Already have an account? Sign in
						</button>
					{:else}
						<button class="link-button" onclick={() => switchMode('sign-in')}>
							Back to sign in
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.dialog {
		background: white;
		border-radius: 8px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.close-button:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.dialog-content {
		padding: 1.5rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		font-size: 0.875rem;
		color: #374151;
	}

	input {
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	.primary-button {
		padding: 0.75rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.primary-button:hover:not(:disabled) {
		background: #2563eb;
	}

	.primary-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1.5rem 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #e5e7eb;
	}

	.google-button {
		width: 100%;
		padding: 0.75rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		transition: background 0.2s;
	}

	.google-button:hover:not(:disabled) {
		background: #f9fafb;
	}

	.google-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.auth-footer {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.link-button {
		background: none;
		border: none;
		color: #3b82f6;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.25rem;
	}

	.link-button:hover {
		text-decoration: underline;
	}
</style>
