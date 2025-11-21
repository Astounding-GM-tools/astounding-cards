<script lang="ts">
	import { onMount } from 'svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import ActionBar from '$lib/next/components/actions/ActionBar.svelte';
	import ActionButton from '$lib/next/components/actions/ActionButton.svelte';
	import { authStore, user } from '$lib/next/stores/auth';
	import { tokenAmount } from '$lib/next/stores/tokenBalance';
	import { toasts } from '$lib/stores/toast';
	import { goto } from '$app/navigation';
	import { Plus, LogOut, UserCircle, Download, Copy, Trash2, ExternalLink } from 'lucide-svelte';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';
	import { nextDb } from '$lib/next/stores/database';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import JsonImportDialog from '$lib/next/components/dialogs/JsonImportDialog.svelte';
	import TokenStore from '$lib/next/components/store/TokenStore.svelte';
	import type { Deck } from '$lib/next/types/deck';

	// Check if user is authenticated
	let isAuthenticated = $derived(!!$user);
	let tokenBalance = $derived($tokenAmount);

	// Deck list state
	let userDecks = $state<Deck[]>([]);
	let isLoadingDecks = $state(true);

	// Load user's decks
	async function loadUserDecks() {
		isLoadingDecks = true;
		try {
			userDecks = await nextDb.getAllDecks();
		} catch (err) {
			console.error('Failed to load decks:', err);
			toasts.error('Failed to load your decks');
		} finally {
			isLoadingDecks = false;
		}
	}

	// Duplicate a deck
	async function handleDuplicateDeck(deckId: string) {
		try {
			const duplicatedDeck = await nextDb.duplicateDeck(deckId);
			toasts.success(`✨ Deck duplicated: "${duplicatedDeck.meta.title}"`);
			await loadUserDecks(); // Refresh list
		} catch (err) {
			console.error('Failed to duplicate deck:', err);
			toasts.error('Failed to duplicate deck');
		}
	}

	// Delete a deck
	async function handleDeleteDeck(deckId: string, deckTitle: string) {
		if (!confirm(`Delete "${deckTitle}"? This cannot be undone.`)) return;

		try {
			await nextDb.deleteDeck(deckId);
			toasts.success(`🗑️ Deleted "${deckTitle}"`);
			await loadUserDecks(); // Refresh list
		} catch (err) {
			console.error('Failed to delete deck:', err);
			toasts.error('Failed to delete deck');
		}
	}

	// Open a deck
	function handleOpenDeck(deckId: string) {
		goto(`/${deckId}`);
	}

	// Load decks when authenticated
	$effect(() => {
		if (isAuthenticated) {
			loadUserDecks();
		}
	});

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
			<h2 class="section-title">Tokens</h2>

			<div class="tokens-container">
				<!-- Current Balance -->
				<div class="token-balance-card">
					<h3 class="balance-header">Current Balance</h3>
					<div class="balance-display">
						<span class="token-icon">🪙</span>
						<div>
							<p class="balance-amount">{tokenBalance.toLocaleString()} tokens</p>
							<p class="balance-info">
								Enough for: ~{Math.floor(tokenBalance / 10)} cards and ~{Math.floor(tokenBalance / 100)} images
							</p>
						</div>
					</div>
				</div>

				<!-- Divider -->
				<div class="divider"></div>

				<!-- Buy More -->
				<div class="token-store-card">
					<h3 class="store-header">Buy More</h3>
					<TokenStore compact={true} showComingSoon={true} />
				</div>
			</div>
		</section>

		<!-- My Decks Section -->
		<section class="dashboard-section">
			<h2 class="section-title">My Decks</h2>

			{#if isLoadingDecks}
				<div class="deck-list-loading">
					<p>Loading your decks...</p>
				</div>
			{:else if userDecks.length === 0}
				<div class="deck-list-empty">
					<p>You haven't created any decks yet.</p>
					<p class="muted">Click "New Deck" above to get started!</p>
				</div>
			{:else}
				<div class="deck-list">
					{#each userDecks as deck}
						<div class="deck-item">
							<button class="deck-info" onclick={() => handleOpenDeck(deck.id)}>
								<div class="deck-header">
									<h3 class="deck-title">{deck.meta.title}</h3>
									<span class="deck-cards">{deck.cards.length} cards</span>
								</div>
								<div class="deck-meta">
									<span class="deck-theme">{deck.meta.theme}</span>
									<span class="deck-layout">{deck.meta.layout}</span>
									{#if deck.meta.published_slug}
										<span class="deck-published">📢 Published</span>
									{/if}
								</div>
							</button>

							<div class="deck-actions">
								<button
									class="action-icon-button"
									onclick={() => handleDuplicateDeck(deck.id)}
									title="Duplicate deck"
								>
									<Copy size={18} />
								</button>
								<button
									class="action-icon-button danger"
									onclick={() => handleDeleteDeck(deck.id, deck.meta.title)}
									title="Delete deck"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
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

	/* Tokens Container (horizontal layout) */
	.tokens-container {
		display: grid;
		grid-template-columns: 1fr auto 2fr;
		gap: 2rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.divider {
		width: 1px;
		background: var(--ui-border, #e2e8f0);
	}

	/* Token Balance Card */
	.token-balance-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.balance-header {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.balance-display {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.token-icon {
		font-size: 2.5rem;
		line-height: 1;
	}

	.balance-amount {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--ui-text, #1a202c);
		line-height: 1;
	}

	.balance-info {
		margin: 0;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		line-height: 1.4;
	}

	/* Token Store Card */
	.token-store-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.store-header {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	/* Deck List */
	.deck-list-loading,
	.deck-list-empty {
		padding: 3rem 2rem;
		text-align: center;
		background: var(--ui-hover-bg, #f8fafc);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
	}

	.deck-list-empty p,
	.deck-list-loading p {
		margin: 0 0 0.5rem 0;
		color: var(--ui-muted, #64748b);
	}

	.muted {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	.deck-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.deck-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		padding: 1rem;
		transition: all 0.2s;
	}

	.deck-item:hover {
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.deck-info {
		flex: 1;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.deck-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}

	.deck-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.deck-cards {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		white-space: nowrap;
	}

	.deck-meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.8125rem;
	}

	.deck-theme,
	.deck-layout {
		padding: 0.25rem 0.5rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 4px;
		color: var(--ui-muted, #64748b);
		text-transform: capitalize;
	}

	.deck-published {
		padding: 0.25rem 0.5rem;
		background: rgba(5, 150, 105, 0.1);
		border-radius: 4px;
		color: #059669;
		font-weight: 500;
	}

	.deck-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		color: var(--ui-text, #1a202c);
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-icon-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.action-icon-button.danger:hover {
		background: rgba(220, 38, 38, 0.1);
		border-color: #dc2626;
		color: #dc2626;
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

		.profile-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.edit-button {
			width: 100%;
		}

		.tokens-container {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.divider {
			display: none;
		}
	}
</style>

<!-- Dialog system -->
<Dialog />
