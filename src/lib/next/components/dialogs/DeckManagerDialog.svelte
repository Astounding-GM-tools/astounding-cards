<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDb } from '$lib/next/stores/database.js';
	import { JsonImportDialog } from './index.js';
	import { downloadDeckAsJson } from '$lib/next/utils/jsonExporter.js';
	import { toasts } from '$lib/stores/toast.js';
	import BinaryToggle from '../ui/BinaryToggle.svelte';
	import { formatTime } from '$lib/next/utils/dateUtils.js';
	import AiDeckGenerationDialog from './AiDeckGenerationDialog.svelte';
	import PublishDeckDialog from './PublishDeckDialog.svelte';
	import type { Deck } from '$lib/next/types/deck.js';
	import { isAuthenticated } from '$lib/next/stores/auth.js';
	import { authenticatedFetch } from '$lib/utils/authenticated-fetch.js';

	// Local state
	let availableDecks = $state<Deck[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showCreateForm = $state(false);
	let showDeleteConfirm = $state<string | null>(null);
	let showDuplicateConfirm = $state<string | null>(null);
	let newDeckName = $state('');
	let duplicateDeckName = $state('');
	let editingDeckId = $state<string | null>(null);
	let editingDeckName = $state('');
	let isDuplicating = $state(false);
	let exportComplete = $state(false); // false = Light, true = Complete
	// Track published status for each deck
	let publishedDecks = $state<Record<string, string>>({}); // deckId -> publishedDeckId

	// Current deck from store
	let currentDeck = $derived(nextDeckStore.deck);

	// Load available decks on mount
	async function loadDecks() {
		isLoading = true;
		error = null;

		try {
			const decks = await nextDb.getAllDecks();
			availableDecks = decks;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load decks';
		} finally {
			isLoading = false;
		}
	}

	// Initialize when component mounts
	$effect(() => {
		loadDecks();
		loadPublishedStatus();
	});

	// Handle deck selection
	async function selectDeck(deckId: string) {
		const success = await nextDeckStore.selectDeck(deckId);
		if (success) {
			dialogStore.close();
		}
	}

	// Handle new deck creation
	async function createDeck() {
		const name = newDeckName.trim();
		if (!name) return;

		const success = await nextDeckStore.createDeck(name);
		if (success) {
			newDeckName = '';
			showCreateForm = false;
			await loadDecks(); // Refresh list
		}
	}

	// Focus management for create form
	let createFormInput = $state<HTMLInputElement>();

	function showCreateFormAndFocus() {
		showCreateForm = true;
		// Use setTimeout to ensure the input is rendered before focusing
		setTimeout(() => {
			if (createFormInput) {
				createFormInput.focus();
			}
		}, 0);
	}

	// Handle deck deletion
	async function deleteDeck(deckId: string) {
		try {
			await nextDb.deleteDeck(deckId);

			// If we just deleted the current deck, clear it
			if (currentDeck?.id === deckId) {
				nextDeckStore.clearDeck();
			}

			await loadDecks(); // Refresh list
			showDeleteConfirm = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete deck';
		}
	}

	// Handle deck renaming
	async function startEditingName(deck: Deck) {
		editingDeckId = deck.id;
		editingDeckName = deck.meta.title;
	}

	async function saveEditedName() {
		if (!editingDeckId || !editingDeckName.trim()) return;

		try {
			await nextDb.updateDeckMeta(editingDeckId, { title: editingDeckName.trim() });

			// If we just renamed the current deck, update it
			if (currentDeck?.id === editingDeckId) {
				await nextDeckStore.loadDeck(editingDeckId);
			}

			await loadDecks(); // Refresh list
			editingDeckId = null;
			editingDeckName = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to rename deck';
		}
	}

	function cancelEditing() {
		editingDeckId = null;
		editingDeckName = '';
	}

	// Handle deck duplication
	function startDuplicating(deck: Deck) {
		showDuplicateConfirm = deck.id;
		duplicateDeckName = `${deck.meta.title} (Copy)`;
	}

	async function duplicateDeck(deckId: string) {
		if (!duplicateDeckName.trim()) return;

		isDuplicating = true;
		try {
			const duplicatedDeck = await nextDeckStore.duplicateDeckById(
				deckId,
				duplicateDeckName.trim()
			);

			if (duplicatedDeck) {
				await loadDecks(); // Refresh list
				showDuplicateConfirm = null;
				duplicateDeckName = '';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to duplicate deck';
		} finally {
			isDuplicating = false;
		}
	}

	// Handle AI Deck Generator
	function handleAiDeckGenerator() {
		dialogStore.setContent(AiDeckGenerationDialog);
	}

	// Handle deck publishing
	function handlePublish(deck: Deck) {
		dialogStore.setContent(PublishDeckDialog, {
			deck,
			publishedDeckId: publishedDecks[deck.id],
			onPublished: () => {
				// Refresh to get updated published status
				loadDecks();
				loadPublishedStatus();
			}
		});
	}

	// Load published status for all decks
	async function loadPublishedStatus() {
		if (!$isAuthenticated) return;

		try {
			const response = await fetch('/api/decks/gallery?limit=100', {
				headers: getAuthHeaders()
			});

			if (response.ok) {
				const result = await response.json();
				const statusMap: Record<string, string> = {};
				// Note: This is a simplified check - in reality we'd need a way to link
				// local deck IDs to published deck IDs. For MVP, we'll check by title match.
				for (const publishedDeck of result.decks) {
					const localDeck = availableDecks.find((d) => d.meta.title === publishedDeck.title);
					if (localDeck) {
						statusMap[localDeck.id] = publishedDeck.id;
					}
				}
				publishedDecks = statusMap;
			}
		} catch (err) {
			console.error('Failed to load published status:', err);
		}
	}

	// Handle unpublish
	async function handleUnpublish(deckId: string) {
		const publishedId = publishedDecks[deckId];
		if (!publishedId) return;

		try {
			const response = await fetch(`/api/decks/${publishedId}/unpublish`, {
				method: 'DELETE',
				headers: getAuthHeaders()
			});

			if (response.ok) {
				toasts.success('Deck unpublished successfully');
				const { [deckId]: removed, ...rest } = publishedDecks;
				publishedDecks = rest;
			} else {
				throw new Error('Failed to unpublish deck');
			}
		} catch (error) {
			console.error('Unpublish error:', error);
			toasts.error('Failed to unpublish deck');
		}
	}
</script>

<div class="deck-manager-dialog">
	<div class="dialog-header">
		<h2>📚 Deck Management</h2>
		<div class="header-actions">
			<button
				class="action-button"
				onclick={() => dialogStore.setContent(JsonImportDialog)}
				title="Import deck from JSON"
			>
				📥 Import
			</button>
			{#if currentDeck}
				<div
					class="export-section"
					title={exportComplete
						? 'Complete export includes all images embedded (larger file, works offline)'
						: 'Light export includes only image URLs (smaller file, requires internet)'}
				>
					<BinaryToggle
						checked={exportComplete}
						onToggle={(isComplete) => {
							exportComplete = isComplete;
						}}
						falseLabel="○ Light"
						trueLabel="● Complete"
						name="export-type"
						size="sm"
					/>
					<button
						class="action-button export"
						onclick={async () => {
							try {
								await downloadDeckAsJson(currentDeck, exportComplete);
								const type = exportComplete ? 'Complete' : 'Light';
								toasts.success(`${type} deck export completed!`);
							} catch (error) {
								console.error('Export failed:', error);
								toasts.error('Failed to export deck');
							}
						}}
						title={`Export current deck to JSON (${exportComplete ? 'complete with images' : 'light with URLs only'})`}
					>
						📤 Export
					</button>
				</div>
			{/if}
			<button class="action-button primary" onclick={showCreateFormAndFocus}> ➕ New Deck </button>
			<button class="close-button" onclick={() => dialogStore.close()}>×</button>
		</div>
	</div>

	<div class="dialog-content">
		<!-- Create new deck form (shown at top when creating) -->
		{#if showCreateForm}
			<div class="create-section">
				<div class="create-form">
					<input
						bind:this={createFormInput}
						type="text"
						bind:value={newDeckName}
						placeholder="Enter deck name"
						class="new-deck-input"
						onkeydown={(e) => {
							if (e.key === 'Enter') createDeck();
							if (e.key === 'Escape') {
								showCreateForm = false;
								newDeckName = '';
							}
						}}
					/>
					<button class="action-button create" onclick={createDeck}>Create</button>
					<button
						class="action-button cancel"
						onclick={() => {
							showCreateForm = false;
							newDeckName = '';
						}}>Cancel</button
					>
				</div>
			</div>
		{/if}

		<!-- Prominent Generator Buttons -->
		<div class="ai-generator-section">
			<button class="ai-generator-button" onclick={handleAiDeckGenerator}>
				<div class="ai-button-icon">🎴</div>
				<div class="ai-button-content">
					<div class="ai-button-title">Generate Deck Instantly</div>
					<div class="ai-button-description">
						Create themed decks in seconds - fast, easy, and affordable!
					</div>
				</div>
				<div class="ai-button-arrow">→</div>
			</button>
		</div>

		{#if isLoading}
			<div class="loading">Loading decks...</div>
		{:else if error}
			<div class="error">{error}</div>
		{:else if availableDecks.length === 0}
			<div class="empty-state">
				<p>No decks found. Create your first deck to get started!</p>
			</div>
		{:else}
			<div class="deck-list">
				{#each availableDecks as deck (deck.id)}
					<div class="deck-item" class:current={currentDeck?.id === deck.id}>
						{#if editingDeckId === deck.id}
							<div class="deck-edit">
								<input
									type="text"
									bind:value={editingDeckName}
									class="deck-name-input"
									onkeydown={(e) => {
										if (e.key === 'Enter') saveEditedName();
										if (e.key === 'Escape') cancelEditing();
									}}
								/>
								<button class="save-button" onclick={saveEditedName}>✓</button>
								<button class="cancel-button" onclick={cancelEditing}>×</button>
							</div>
						{:else}
							<div class="deck-info">
								<div class="deck-main">
									<div class="deck-title-row">
										<h3 class="deck-title">{deck.meta.title}</h3>
										{#if publishedDecks[deck.id]}
											<span class="published-badge" title="Published to gallery">🌍 Published</span>
										{/if}
									</div>
									<div class="deck-meta">
										<span class="card-count">{deck.cards.length} cards</span>
										<span class="deck-date">Created {formatTime(deck.meta.createdAt, 'date')}</span>
										{#if deck.meta.lastEdited !== deck.meta.createdAt}
											<span class="deck-date">Modified {formatTime(deck.meta.lastEdited)}</span>
										{/if}
									</div>
								</div>

								<div class="deck-actions">
									{#if currentDeck?.id !== deck.id}
										<button class="action-button select" onclick={() => selectDeck(deck.id)}>
											Select
										</button>
									{:else}
										<span class="current-indicator">Current</span>
									{/if}

									{#if $isAuthenticated}
										{#if publishedDecks[deck.id]}
											<button
												class="action-button publish"
												onclick={() => handlePublish(deck)}
												title="Update published deck"
											>
												🔄
											</button>
											<button
												class="action-button unpublish"
												onclick={() => handleUnpublish(deck.id)}
												title="Unpublish from gallery"
											>
												🌐⨯
											</button>
										{:else}
											<button
												class="action-button publish"
												onclick={() => handlePublish(deck)}
												title="Publish to gallery"
											>
												🌍
											</button>
										{/if}
									{/if}

									<button
										class="action-button copy"
										onclick={() => startDuplicating(deck)}
										title="Copy deck"
									>
										⧉
									</button>

									<button
										class="action-button edit"
										onclick={() => startEditingName(deck)}
										title="Rename deck"
									>
										✎
									</button>

									<button
										class="action-button delete"
										onclick={() => (showDeleteConfirm = deck.id)}
										title="Delete deck"
									>
										⌫
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Delete confirmation overlay -->
{#if showDeleteConfirm}
	{@const deckToDelete = availableDecks.find((d) => d.id === showDeleteConfirm)}
	<div
		class="overlay"
		role="button"
		tabindex="0"
		onclick={() => (showDeleteConfirm = null)}
		onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = null)}
	></div>
	<div class="confirm-dialog">
		<h3>Delete Deck?</h3>
		<p>Are you sure you want to delete "<strong>{deckToDelete?.meta.title}</strong>"?</p>
		<p class="warning">
			This will permanently delete all {deckToDelete?.cards.length} cards in the deck.
		</p>
		<div class="confirm-actions">
			<button class="action-button danger" onclick={() => deleteDeck(showDeleteConfirm!)}>
				Delete Forever
			</button>
			<button class="action-button cancel" onclick={() => (showDeleteConfirm = null)}>
				Cancel
			</button>
		</div>
	</div>
{/if}

<!-- Duplicate confirmation dialog -->
{#if showDuplicateConfirm}
	{@const deckToDuplicate = availableDecks.find((d) => d.id === showDuplicateConfirm)}
	<div
		class="overlay"
		role="button"
		tabindex="0"
		onclick={() => {
			showDuplicateConfirm = null;
			duplicateDeckName = '';
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				showDuplicateConfirm = null;
				duplicateDeckName = '';
			}
		}}
	></div>
	<div class="confirm-dialog">
		<h3>Copy Deck</h3>
		<p>Create a copy of "<strong>{deckToDuplicate?.meta.title}</strong>"?</p>
		<div class="duplicate-form">
			<label for="duplicate-name-input">New deck name:</label>
			<input
				id="duplicate-name-input"
				type="text"
				bind:value={duplicateDeckName}
				class="duplicate-name-input"
				placeholder="Enter new deck name"
				disabled={isDuplicating}
				onkeydown={(e) => {
					if (e.key === 'Enter' && duplicateDeckName.trim()) {
						duplicateDeck(showDuplicateConfirm!);
					}
					if (e.key === 'Escape') {
						showDuplicateConfirm = null;
						duplicateDeckName = '';
					}
				}}
			/>
		</div>
		<div class="confirm-actions">
			<button
				class="action-button primary"
				onclick={() => duplicateDeck(showDuplicateConfirm!)}
				disabled={isDuplicating || !duplicateDeckName.trim()}
			>
				{isDuplicating ? 'Copying...' : 'Create Copy'}
			</button>
			<button
				class="action-button cancel"
				onclick={() => {
					showDuplicateConfirm = null;
					duplicateDeckName = '';
				}}
				disabled={isDuplicating}
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<style>
	.deck-manager-dialog {
		background: white;
		border-radius: 8px;
		max-width: 600px;
		width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		color: var(--ui-muted, #64748b);
		border-radius: 4px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
	}

	.dialog-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.loading,
	.error {
		text-align: center;
		padding: 2rem;
		color: var(--ui-muted, #64748b);
	}

	.error {
		color: var(--toast-error, #dc2626);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--ui-muted, #64748b);
	}

	.deck-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.deck-item {
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		overflow: hidden;
		transition: border-color 0.2s;
	}

	.deck-item.current {
		border-color: var(--button-primary-bg, #3b82f6);
		background: var(--button-primary-bg, #3b82f6);
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
	}

	.deck-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
	}

	.deck-main {
		flex: 1;
	}

	.deck-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.deck-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.published-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(34, 197, 94, 0.1);
		color: #16a34a;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.deck-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		flex-wrap: wrap;
	}

	.card-count {
		font-weight: 500;
	}

	.deck-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-shrink: 0;
	}

	.current-indicator {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--button-primary-bg, #3b82f6);
		padding: 0.25rem 0.75rem;
	}

	.deck-edit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
	}

	.deck-name-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
	}

	.action-button {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.action-button.primary {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.action-button.primary:hover {
		background: var(--button-primary-hover-bg, #2563eb);
	}

	.action-button.select {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.action-button.select:hover {
		background: var(--button-primary-hover-bg, #2563eb);
	}

	.action-button.edit {
		padding: 0.5rem;
		min-width: 2rem;
		text-align: center;
	}

	.action-button.delete {
		color: var(--toast-error, #dc2626);
		border-color: var(--toast-error, #dc2626);
	}

	.action-button.delete:hover {
		background: var(--toast-error, #dc2626);
		color: white;
	}

	.action-button.danger {
		background: var(--toast-error, #dc2626);
		color: white;
		border-color: var(--toast-error, #dc2626);
	}

	.action-button.danger:hover {
		background: #b91c1c;
	}

	.save-button,
	.cancel-button {
		padding: 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, #ffffff);
		cursor: pointer;
		min-width: 2rem;
		text-align: center;
	}

	.save-button {
		color: var(--button-primary-bg, #3b82f6);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.save-button:hover {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
	}

	.cancel-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.create-section {
		border: 1px solid var(--button-primary-bg, #3b82f6);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
	}

	.create-form {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.new-deck-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		font-size: 0.875rem;
	}

	/* Confirmation dialog overlay */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
	}

	.confirm-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		max-width: 400px;
		width: 90vw;
		z-index: 1001;
	}

	.confirm-dialog h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.confirm-dialog p {
		margin: 0 0 1rem 0;
		color: var(--ui-text, #1a202c);
	}

	.warning {
		color: var(--toast-error, #dc2626);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.confirm-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.duplicate-form {
		margin: 1rem 0;
	}

	.duplicate-form label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
	}

	.duplicate-name-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		font-size: 0.875rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.duplicate-name-input:focus {
		outline: none;
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.duplicate-name-input:disabled {
		background: var(--ui-hover-bg, #f8fafc);
		cursor: not-allowed;
		opacity: 0.7;
	}

	/* Export section styling */
	.export-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: -16px;
	}

	.export-section :global(.binary-toggle) {
		font-size: 11px;
	}

	.action-button.export {
		padding: 0.4rem 0.6rem;
		font-size: 0.8125rem;
	}

	/* AI Generator Button Styling */
	.ai-generator-section {
		margin-bottom: 1rem;
	}

	.ai-generator-button {
		width: 100%;
		display: flex;
		align-items: center;
		padding: 1.25rem;
		border: 2px solid transparent;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
		cursor: pointer;
		transition: all 0.3s ease;
		gap: 1rem;
		text-align: left;
		font-family: inherit;
		position: relative;
		overflow: hidden;
	}

	.ai-generator-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		transition: left 0.5s ease;
	}

	.ai-generator-button:hover {
		background: linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
		border-color: rgba(147, 51, 234, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(147, 51, 234, 0.2);
	}

	.ai-generator-button:hover::before {
		left: 100%;
	}

	.ai-generator-button:active {
		transform: translateY(0);
		box-shadow: 0 4px 15px rgba(147, 51, 234, 0.15);
	}

	.ai-button-icon {
		font-size: 2rem;
		flex-shrink: 0;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.ai-button-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.ai-button-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #7c3aed;
		margin: 0;
	}

	.ai-button-description {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		line-height: 1.4;
		margin: 0;
	}

	.ai-button-arrow {
		font-size: 1.5rem;
		color: #7c3aed;
		flex-shrink: 0;
		transition: transform 0.3s ease;
	}

	.ai-generator-button:hover .ai-button-arrow {
		transform: translateX(4px);
	}

	/* Responsive design */
	@media (max-width: 480px) {
		.deck-manager-dialog {
			width: 95vw;
			max-height: 85vh;
		}

		.dialog-header,
		.dialog-content {
			padding: 1rem;
		}

		.deck-info {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.deck-actions {
			justify-content: flex-end;
		}

		.create-form {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
