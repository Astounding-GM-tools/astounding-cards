<script lang="ts">
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import {
		AiPromptDialog,
		DeckManagerDialog,
		CardEditDialog,
		ImageMigrationDialog
	} from '../dialogs/index.js';
	import AiBatchImageGenerationDialog from '../dialogs/AiBatchImageGenerationDialog.svelte';
	import { generateShareUrl } from '$lib/next/utils/shareUrlUtils.js';
	import { toasts } from '$lib/stores/toast.js';
	import BinaryToggle from '../ui/BinaryToggle.svelte';
	import OverflowMenu from '../ui/OverflowMenu.svelte';
	import type { Layout } from '../../types/deck.js';
	import { createEventDispatcher } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/next/stores/auth';
	import AuthDialog from '../dialogs/AuthDialog.svelte';
	import {
		Library,
		User,
		LogIn,
		LogOut,
		FolderOpen,
		Plus,
		Share2,
		Images
	} from 'lucide-svelte';

	// Props for flexible header
	interface Props {
		title?: string;
		onTitleEdit?: () => void;
		metadata?: import('svelte').Snippet;
		actions?: import('svelte').Snippet;
		// Mock overrides for testing/stories
		mockIsAuthenticated?: boolean;
		mockUserEmail?: string;
		mockDeckCount?: number;
	}

	let {
		title = 'Astounding Cards',
		onTitleEdit,
		metadata,
		actions,
		mockIsAuthenticated,
		mockUserEmail,
		mockDeckCount
	}: Props = $props();

	// Derived state from store or mocks
	let authenticated = $derived(mockIsAuthenticated ?? $isAuthenticated);
	let userEmail = $derived(mockUserEmail ?? $user?.email);
	let deckCount = $derived(mockDeckCount ?? 0); // TODO: Get from actual deck store

	// Auth dialog state
	let authDialogOpen = $state(false);

	// User menu state
	let userMenuOpen = $state(false);

	// Deck switcher menu state
	let deckSwitcherOpen = $state(false);

	// Auth handlers
	function handleSignIn() {
		authDialogOpen = true;
		userMenuOpen = false;
	}

	async function handleSignOut() {
		const { error } = await authStore.signOut();
		if (error) {
			toasts.error('Failed to sign out');
		} else {
			toasts.success('Signed out successfully');
		}
		userMenuOpen = false;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
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
</script>

<header class="app-header">
	<!-- Row 1: App Navigation & Account -->
	<div class="header-top-bar">
		<div class="brand">
			<!-- TODO: Add favicon.svg here -->
			<span class="brand-name">Astounding Cards</span>
		</div>

		<div class="top-bar-actions">
			<a href="/next/gallery" class="action-button">
				<Library size={16} />
				<span>Gallery</span>
			</a>

			<!-- Auth / Deck Switcher -->
			{#if authenticated}
				<!-- Deck Switcher -->
				<div class="deck-switcher-container">
					<button class="deck-switcher-button" onclick={toggleDeckSwitcher}>
						<span>{deckCount} {deckCount === 1 ? 'deck' : 'decks'}</span>
						<span class="caret">⌓</span>
					</button>

					{#if deckSwitcherOpen}
						<div class="deck-switcher-menu">
							<!-- TODO: List of decks + New Deck option -->
							<div class="menu-placeholder">Deck list goes here</div>
						</div>
					{/if}
				</div>

				<!-- User Menu -->
				<div class="user-menu-container">
					<button class="user-button" onclick={toggleUserMenu}>
						<span class="user-email">{userEmail}</span>
						<User size={16} />
					</button>

					{#if userMenuOpen}
						<div class="user-menu">
							<div class="user-menu-header">
								<span class="user-email-full">{userEmail}</span>
							</div>
							<button class="user-menu-item" onclick={handleSignOut}>
								<LogOut size={16} />
								<span>Sign Out</span>
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button class="action-button" onclick={handleSignIn}>
					<LogIn size={16} />
					<span>Sign In</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Row 2: Title + Metadata (flexible via snippets) -->
	{#if title || metadata}
		<div class="header-content-bar">
			{#if title}
				<div class="title-row">
					<h1 class="page-title">{title}</h1>
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
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		margin-bottom: 1.5rem;
	}

	/* Top Bar - App brand + Gallery + Auth */
	.header-top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.brand {
		display: flex;
		align-items: center;
	}

	.brand-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.top-bar-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	/* Row 2: Content Bar - Title + Metadata */
	.header-content-bar {
		padding: 1rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
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
		color: var(--ui-text, #1a202c);
		line-height: 1.2;
	}

	.title-edit-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		background: none;
		color: var(--ui-muted, #64748b);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.title-edit-button:hover {
		color: var(--ui-text, #1a202c);
		background: var(--ui-hover-bg, #f8fafc);
	}

	.metadata-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	/* Row 3: Actions Bar */
	.header-actions-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-top: 1px solid var(--ui-border, #e2e8f0);
		flex-wrap: wrap;
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		text-decoration: none;
	}

	.action-button:hover:not(:disabled) {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.action-button.primary {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.action-button.primary:hover:not(:disabled) {
		background: var(--button-primary-hover-bg, #2563eb);
		border-color: var(--button-primary-hover-bg, #2563eb);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.header-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.dev-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.dev-button {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.dev-button:hover:not(:disabled) {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.dev-button.danger {
		color: var(--toast-error, #dc2626);
		border-color: var(--toast-error, #dc2626);
	}

	.dev-button.danger:hover:not(:disabled) {
		background: var(--toast-error, #dc2626);
		color: white;
	}

	.dev-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Deck Switcher */
	.deck-switcher-container {
		position: relative;
	}

	.deck-switcher-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.deck-switcher-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.deck-switcher-button .caret {
		font-size: 1rem;
		color: var(--ui-muted, #64748b);
	}

	.deck-switcher-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 250px;
		max-height: 400px;
		overflow-y: auto;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	.menu-placeholder {
		padding: 1rem;
		text-align: center;
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
	}

	/* Auth UI */
	.user-menu-container {
		position: relative;
	}

	.user-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.user-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.user-email {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 200px;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	.user-menu-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.user-email-full {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		word-break: break-all;
	}

	.user-menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--ui-text, #1a202c);
		transition: background 0.2s;
	}

	.user-menu-item:hover {
		background: var(--ui-hover-bg, #f8fafc);
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

		.action-button {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}
	}

	@media (max-width: 480px) {
		.page-title {
			font-size: 1.125rem;
		}

		.action-button {
			padding: 0.5rem 0.625rem;
			font-size: 0.75rem;
		}
	}
</style>
