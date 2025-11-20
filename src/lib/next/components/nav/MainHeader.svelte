<script lang="ts">
	import { user, isAuthenticated, authStore } from '$lib/next/stores/auth';
	import AuthDialog from '../dialogs/AuthDialog.svelte';
	import DeckSwitcher from './DeckSwitcher.svelte';
	import { Library, LogIn, ChevronDown, Coins, Plus, Sparkles, LogOut } from 'lucide-svelte';
	import type { Deck } from '$lib/next/types/deck.js';
	import { tokenAmount } from '$lib/next/stores/tokenBalance';
	import { nextDeckStore } from '../../stores/deckStore.svelte';
	import { toasts } from '$lib/stores/toast';
	import { goto } from '$app/navigation';
	import { dialogStore } from '../dialog/dialogStore.svelte';
	import AiDeckGenerationDialog from '../dialogs/AiDeckGenerationDialog.svelte';
	import { nextDb } from '../../stores/database';
	import { onMount } from 'svelte';

	// Props for flexible header
	interface Props {
		title?: string;
		hideGalleryLink?: boolean;
		onTitleEdit?: () => void;
		actions?: import('svelte').Snippet;
		metadata?: import('svelte').Snippet;

		// Gallery view indicator
		isGalleryView?: boolean;

		// Deck switcher props
		showDeckSwitcher?: boolean;
		decks?: Deck[];
		currentDeckId?: string;
		onSelectDeck?: (deckId: string) => void;
		onNewDeck?: () => void;

		// Mock overrides for testing/stories
		mockIsAuthenticated?: boolean;
		mockUserEmail?: string;
		mockDeckCount?: number;
		mockTokenBalance?: number;
	}

	let {
		decks = [],
		title = 'Astounding Cards',
		mockUserEmail,
		mockDeckCount,
		mockTokenBalance,
		mockIsAuthenticated,
		hideGalleryLink = false,
		isGalleryView = false,
		showDeckSwitcher = false,
		currentDeckId,
		onSelectDeck,
		onNewDeck,
		actions,
		metadata,
		onTitleEdit
	}: Props = $props();

	// Derived state from store or mocks
	let authenticated = $derived(mockIsAuthenticated ?? $isAuthenticated);
	let userEmail = $derived(mockUserEmail ?? $user?.email);
	let deckCount = $derived(mockDeckCount ?? decks.length);
	let tokenBalance = $derived(mockTokenBalance ?? $tokenAmount);

	// Extract user initial from email
	function getUserInitial(email?: string): string {
		if (!email) return '?';
		// Get first letter before @ or space
		const name = email.split('@')[0];
		return name.charAt(0).toUpperCase();
	}

	let userInitial = $derived(getUserInitial(userEmail));

	// Auth dialog state
	let authDialogOpen = $state(false);

	// User menu state
	let userMenuOpen = $state(false);

	// Deck switcher menu state
	let deckSwitcherOpen = $state(false);

	// Load all local decks for the switcher
	let allDecks = $state<Deck[]>([]);
	let activeDeckId = $derived(nextDeckStore.deck?.id || currentDeckId);

	onMount(async () => {
		// Load all decks from IndexedDB
		try {
			const loadedDecks = await nextDb.getAllDecks();
			allDecks = loadedDecks;
		} catch (err) {
			console.error('Failed to load decks:', err);
		}
	});

	// Reload decks when the current deck changes (new deck created/loaded)
	$effect(() => {
		if (activeDeckId) {
			// Reload deck list to ensure it's up to date
			nextDb.getAllDecks().then((loadedDecks) => {
				allDecks = loadedDecks;
			});
		}
	});

	// Derived: should we show the deck switcher?
	let shouldShowDeckSwitcher = $derived(showDeckSwitcher || allDecks.length > 0);

	// Auth handlers
	function handleSignIn() {
		authDialogOpen = true;
		userMenuOpen = false;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	async function handleLogOut() {
		userMenuOpen = false;
		await authStore.signOut();
		toasts.success('Logged out successfully');
		goto('/');
	}

	function toggleDeckSwitcher() {
		deckSwitcherOpen = !deckSwitcherOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu-container')) {
			userMenuOpen = false;
		}
		if (!target.closest('.deck-switcher-container')) {
			deckSwitcherOpen = false;
		}
	}

	// Create new deck handler
	async function handleCreateNewDeck() {
		const newDeck = await nextDeckStore.createNewDeck();
		if (newDeck) {
			toasts.success('✨ New deck created!');
			// Reload decks list
			allDecks = await nextDb.getAllDecks();
			goto(`/${newDeck.id}`);
		}
	}

	// Generate deck handler
	function handleGenerateDeck() {
		dialogStore.setContent(AiDeckGenerationDialog, {});
	}

	// Deck switcher handlers
	async function handleSelectDeck(deckId: string) {
		deckSwitcherOpen = false;
		// Load the deck into the store first
		await nextDeckStore.loadDeck(deckId);
		// Then navigate to it
		goto(`/${deckId}`);
	}

	function handleNewDeckFromSwitcher() {
		deckSwitcherOpen = false;
		handleCreateNewDeck();
	}
</script>

<header class="app-header">
	<!-- Row 1: App Navigation & Account -->
	<div class="header-top-bar">
		<a href="/" class="brand">
			<svg class="brand-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
				<circle cx="256" cy="256" r="150" fill="white" />
				<path
					d="m206.893 18.176-27.23 74.533-84.936-28.235 17.134 83.593-86.297 25.768 51.99 54.76-59.252 48.69 93.805 25.314-72.3 67.283 50.978 13.012-22.8 51.867 60.937-37.405-13.543 86.213 100.975-61.183 39.156 75.894 39.135-61.16 77.744 46.284-2.74-93.998 85.386 35.367-31.36-70.043 48.653 1.272-42.88-52.065 63.88-19.67-63.064-36.73 57.404-72.982-70.96-12.328 66.82-100.553-109.022 44.486 13.414-65.402-71.193 58.504-13.135-65.244-41.22 52.388-55.477-68.23zm52.345 90.98h.047c82.104 0 146.59 52.22 146.59 113.3 0 19.404-9.242 30.604-25.768 41.433-16.525 10.827-40.02 19.56-63.863 30.28l-7.377 3.318 26.863 93.87c-8.333 2.637-17.08 4.926-26.1 6.845l-20.482-46.38-2.753 50.406a329.214 329.214 0 0 1-24.26 2.377l-10.55-51.603-12.626 52.178a292.36 292.36 0 0 1-24.138-1.274l-2.656-49.922-20.033 46.727c-9.805-1.852-19.24-4.285-28.1-7.36l34.276-92.197-6.82-3.953c-19.516-11.314-40.035-21.866-54.97-33.846-14.936-11.98-23.823-24.21-23.823-40.902 0-61.068 64.46-113.278 146.54-113.3zm62.9 55.53c-29.543-.155-56.048 24.43-50.378 65.375 10.284 74.273 136.613 22.558 103.254-32.357-13.756-22.645-33.94-32.915-52.877-33.016zm-140.925.486c-17.51.267-34.493 10.685-42.723 36.69-16.22 51.262 72.746 97.79 95.4 26.2 10.138-32.038-20.812-62.226-50.982-62.884a43.536 43.536 0 0 0-1.695-.006zm3.63 21.062c16.585 0 30.23 13.645 30.23 30.23 0 16.587-13.645 30.23-30.23 30.23-16.583 0-30.23-13.643-30.23-30.23 0-16.584 13.646-30.23 30.23-30.23zm0 18.69c-6.484 0-11.54 5.056-11.54 11.54 0 6.488 5.055 11.544 11.54 11.544 6.487 0 11.544-5.056 11.544-11.543 0-6.487-5.057-11.54-11.543-11.54zm139.764 0c6.486 0 11.543 5.054 11.543 11.54 0 6.488-5.057 11.544-11.543 11.544-6.485 0-11.54-5.056-11.54-11.543 0-6.485 5.055-11.54 11.54-11.54zm-70.613 55.105-22.414 49.923h37.188l-14.774-49.924z"
					fill="#d0021b"
				/>
			</svg>
			<span class="brand-name">Astounding Cards</span>
		</a>

		<div class="top-bar-actions">
			{#if !hideGalleryLink}
				<a href="/gallery" class="top-bar-link">
					<Library size={14} />
					<span>Gallery</span>
				</a>
			{/if}

			<!-- Generate Deck button -->
			<button class="top-bar-link generate-button" onclick={handleGenerateDeck}>
				<Sparkles size={14} />
				<span>Generate</span>
			</button>

			<!-- Deck Switcher (show when there are decks) -->
			{#if shouldShowDeckSwitcher}
				<div class="deck-switcher-container">
					<button class="deck-switcher-button" onclick={toggleDeckSwitcher}>
						<span>My Decks ({allDecks.length})</span>
						<ChevronDown size={12} />
					</button>

					{#if deckSwitcherOpen}
						<div class="deck-switcher-menu">
							<DeckSwitcher
								decks={allDecks.map((d) => ({
									id: d.id,
									title: d.meta.title,
									cardCount: d.cards.length
								}))}
								currentDeckId={activeDeckId}
								onSelectDeck={handleSelectDeck}
								onNewDeck={handleNewDeckFromSwitcher}
							/>
						</div>
					{/if}
				</div>
			{:else}
				<!-- New Deck button -->
				<button class="top-bar-link new-deck-button" onclick={handleCreateNewDeck}>
					<Plus size={14} />
					<span>New Deck</span>
				</button>
			{/if}

			<!-- Auth Badge / Dashboard Link -->
			{#if authenticated}
				<div class="token-balance">
					<Coins size={14} />
					<span class="token-amount">{tokenBalance.toLocaleString()}</span>
				</div>

				<div class="user-menu-container">
					<button class="user-badge success" onclick={toggleUserMenu}>
						<span class="user-initial">{userInitial}</span>
						<span>Dashboard</span>
						<ChevronDown size={12} />
					</button>

					{#if userMenuOpen}
						<div class="user-menu">
							<a href="/dashboard" class="user-menu-item">
								<Library size={14} />
								<span>Dashboard</span>
							</a>
							<button class="user-menu-item" onclick={handleLogOut}>
								<LogOut size={14} />
								<span>Log Out</span>
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button class="user-badge warning" onclick={handleSignIn}>
					<LogIn size={14} />
					<span>Log in / Sign up <small>(free)</small></span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Row 2: Title + Metadata (flexible via snippets) -->
	{#if title || metadata}
		<section class="header-content-bar">
			<div class="header-content-bar_inner">
				{#if title}
					<div class="title-row">
						<h1 class="page-title">{title}</h1>
						{#if isGalleryView}
							<span class="gallery-badge">📖 Gallery View</span>
						{/if}
						{#if onTitleEdit}
							<button class="title-edit-button" onclick={onTitleEdit} aria-label="Edit title">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
								</svg>
							</button>
						{/if}
					</div>
				{/if}

				{#if metadata}
					<div class="metadata-row">
						{@render metadata()}
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- Row 3: Actions (flexible via snippet) -->
	{#if actions}
		<div class="header-actions-bar">
			{@render actions()}
		</div>
	{/if}
</header>

<AuthDialog bind:open={authDialogOpen} />
<svelte:window onclick={handleClickOutside} />

<style>
	.app-header {
		background: var(--ui-bg, #ffffff);
	}

	.header-top-bar,
	.header-actions-bar {
		padding: 0 2rem;
		margin: 0 auto;
		max-width: var(--page-max-width);
	}

	/* Top Bar - App brand + Gallery + Auth */
	.header-top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		padding: 0.25rem 0;
		transition: opacity 0.2s;
	}

	.brand:hover {
		opacity: 0.8;
	}

	.brand-icon {
		width: 3rem;
		height: 3rem;
		display: block;
		flex-shrink: 0;
	}

	.brand-name {
		font-size: 1.425rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
		padding-left: 0.1rem;
	}

	.top-bar-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Top bar link style */
	.top-bar-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background: transparent;
		color: var(--ui-text, #1a202c);
		font-size: 0.8125rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.top-bar-link:hover {
		background: var(--ui-bg, #ffffff);
	}

	/* New Deck button - same style as link but it's a button */
	.new-deck-button {
		border: none;
		cursor: pointer;
		font-family: inherit;
	}

	.new-deck-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	/* Generate button - special AI styling */
	.generate-button {
		border: none;
		cursor: pointer;
		font-family: inherit;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white !important;
		font-weight: 500;
	}

	.generate-button:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);
	}

	/* Row 2: Content Bar - Title + Metadata */
	.header-content-bar {
		padding: 1rem 2rem;
		background: var(--brand);
		color: var(--header-content-text, white);
		position: relative;
		background: var(--brand);
	}

	.header-content-bar_inner {
		padding: 0 2rem;
		margin: 0 auto;
		max-width: var(--page-max-width);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: var(--header-content-text, white);
		line-height: 1.2;
	}

	.gallery-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.25);
		color: white;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.title-edit-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		background: none;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.title-edit-button:hover {
		color: white;
		background: rgba(255, 255, 255, 0.1);
	}

	.metadata-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.875rem;
	}

	/* Row 3: Actions Bar */
	.header-actions-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		justify-content: flex-end;
		padding: 0.475rem 2rem;
		flex-wrap: wrap;
	}

	/* Deck Switcher */
	.deck-switcher-container {
		position: relative;
	}

	.deck-switcher-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.deck-switcher-button:hover {
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.deck-switcher-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	/* User Menu */
	.user-menu-container {
		position: relative;
	}

	.user-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
		min-width: 160px;
		overflow: hidden;
	}

	.user-menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		width: 100%;
		border: none;
		background: none;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.2s ease;
		font-family: inherit;
		text-align: left;
	}

	.user-menu-item:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	/* User Badge */
	.user-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 4px;
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.user-badge.success {
		background: var(--success-bg, #d1fae5);
		color: var(--success-text, #065f46);
	}

	.user-badge.success:hover {
		background: #a7f3d0;
	}

	.user-badge.warning {
		background: var(--warning-bg, #fef3c7);
		color: var(--warning-text, #92400e);
	}

	.user-badge.warning:hover {
		background: #fde68a;
	}

	.user-initial {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: var(--success-text, #065f46);
		color: white;
		font-size: 0.625rem;
		font-weight: 600;
	}

	/* Token Balance */
	.token-balance {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: var(--warning-bg, #fef3c7);
		color: var(--warning-text, #92400e);
		border-radius: 4px;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.token-amount {
		line-height: 1;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.header-top-bar {
			padding: 0.5rem;
			flex-wrap: wrap;
		}

		.brand-name {
			font-size: 0.875rem;
		}

		.top-bar-actions {
			gap: 0.5rem;
			flex-wrap: wrap;
		}

		.header-content-bar {
			padding: 0.75rem 0.5rem;
		}

		.page-title {
			font-size: 1.25rem;
		}

		.metadata-row {
			gap: 0.75rem;
		}

		.header-actions-bar {
			padding: 0.75rem 0.5rem;
			gap: 0.5rem;
		}
	}

	@media (max-width: 480px) {
		.page-title {
			font-size: 1.125rem;
		}
	}
</style>
