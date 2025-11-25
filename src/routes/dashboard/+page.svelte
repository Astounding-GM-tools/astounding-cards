<script lang="ts">
	import { onMount } from 'svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import ActionBar from '$lib/next/components/actions/ActionBar.svelte';
	import ActionButton from '$lib/next/components/actions/ActionButton.svelte';
	import Pill from '$lib/next/components/ui/Pill.svelte';
	import InfoBox from '$lib/next/components/ui/InfoBox.svelte';
	import { authStore, user } from '$lib/next/stores/auth';
	import { tokenAmount } from '$lib/next/stores/tokenBalance';
	import { toasts } from '$lib/stores/toast';
	import { goto } from '$app/navigation';
	import {
		Plus,
		LogOut,
		UserCircle,
		Download,
		Copy,
		Trash2,
		Sparkles,
		Edit,
		GitMerge,
		BookOpenCheck,
		LibraryBigIcon,
		Megaphone,
		AlertTriangle,
		Star,
		Globe,
		Palette,
		Calendar,
		CircleUser
	} from 'lucide-svelte';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';
	import { nextDb } from '$lib/next/stores/database';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import JsonImportDialog from '$lib/next/components/dialogs/JsonImportDialog.svelte';
	import TokenStore from '$lib/next/components/store/TokenStore.svelte';
	import type { Deck } from '$lib/next/types/deck';
	import { downloadDeckAsJson } from '$lib/next/utils/jsonExporter';
	import RenameDeckDialog from '$lib/next/components/dialogs/RenameDeckDialog.svelte';
	import MergeDecksDialog from '$lib/next/components/dialogs/MergeDecksDialog.svelte';

	// Check if user is authenticated
	let isAuthenticated = $derived(!!$user);
	let tokenBalance = $derived($tokenAmount);

	// Deck list state
	let userDecks = $state<Deck[]>([]);
	let isLoadingDecks = $state(true);
	let isExporting = $state(false);
	let editingDeck = $state<{ id: string; title: string } | null>(null);

	// Format date relative to now
	function formatDateRelative(timestamp: number): string | null {
		// Validate timestamp
		if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
			return null;
		}

		const now = Date.now();
		const diff = now - timestamp;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		// Handle future dates or very recent (invalid)
		if (days < 0 || diff < 0) {
			return null;
		}

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
		if (days < 365) return `${Math.floor(days / 30)} months ago`;
		return `${Math.floor(days / 365)} years ago`;
	}

	// Get the most relevant date to show (edited if recent, otherwise created)
	function getMostRelevantDate(deck: Deck): { timestamp: number; label: string } | null {
		const created = deck.meta.createdAt;
		const edited = deck.meta.lastEdited;

		// Validate timestamps
		if (!edited || isNaN(edited) || edited <= 0) {
			if (!created || isNaN(created) || created <= 0) {
				return null; // No valid dates
			}
			return { timestamp: created, label: 'Created' };
		}

		// If edited more than 1 day after created, show edited
		const daysSinceCreation = (edited - created) / (1000 * 60 * 60 * 24);
		if (daysSinceCreation > 1) {
			return { timestamp: edited, label: 'Edited' };
		}

		// Otherwise show created
		if (created && !isNaN(created) && created > 0) {
			return { timestamp: created, label: 'Created' };
		}

		return { timestamp: edited, label: 'Edited' };
	}

	// Check if deck has unpublished changes
	function hasUnpublishedChanges(deck: Deck): boolean {
		if (!deck.meta.published_deck_id) return false;
		if (!deck.meta.lastPublished) return true; // Published but never synced
		return deck.meta.lastEdited > deck.meta.lastPublished;
	}

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

	async function handleMerge(targetDeckId: string, sourceDeckId: string) {
		try {
			const sourceDeck = await nextDb.getDeck(sourceDeckId);
			if (!sourceDeck) {
				toasts.error('Source deck not found');
				return;
			}
			await nextDb.addCardsToDeck(
				targetDeckId,
				sourceDeck.cards.map((c) => ({ ...c, id: crypto.randomUUID() }))
			);
			toasts.success('Decks merged!');
			await loadUserDecks(); // Refresh list
		} catch (err) {
			console.error('Failed to merge decks:', err);
			toasts.error('Failed to merge decks');
		}
	}

	// Export a deck
	async function handleExport(deck: Deck, includeBlobs: boolean) {
		if (isExporting) return;
		isExporting = true;
		try {
			await downloadDeckAsJson(deck, includeBlobs);
			toasts.success('Export started!');
		} catch (error) {
			console.error('Export failed:', error);
			toasts.error('Export failed');
		} finally {
			isExporting = false;
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

	// Update deck layout
	async function handleLayoutChange(deckId: string, newLayout: 'poker' | 'tarot') {
		try {
			const deck = await nextDb.getDeck(deckId);
			if (!deck) return;

			deck.meta.layout = newLayout;
			deck.meta.lastEdited = Date.now();
			await nextDb.upsertDeck(deck);

			toasts.success(`Layout updated to ${newLayout === 'poker' ? 'Small' : 'Large'}`);
			await loadUserDecks(); // Refresh
		} catch (err) {
			console.error('Failed to update layout:', err);
			toasts.error('Failed to update layout');
		}
	}

	// Update deck image style
	async function handleImageStyleChange(deckId: string, newStyle: 'classic' | 'modern' | 'inked') {
		try {
			const deck = await nextDb.getDeck(deckId);
			if (!deck) return;

			deck.meta.imageStyle = newStyle;
			deck.meta.lastEdited = Date.now();
			await nextDb.upsertDeck(deck);

			toasts.success(`Image style updated to ${newStyle}`);
			await loadUserDecks(); // Refresh
		} catch (err) {
			console.error('Failed to update image style:', err);
			toasts.error('Failed to update image style');
		}
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
			title="New Deck"
			subtitle="Create blank deck"
			variant="primary"
			onclick={handleCreateNewDeck}
		>
			{#snippet icon()}<Plus size={20} />{/snippet}
		</ActionButton>
		<ActionButton
			title="Import Deck"
			subtitle="From JSON file"
			variant="secondary"
			onclick={handleImportJson}
		>
			{#snippet icon()}<Download size={20} />{/snippet}
		</ActionButton>
		<ActionButton title="Log Out" subtitle="Sign out" variant="danger" onclick={handleLogOut}>
			{#snippet icon()}<LogOut size={20} />{/snippet}
		</ActionButton>
	</ActionBar>

	<!-- Dashboard Sections -->
	<div class="dashboard">
		<!-- Profile Section -->
		<section class="dashboard-section">
			<h2 class="section-title">Profile</h2>
			<div class="profile-card">
				<div class="profile-info">
					<CircleUser size={48} />
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
								Enough for: ~{Math.floor(tokenBalance / 10)} cards or ~{Math.floor(
									tokenBalance / 100
								)} images
							</p>
						</div>
					</div>
					<InfoBox variant="warning">
						{#snippet icon()}<Sparkles size={18} />{/snippet}
						<strong>Coming Soon!</strong> Token purchasing will become available after Lemon Squeezy
						(hopefully) approves this website.
					</InfoBox>

					<InfoBox variant="info">
						{#snippet icon()}<BookOpenCheck size={18} />{/snippet}
						<strong>Beta prices!</strong> We are testing the sustainability of our pricing model. It
						is likely that we will have to increase prices after the beta, but any unspent tokens bought
						during beta will be retained.
					</InfoBox>

					<InfoBox variant="info">
						{#snippet icon()}<LibraryBigIcon size={18} />{/snippet}
						<strong>Terms of service</strong>
						Remember to read the full terms of service, but the most important bit is that Astounding
						Cards is a <strong>community driven service</strong>: All images generated on the
						platform becomes accessible to ALL members of the community as part of the Astounding
						Community Image Library!
					</InfoBox>
				</div>

				<!-- Divider -->
				<div class="divider"></div>
				<!-- Buy More -->
				<div class="token-store-card">
					<h3 class="store-header">Buy More</h3>
					<TokenStore compact={true} />
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
						<div class="deck-grid-item">
							<button class="deck-info" onclick={() => handleOpenDeck(deck.id)}>
								<div class="deck-header">
									<h3 class="deck-title">{deck.meta.title}</h3>
								</div>
								<div class="deck-meta">
									<span class="deck-stat">{deck.cards.length} cards</span>
									<span class="deck-stat"
										>{deck.cards.filter((card) => card.image).length} images</span
									>
									{#if getMostRelevantDate(deck)}
										{@const dateInfo = getMostRelevantDate(deck)}
										{@const relativeDate = formatDateRelative(dateInfo.timestamp)}
										{#if relativeDate}
											<Pill
												variant="info"
												title="{dateInfo?.label}: {new Date(dateInfo?.timestamp).toLocaleString()}"
											>
												{#snippet icon()}<Calendar size={14} />{/snippet}
												{relativeDate}
											</Pill>
										{/if}
									{/if}
									{#if deck.meta.published_deck_id || deck.meta.remix_of === deck.id}
										<Pill variant="success">
											{#snippet icon()}<Megaphone size={14} />{/snippet}
											Published
										</Pill>
										{#if hasUnpublishedChanges(deck)}
											<Pill variant="warning">
												{#snippet icon()}<AlertTriangle size={14} />{/snippet}
												Needs sync
											</Pill>
										{/if}
									{/if}
									{#if !deck.meta.creator_id || deck.meta.creator_id === $user?.id}
										<Pill variant="info">
											{#snippet icon()}<Star size={14} />{/snippet}
											Created by me
										</Pill>
									{:else}
										<Pill variant="info" title="Created by {deck.meta.creator_name}">
											{#snippet icon()}<Globe size={14} />{/snippet}
											Community deck
										</Pill>
									{/if}
									{#if deck.meta.remix_of && deck.meta.creator_id && deck.meta.creator_id !== $user?.id}
										<Pill variant="info">
											{#snippet icon()}<Palette size={14} />{/snippet}
											Remix
										</Pill>
									{/if}
								</div>
							</button>

							<div class="deck-actions">
								<fieldset class="action-group">
									<legend>Card Print Size</legend>
									<select
										class="design-select"
										value={deck.meta.layout}
										onchange={(e) =>
											handleLayoutChange(deck.id, e.currentTarget.value as 'poker' | 'tarot')}
										title="Print size"
									>
										<option value="poker">Small</option>
										<option value="tarot">Large</option>
									</select>
								</fieldset>
								<fieldset class="action-group">
									<legend>Default Image Style</legend>
									<select
										class="design-select"
										value={deck.meta.imageStyle}
										onchange={(e) =>
											handleImageStyleChange(
												deck.id,
												e.currentTarget.value as 'classic' | 'modern' | 'inked'
											)}
										title="Image style"
									>
										<option value="classic">Classic</option>
										<option value="modern">Modern</option>
										<option value="inked">Inked</option>
									</select>
								</fieldset>
								<fieldset class="action-group">
									<legend>Backup</legend>
									<button
										class="action-text-button"
										onclick={() => handleExport(deck, false)}
										disabled={isExporting}
										title="No images"
									>
										Light
									</button>
									<button
										class="action-text-button"
										onclick={() => handleExport(deck, true)}
										disabled={isExporting}
										title="Inline images (big file)"
									>
										Full
									</button>
								</fieldset>
								<fieldset class="action-group">
									<legend>Manage</legend>
									<button
										class="action-icon-button"
										onclick={() => (editingDeck = { id: deck.id, title: deck.meta.title })}
										title="Rename deck"
									>
										<Edit size={18} />
									</button>
									<button
										class="action-icon-button"
										onclick={() => handleDuplicateDeck(deck.id)}
										title="Duplicate deck"
									>
										<Copy size={18} />
									</button>
									<button
										class="action-icon-button"
										onclick={() =>
											dialogStore.setContent(MergeDecksDialog, {
												decks: userDecks,
												currentDeckId: deck.id,
												onMerge: async (sourceDeckId: string) => handleMerge(deck.id, sourceDeckId)
											})}
										title="Merge another deck into this one"
									>
										<GitMerge size={18} />
									</button>
									<button
										class="action-icon-button danger"
										onclick={() => handleDeleteDeck(deck.id, deck.meta.title)}
										title="Delete deck"
									>
										<Trash2 size={18} />
									</button>
								</fieldset>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
{:else}
	<!-- Not authenticated - show sign up CTA -->
	<section class="auth-cta">
		<div class="auth-cta-content">
			<h2>Sign In to Access Your Dashboard</h2>
			<p>Create an account to manage your decks, publish to the gallery, and use AI features.</p>
			<button class="cta-button" onclick={handleSignIn}> Sign In or Sign Up </button>
		</div>
	</section>
{/if}

<!-- Dialog system -->
<Dialog />

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
		gap: 1rem;
	}

	.deck-grid-item {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		padding: 1rem;
		transition: all 0.2s;
	}

	.deck-grid-item:hover {
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.deck-info {
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 40%;
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

	.deck-meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.8125rem;
		align-items: center;
	}

	.deck-stat {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		white-space: nowrap;
	}

	.deck-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-start;
		justify-self: end;
	}

	.action-group {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		margin: 0;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
	}

	.action-group legend {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--ui-muted, #64748b);
		padding: 0;
		margin-bottom: 0.5rem;
		white-space: nowrap;
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

	.action-icon-button.danger {
		color: #dc2626;
	}

	.action-icon-button.danger:hover {
		background: rgba(220, 38, 38, 0.1);
		border-color: #dc2626;
		color: #dc2626;
	}

	.action-text-button {
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

	.action-text-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.action-text-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.design-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 90px;
	}

	.design-select:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.design-select:focus {
		outline: none;
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
