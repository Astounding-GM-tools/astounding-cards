<script lang="ts">
	import { onMount } from 'svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import ActionBar from '$lib/next/components/actions/ActionBar.svelte';
	import ActionButton from '$lib/next/components/actions/ActionButton.svelte';
	import { authStore, user } from '$lib/next/stores/auth';
	import { tokenAmount } from '$lib/next/stores/tokenBalance';
	import { toasts } from '$lib/stores/toast';
	import { goto } from '$app/navigation';
	import { Plus, LogOut, UserCircle, Download } from 'lucide-svelte';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import JsonImportDialog from '$lib/next/components/dialogs/JsonImportDialog.svelte';

	// Check if user is authenticated
	let isAuthenticated = $derived(!!$user);
	let tokenBalance = $derived($tokenAmount);

	async function handleCreateNewDeck() {
		const newDeck = await nextDeckStore.createNewDeck();
		if (newDeck) {
			toasts.success('✨ New deck created!');
			goto(`/${newDeck.id}`);
		}
	}

	async function handleLogOut() {
		const { error } = await authStore.signOut();
		if (error) {
			toasts.error('Failed to log out');
		} else {
			toasts.success('👋 Logged out successfully');
			goto('/');
		}
	}

	function handleSignIn() {
		goto('/'); // Assuming MainHeader has sign-in button
		// Or open a sign-in dialog if you have one
	}

	function handleImportJson() {
		dialogStore.setContent(JsonImportDialog, {});
	}
</script>

<svelte:head>
	<title>Dashboard - Astounding Cards</title>
</svelte:head>

<MainHeader title="Dashboard" />

{#if isAuthenticated}
	<!-- Action Bar for authenticated users -->
	<ActionBar>
		<ActionButton
			icon={Plus}
			title="New Deck"
			subtitle="Create blank deck"
			variant="primary"
			onclick={handleCreateNewDeck}
		/>
		<ActionButton
			icon={Download}
			title="Import Deck"
			subtitle="From JSON file"
			variant="secondary"
			onclick={handleImportJson}
		/>
		<ActionButton
			icon={LogOut}
			title="Log Out"
			subtitle="Sign out"
			variant="secondary"
			onclick={handleLogOut}
		/>
	</ActionBar>

	<!-- Dashboard Sections -->
	<div class="dashboard">
		<!-- Profile Section -->
		<section class="dashboard-section">
			<h2 class="section-title">Profile</h2>
			<div class="profile-card">
				<div class="profile-info">
					<UserCircle size={48} />
					<div class="profile-details">
						<p class="profile-name">{$user?.email || 'User'}</p>
						<p class="profile-email">{$user?.email || ''}</p>
					</div>
				</div>
				<button class="edit-button" onclick={() => toasts.info('Profile editing coming soon!')}>
					Edit Profile
				</button>
			</div>
		</section>

		<!-- Token Balance & Store Section -->
		<section class="dashboard-section">
			<h2 class="section-title">Tokens & Credits</h2>
			<div class="token-card">
				<div class="token-balance">
					<span class="token-icon">🪙</span>
					<div>
						<p class="token-label">Current Balance</p>
						<p class="token-amount">{tokenBalance.toLocaleString()} tokens</p>
					</div>
				</div>
				<button class="buy-button" onclick={() => toasts.info('Token store coming soon!')}>
					Buy Tokens
				</button>
			</div>
			<p class="token-info">Use tokens to generate cards and images with AI</p>
		</section>

		<!-- My Decks Section (placeholder) -->
		<section class="dashboard-section">
			<h2 class="section-title">My Decks</h2>
			<div class="deck-list-placeholder">
				<p>Deck list with advanced features coming soon...</p>
				<p class="muted">Will show: Name, card count, status, tags, stats, actions</p>
			</div>
		</section>
	</div>
{:else}
	<!-- Not authenticated - show sign up CTA -->
	<div class="auth-cta">
		<div class="auth-cta-content">
			<h2>Sign In to Access Your Dashboard</h2>
			<p>Create an account to manage your decks, publish to the gallery, and use AI features.</p>
			<button class="cta-button" onclick={handleSignIn}> Sign In or Sign Up </button>
		</div>
	</div>
{/if}

<style>
	.dashboard {
		max-width: var(--page-max-width);
		padding: 2rem;
		margin: 0 auto;
	}

	/* Section Styling */
	.dashboard-section {
		margin-bottom: 3rem;
	}

	.section-title {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	/* Profile Card */
	.profile-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		gap: 1rem;
	}

	.profile-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.profile-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.profile-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.profile-email {
		margin: 0;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	.edit-button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.edit-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	/* Token Card */
	.token-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.token-balance {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.token-icon {
		font-size: 2rem;
	}

	.token-label {
		margin: 0;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	.token-amount {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--ui-text, #1a202c);
	}

	.buy-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		background: var(--brand, #c90019);
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.buy-button:hover {
		background: #a80116;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.token-info {
		margin: 0;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	/* Deck List Placeholder */
	.deck-list-placeholder {
		padding: 3rem 2rem;
		text-align: center;
		background: var(--ui-hover-bg, #f8fafc);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
	}

	.deck-list-placeholder p {
		margin: 0 0 0.5rem 0;
		color: var(--ui-muted, #64748b);
	}

	.muted {
		font-size: 0.875rem;
	}

	/* Auth CTA (not authenticated) */
	.auth-cta {
		min-height: 60vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.auth-cta-content {
		text-align: center;
		max-width: 500px;
	}

	.auth-cta h2 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--ui-text, #1a202c);
	}

	.auth-cta p {
		margin: 0 0 2rem 0;
		font-size: 1.125rem;
		color: var(--ui-muted, #64748b);
		line-height: 1.6;
	}

	.cta-button {
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		background: var(--brand, #c90019);
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cta-button:hover {
		background: #a80116;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.dashboard {
			padding: 1rem;
		}

		.profile-card,
		.token-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.edit-button,
		.buy-button {
			width: 100%;
		}
	}
</style>

<!-- Dialog system -->
<Dialog />
