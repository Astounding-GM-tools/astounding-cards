<script lang="ts">
	import type { ComponentType } from 'svelte';

	import OverflowMenu from '../ui/OverflowMenu.svelte';
	import { Heart, Plus, Share2, Wand2 } from 'lucide-svelte';

	interface ActionDropdownItem {
		label: string;
		icon?: ComponentType;
		onClick: () => void;
		disabled?: boolean;
	}

	interface Props {
		onShare?: (() => void) | null;
		onImport?: (() => void) | null;
		onAddCard?: (() => void) | null;
		onPublish?: (() => void) | null;
		onExportJson?: (() => void) | null;
		onDeleteDeck?: (() => void) | null;
		onGenerateDeck?: (() => void) | null;
		onImportCards?: (() => void) | null;
		onDuplicateDeck?: (() => void) | null;
		onGenerateImages?: (() => void) | null;
		isAuthenticated?: boolean;
		disabled?: boolean;
		importing?: boolean;
		isLiked?: boolean;
		likeCount?: number;
	}

	let {
		onAddCard,
		onShare,
		onExportJson,
		onPublish,
		onGenerateDeck,
		onGenerateImages,
		onImportCards,
		onDuplicateDeck,
		onDeleteDeck,
		onImport,
		isAuthenticated = false,
		disabled = false,
		importing = false,
		isLiked = false,
		likeCount = 0
	}: Props = $props();

	// Share dropdown state
	let shareOpen = $state(false);

	// Generate dropdown state
	let generateOpen = $state(false);

	function toggleShare() {
		shareOpen = !shareOpen;
	}

	function toggleGenerate() {
		if (isAuthenticated) {
			generateOpen = !generateOpen;
		}
	}

	function handleShareUrl() {
		onShare?.();
		shareOpen = false;
	}

	function handleExportJson() {
		onExportJson?.();
		shareOpen = false;
	}

	function handlePublish() {
		onPublish?.();
		shareOpen = false;
	}

	function handleGenerateDeck() {
		onGenerateDeck?.();
		generateOpen = false;
	}

	function handleGenerateImages() {
		onGenerateImages?.();
		generateOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.dropdown-container')) {
			shareOpen = false;
			generateOpen = false;
		}
	}

	// Overflow menu items
	let overflowItems = $derived(
		[
			onImportCards && {
				label: 'Import Cards',
				onClick: onImportCards,
				disabled
			},
			onDuplicateDeck && {
				label: 'Duplicate Deck',
				onClick: onDuplicateDeck,
				disabled
			},
			onDeleteDeck && {
				label: 'Delete Deck',
				onClick: onDeleteDeck,
				disabled
			}
		].filter(Boolean) as ActionDropdownItem[]
	);
</script>

<div class="deck-actions">
	<!-- Generate Dropdown -->
	{#if onGenerateDeck || onGenerateImages}
		<div class="dropdown-container">
			<button
				class="action-button"
				class:disabled-visible={!isAuthenticated}
				onclick={toggleGenerate}
				{disabled}
				title={isAuthenticated ? '' : 'Sign in to use AI generation'}
			>
				<Wand2 size={16} />
				<span>Generate</span>
			</button>

			{#if generateOpen && isAuthenticated}
				<div class="dropdown-menu">
					{#if onGenerateDeck}
						<button class="dropdown-item" onclick={handleGenerateDeck}>Full Deck</button>
					{/if}
					{#if onGenerateImages}
						<button class="dropdown-item" onclick={handleGenerateImages}>Deck Images</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Share Dropdown -->
	{#if onShare || onExportJson || onPublish}
		<div class="dropdown-container">
			<button class="action-button" onclick={toggleShare} {disabled}>
				<Share2 size={16} />
				<span>Share</span>
			</button>

			{#if shareOpen}
				<div class="dropdown-menu">
					{#if onShare}
						<button class="dropdown-item" onclick={handleShareUrl}>Share URL</button>
					{/if}
					{#if onExportJson}
						<button class="dropdown-item" onclick={handleExportJson}>Export JSON</button>
					{/if}
					{#if onPublish}
						<button class="dropdown-item" onclick={handlePublish}>Publish to Gallery</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Add Card -->
	{#if onAddCard}
		<button class="action-button" onclick={onAddCard} {disabled}>
			<Plus size={16} />
			<span>Add Card</span>
		</button>
	{/if}

	<!-- Import/Like Button (for shared decks) -->
	{#if onImport}
		<button
			class="action-button like-button"
			class:liked={isLiked}
			onclick={onImport}
			disabled={importing || disabled}
		>
			{#if importing}
				<div class="button-spinner"></div>
				<span>Adding...</span>
			{:else}
				<Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
				{#if likeCount > 0}
					<span>{likeCount}</span>
				{:else}
					<span>Like</span>
				{/if}
			{/if}
		</button>
	{/if}

	<!-- Overflow Menu -->
	{#if overflowItems.length > 0}
		<OverflowMenu items={overflowItems} />
	{/if}
</div>

<svelte:window onclick={handleClickOutside} />

<style>
	.deck-actions {
		display: flex;
		gap: 0.475rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.is-liked {
		fill: var(--brand);
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.175rem 1rem;
		border: none;
		border-radius: 4px;
		background: var(--brand);
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.action-button:hover:not(:disabled) {
		background: #a80116;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.action-button.disabled-visible {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-button.disabled-visible:hover {
		transform: none;
		box-shadow: none;
		background: var(--brand);
	}

	.action-button.like-button {
		background: #dc2626;
	}

	.action-button.like-button:hover:not(:disabled) {
		background: #b91c1c;
	}

	.action-button.like-button.liked {
		background: #ef4444;
	}

	.action-button.like-button.liked:hover:not(:disabled) {
		background: #dc2626;
	}

	.button-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Dropdowns */
	.dropdown-container {
		position: relative;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		min-width: 200px;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 50;
	}

	.dropdown-item {
		width: 100%;
		display: block;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--ui-text, #1a202c);
		transition: background 0.2s;
	}

	.dropdown-item:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.deck-actions {
			gap: 0.5rem;
		}

		.action-button {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}
	}
</style>
