<script lang="ts">
	import {
		currentDeck,
		currentDeckId,
		duplicateDeck,
		copyCardsTo,
		deleteDeck as storeDeleteDeck
	} from '$lib/stores/deck';
	import { deckList } from '$lib/stores/deckList';
	import { getAllDecks, putDeck } from '$lib/db';
	import type { Card, Deck } from '$lib/types';
	import { baseThemes } from '$lib/themes';
	import CardFront from '../cards/CardFront.svelte';
	import ThemeSelect from '../ui/ThemeSelect.svelte';
	import StatblockVocabularyEditor from '../StatblockVocabularyEditor.svelte';
	import { createEventDispatcher } from 'svelte';
	import { toasts } from '$lib/stores/toast';
	import {
		canonUpdateDeck,
		canonDeleteDeck,
		canonDeleteCards,
		canonCopyCards,
		canonUpdateCards,
		isFieldLoading
	} from '$lib/stores/canonUpdate';
	import { configActions } from '$lib/stores/statblockConfig';
	import { configToSimpleVocabulary, simpleVocabularyToConfig } from '$lib/statblockConfigs';
	import type { StatblockVocabulary } from '$lib/types';
	import {
		initializeDeckManagerState,
		toggleCardSelection,
		selectAllCards,
		selectNoCards,
		validateDeckName,
		generateDuplicateName,
		createThemeUpdateParams,
		validateCopyCardsParams,
		validateThemeChangeParams,
		createCardOperationMessage,
		formatDate,
		formatDateTime,
		resetDeckManagerState,
		updateDeckManagerState,
		hasSelectedCards,
		getSelectedCards,
		findMostRecentDeck,
		generateVocabularyConfigName,
		generateVocabularyConfigDescription,
		validateVocabularySave,
		deckHasCards,
		getSelectedCardCount,
		areAllCardsSelected,
		areSomeCardsSelected,
		type DeckManagerState
	} from './DeckManager.svelte.ts';

	const props = $props();
	let deck = $state(props.deck as Deck);

	const dispatch = createEventDispatcher<{
		deckchange: {
			action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCards';
			deckId: string;
		};
	}>();

	function emitDeckChange(e: {
		action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCards';
		deckId: string;
	}) {
		dispatch('deckchange', e);
	}

	let showThemeSelect = $state(false);
	let showDeleteConfirm = $state(false);
	let showDuplicateDialog = $state(false);
	let showManageCardsDialog = $state(false);
	let showCopyCardsDialog = $state(false);
	let showChangeThemeDialog = $state(false);
	let showConfigSelector = $state(false);
	let editingName = $state(false);
	let deleting = $state(false);
	let duplicating = $state(false);
	let deletingCards = $state(false);
	let copyingCards = $state(false);
	let newDeckName = $state('');
	let editedDeckName = $state('');
	let selectedCardIds = $state<string[]>([]);
	let targetDeckId = $state<string | 'new'>('new');
	let availableDecks = $state<Deck[]>([]);
	let selectedThemeForCards = $state<string>('');
	let currentVocabulary = $state<StatblockVocabulary | null>(null);
	let applyingVocabulary = $state(false);

	// Get loading states
	const isThemeUpdating = $derived(isFieldLoading('deck-manager-theme'));
	const isNameUpdating = $derived(isFieldLoading('deck-manager-name'));
	const isDeletingCards = $derived(isFieldLoading('deck-manager-delete-cards'));
	const isCopyingCards = $derived(isFieldLoading('deck-manager-copy-cards'));
	const isChangingTheme = $derived(isFieldLoading('deck-manager-change-theme'));

	function toggleCard(id: string) {
		selectedCardIds = toggleCardSelection(selectedCardIds, id);
	}

	// Select all/none for cards using pure functions
	function selectAll() {
		selectedCardIds = selectAllCards(deck.cards);
	}

	function selectNone() {
		selectedCardIds = selectNoCards();
	}

	async function handleThemeChange(themeId: string) {
		// For DeckManager, we need to handle the deck prop update differently
		const success = await canonUpdateDeck(
			{ theme: themeId },
			['deck-manager-theme'],
			'Updating theme...',
			'Theme updated'
		);

		if (success) {
			// Update local deck prop from current deck store
			if ($currentDeck?.id === deck.id) {
				deck = $currentDeck;
			}
			emitDeckChange({ action: 'update', deckId: deck.id });
			showThemeSelect = false;
		}
	}

	async function loadAvailableDecks() {
		// Include all decks (including current) for copy operations
		availableDecks = await getAllDecks();
	}

	async function handleCopyCards() {
		if (selectedCardIds.length === 0) return;

		// Load available decks and show copy dialog
		await loadAvailableDecks();
		showCopyCardsDialog = true;
	}

	async function handleChangeTheme() {
		if (selectedCardIds.length === 0) return;

		// Set default theme to current deck theme
		selectedThemeForCards = deck.meta.theme || '';
		showChangeThemeDialog = true;
	}

	async function executeChangeTheme() {
		// Validate theme change using pure function
		const themeParams = { cardIds: selectedCardIds, themeId: selectedThemeForCards };
		const validation = validateThemeChangeParams(themeParams);

		if (!validation.isValid) {
			toasts.error(validation.error || 'Invalid theme change operation');
			return;
		}

		const numToUpdate = selectedCardIds.length;
		const updates = createThemeUpdateParams(selectedCardIds, selectedThemeForCards);
		const successMessage = `Changed theme for ${createCardOperationMessage('updated', numToUpdate).toLowerCase()}`;

		const success = await canonUpdateCards(
			updates,
			['deck-manager-change-theme'],
			'Changing theme...',
			successMessage
		);

		if (success) {
			// Update local deck prop from current deck store
			if ($currentDeck?.id === deck.id) {
				deck = $currentDeck;
			}
			emitDeckChange({ action: 'update', deckId: deck.id });
			showChangeThemeDialog = false;
			showManageCardsDialog = false;
			selectedCardIds = [];
			selectedThemeForCards = '';
		}
	}

	async function executeCopyCards() {
		// Validate copy operation using pure function
		const copyParams = { cardIds: selectedCardIds, targetDeckId, newDeckName };
		const validation = validateCopyCardsParams(copyParams);

		if (!validation.isValid) {
			toasts.error(validation.error || 'Invalid copy operation');
			return;
		}

		const numToCopy = selectedCardIds.length;
		const successMessage = createCardOperationMessage('copied', numToCopy);
		let newDeckNameForCopy = targetDeckId === 'new' ? newDeckName.trim() : undefined;

		const success = await canonCopyCards(
			selectedCardIds,
			targetDeckId,
			newDeckNameForCopy,
			['deck-manager-copy-cards'],
			'Copying cards...',
			successMessage
		);

		if (success) {
			showCopyCardsDialog = false;
			showManageCardsDialog = false;
			selectedCardIds = [];
			// Reset form
			targetDeckId = 'new';
			newDeckName = '';
			// Refresh available decks list to include any newly created deck
			await loadAvailableDecks();
		}
	}

	async function handleDelete() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}

		try {
			deleting = true;
			await storeDeleteDeck(deck.id);
			emitDeckChange({ action: 'delete', deckId: deck.id });
			// Find a new deck to set as current if needed
			if ($currentDeck?.id === deck.id) {
				// Reload the deck list first to get the updated list without the deleted deck
				await deckList.load();

				if ($deckList.decks.length > 0) {
					// Sort by lastEdited descending and pick the most recent
					const sortedDecks = [...$deckList.decks].sort(
						(a, b) => b.meta.lastEdited - a.meta.lastEdited
					);
					const mostRecentDeck = sortedDecks[0];
					currentDeck.set(mostRecentDeck);
					currentDeckId.set(mostRecentDeck.id);
				} else {
					currentDeck.set(null);
					currentDeckId.set(null);
				}
			}
			toasts.success('Deck deleted');
			// Reload the deck list to reflect the change
			await deckList.load();
		} catch (e) {
			// Error surfaced via toast below
			toasts.error('Failed to delete deck');
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	async function handleDuplicate() {
		if (!showDuplicateDialog) {
			showDuplicateDialog = true;
			newDeckName = generateDuplicateName(deck.meta.name);
			return;
		}

		// Validate the deck name using pure function
		const validation = validateDeckName(newDeckName);
		if (!validation.isValid) {
			toasts.error(validation.error || 'Invalid deck name');
			return;
		}

		try {
			duplicating = true;
			const newDeck = await duplicateDeck(deck, newDeckName);
			currentDeck.set(newDeck);
			currentDeckId.set(newDeck.id);
			// Emit duplicate event for deck
			emitDeckChange({ action: 'duplicate', deckId: newDeck.id });
			showDuplicateDialog = false;
			toasts.success('Deck duplicated successfully');
			// Reload the deck list to reflect the change
			await deckList.load();
		} catch (e) {
			// Error surfaced via toast below
			toasts.error('Failed to duplicate deck');
		} finally {
			duplicating = false;
		}
	}

	async function handleDeleteCards() {
		if (!hasSelectedCards(selectedCardIds)) return;

		const numToDelete = getSelectedCardCount(selectedCardIds);
		const successMessage = createCardOperationMessage('deleted', numToDelete);

		const success = await canonDeleteCards(
			selectedCardIds,
			['deck-manager-delete-cards'],
			'Deleting cards...',
			successMessage
		);

		if (success) {
			// Update local deck prop from current deck store
			if ($currentDeck?.id === deck.id) {
				deck = $currentDeck;
			}
			emitDeckChange({ action: 'deleteCards', deckId: deck.id });
			showManageCardsDialog = false;
			selectedCardIds = [];
		}
	}

	async function handleNameEdit() {
		if (!editingName) {
			editingName = true;
			editedDeckName = deck.meta.name;
			return;
		}

		if (!editedDeckName.trim() || editedDeckName === deck.meta.name) {
			editingName = false;
			return;
		}

		const success = await canonUpdateDeck(
			{ name: editedDeckName.trim() },
			['deck-manager-name'],
			'Updating deck name...',
			'Deck name updated'
		);

		if (success) {
			// Update local deck prop from current deck store
			if ($currentDeck?.id === deck.id) {
				deck = $currentDeck;
			}
			emitDeckChange({ action: 'update', deckId: deck.id });
			editingName = false;
		} else {
			editingName = false;
		}
	}

	function handleNameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleNameEdit();
		} else if (event.key === 'Escape') {
			editingName = false;
			editedDeckName = deck.meta.name;
		}
	}

	// Use pure formatting functions
	function formatDateDisplay(timestamp: number): string {
		return formatDate(timestamp);
	}

	function formatDateTimeDisplay(timestamp: number): string {
		return formatDateTime(timestamp);
	}

	// Vocabulary editor event handlers
	async function loadCurrentVocabulary() {
		if (deck.meta.statblockConfigId) {
			const config = await configActions.getByIdOrDefault(deck.meta.statblockConfigId);
			currentVocabulary = configToSimpleVocabulary(config);
		} else {
			const defaultConfig = await configActions.getByIdOrDefault();
			currentVocabulary = configToSimpleVocabulary(defaultConfig);
		}
	}

	async function handleSaveVocabulary(event: CustomEvent<StatblockVocabulary>) {
		const simpleVocabulary = event.detail;

		if (applyingVocabulary) return;
		applyingVocabulary = true;

		try {
			// Get the base config to preserve default values and tracking settings
			const baseConfig = deck.meta.statblockConfigId
				? await configActions.getByIdOrDefault(deck.meta.statblockConfigId)
				: await configActions.getByIdOrDefault();

			// Convert simple vocabulary back to complex structure
			const complexVocabulary = simpleVocabularyToConfig(simpleVocabulary, baseConfig);

			// Create a new custom config with the converted vocabulary
			const configName = `${deck.meta.name} Custom Vocabulary`;
			const newConfig = configActions.createNew(
				configName,
				`Custom vocabulary for ${deck.meta.name}`,
				baseConfig
			);
			newConfig.vocabulary = complexVocabulary;

			// Save the new config
			await configActions.save(newConfig);

			// Apply it to the deck
			const success = await canonUpdateDeck(
				{ statblockConfigId: newConfig.id },
				['deck-manager-apply-vocabulary'],
				'Saving vocabulary...',
				'Vocabulary updated successfully'
			);

			if (success) {
				// Update local deck prop from current deck store
				if ($currentDeck?.id === deck.id) {
					deck = $currentDeck;
				}
				emitDeckChange({ action: 'update', deckId: deck.id });
				showConfigSelector = false;
				currentVocabulary = null;
			}
		} catch (error) {
			toasts.error('Failed to save vocabulary');
		} finally {
			applyingVocabulary = false;
		}
	}

	function handleCancelVocabulary() {
		showConfigSelector = false;
		currentVocabulary = null;
	}
</script>

<div class="deck-manager">
	<div class="title-section">
		{#if editingName}
			<div class="name-edit">
				<input
					type="text"
					bind:value={editedDeckName}
					onblur={handleNameEdit}
					onkeydown={handleNameKeydown}
					placeholder="Enter deck name"
				/>
				<button class="icon-button" onclick={handleNameEdit} title="Save name"> ✓ </button>
				<button
					class="icon-button"
					onclick={() => {
						editingName = false;
						editedDeckName = deck.meta.name;
					}}
					title="Cancel"
				>
					×
				</button>
			</div>
		{:else}
			<div class="name-display">
				<h3>{deck.meta.name}</h3>
				<button class="icon-button" onclick={handleNameEdit} title="Edit deck name"> ✎ </button>
			</div>
		{/if}
	</div>

	<div class="deck-content">
		<div class="deck-info">
			<div class="info-line">
				<span class="cards">{deck.cards.length} cards</span>
				<span class="theme-info">
					{baseThemes[deck.meta.theme]?.name || 'No theme'}
				</span>
			</div>
			<div class="info-line date">
				<span class="date-label">Created</span>
				{formatDateDisplay(deck.meta.createdAt)}
			</div>
			<div class="info-line date">
				<span class="date-label">Edited</span>
				{formatDateTimeDisplay(deck.meta.lastEdited)}
			</div>
		</div>

		<div class="actions">
			<fieldset class="action-group">
				<legend>Card</legend>
				<button
					class="action-button"
					onclick={() => (showManageCardsDialog = true)}
					title="Manage cards in this deck"
				>
					Manage
				</button>
			</fieldset>
			<fieldset class="action-group">
				<legend>Deck</legend>
				<button
					class="action-button"
					onclick={handleDuplicate}
					disabled={duplicating}
					title="Create a copy of this deck"
				>
					{duplicating ? 'Duplicating...' : 'Duplicate'}
				</button>
				<button
					class="action-button"
					onclick={() => (showThemeSelect = true)}
					disabled={isThemeUpdating}
					title="Change deck theme"
				>
					{isThemeUpdating ? 'Updating...' : 'Theme'}
				</button>
				<button
					class="action-button"
					onclick={async () => {
						await loadCurrentVocabulary();
						showConfigSelector = true;
					}}
					title="Configure statblock vocabulary"
				>
					Statblocks
				</button>
				<button
					class="action-button danger"
					onclick={handleDelete}
					disabled={deleting}
					title="Delete this deck and all its cards"
				>
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
			</fieldset>
		</div>
	</div>

	{#if showDeleteConfirm || showDuplicateDialog || showManageCardsDialog || showCopyCardsDialog || showChangeThemeDialog || showConfigSelector}
		<div class="dialog-overlay"></div>
	{/if}

	{#if showDeleteConfirm}
		<div class="dialog-overlay">
			<button
				class="overlay-button"
				onclick={() => (showDeleteConfirm = false)}
				onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}
				aria-label="Close delete confirmation"
			></button>
		</div>
		<div
			class="dialog"
			role="alertdialog"
			aria-labelledby="delete-dialog-title"
			aria-describedby="delete-dialog-desc"
		>
			<h2 id="delete-dialog-title">Delete Confirmation</h2>
			<p id="delete-dialog-desc">Delete this deck?</p>
			<div class="dialog-buttons">
				<button class="danger" onclick={handleDelete} disabled={deleting}>
					{deleting ? 'Deleting...' : 'Confirm Delete'}
				</button>
				<button class="secondary" onclick={() => (showDeleteConfirm = false)} disabled={deleting}>
					Cancel
				</button>
			</div>
		</div>
	{:else if showDuplicateDialog}
		<div class="dialog">
			<input type="text" bind:value={newDeckName} placeholder="Enter new deck name" />
			<button
				class="primary"
				onclick={handleDuplicate}
				disabled={duplicating || !newDeckName.trim()}
			>
				{duplicating ? 'Duplicating...' : 'Create Copy'}
			</button>
			<button
				class="secondary"
				onclick={() => (showDuplicateDialog = false)}
				disabled={duplicating}
			>
				Cancel
			</button>
		</div>
	{:else if showManageCardsDialog}
		<div class="dialog-overlay">
			<button
				class="overlay-button"
				onclick={() => {
					showManageCardsDialog = false;
					selectedCardIds = [];
				}}
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						showManageCardsDialog = false;
						selectedCardIds = [];
					}
				}}
				aria-label="Close card deletion dialog"
			></button>
		</div>
		<div class="dialog copy-dialog" role="dialog" aria-labelledby="delete-cards-title">
			<h2 id="delete-cards-title">Manage Cards</h2>
			<div class="selection-controls">
				<button
					class="small"
					onclick={selectAll}
					disabled={selectedCardIds.length === deck.cards.length}
					aria-label="Select all cards"
				>
					Select All
				</button>
				<button
					class="small"
					onclick={selectNone}
					disabled={selectedCardIds.length === 0}
					aria-label="Clear selection"
				>
					Clear Selection
				</button>
				<span class="selection-count" role="status" aria-live="polite">
					{selectedCardIds.length} of {deck.cards.length} selected
				</span>
			</div>
			<div class="card-list" role="listbox" aria-multiselectable="true">
				{#each deck.cards as card (card.id)}
					<details class="card-item-details">
						<summary
							class="card-item"
							role="option"
							aria-selected={selectedCardIds.includes(card.id)}
						>
							<input
								type="checkbox"
								checked={selectedCardIds.includes(card.id)}
								onchange={() => toggleCard(card.id)}
								aria-label="Select {card.name}"
							/>
							<div class="card-info">
								<strong>{card.name}</strong>
								<span class="card-role">{card.role}</span>
							</div>
							<div class="expand-indicator">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M4.427 9.573l3.347-3.377a.25.25 0 01.354 0l3.346 3.377a.25.25 0 01-.177.427H4.604a.25.25 0 01-.177-.427z"
									/>
								</svg>
							</div>
						</summary>
						<div class="card-preview">
							<CardFront {card} theme={deck.meta.theme} preview={true} cardSize="poker" />
						</div>
					</details>
				{/each}
			</div>
			<div class="dialog-buttons">
				<button
					class="action-button"
					onclick={handleCopyCards}
					disabled={isCopyingCards || selectedCardIds.length === 0}
				>
					{isCopyingCards ? 'Copying...' : 'Copy'}
				</button>
				<button
					class="action-button"
					onclick={handleChangeTheme}
					disabled={isChangingTheme || selectedCardIds.length === 0}
				>
					{isChangingTheme ? 'Changing...' : 'Theme'}
				</button>
				<button
					class="danger"
					onclick={handleDeleteCards}
					disabled={isDeletingCards || selectedCardIds.length === 0}
				>
					{isDeletingCards ? 'Deleting...' : `Delete`}
				</button>
				<button
					class="secondary"
					onclick={() => {
						showManageCardsDialog = false;
						selectedCardIds = [];
					}}
					disabled={isDeletingCards || isCopyingCards || isChangingTheme}
				>
					Close
				</button>
			</div>
		</div>
	{/if}

	{#if showThemeSelect}
		<div class="dialog-overlay">
			<button
				class="overlay-button"
				onclick={() => (showThemeSelect = false)}
				onkeydown={(e) => e.key === 'Escape' && (showThemeSelect = false)}
				aria-label="Close theme selector"
			></button>
		</div>
		<div class="dialog theme-dialog" role="dialog" aria-labelledby="theme-dialog-title">
			<h2 id="theme-dialog-title">Select Theme</h2>
			<ThemeSelect
				selectedTheme={deck.meta.theme}
				onSelect={(themeId: string) => handleThemeChange(themeId)}
			/>
			<div class="dialog-buttons">
				<button class="secondary" onclick={() => (showThemeSelect = false)}> Cancel </button>
			</div>
		</div>
	{:else if showCopyCardsDialog}
		<div class="dialog-overlay">
			<button
				class="overlay-button"
				onclick={() => {
					showCopyCardsDialog = false;
					newDeckName = '';
					targetDeckId = 'new';
				}}
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						showCopyCardsDialog = false;
						newDeckName = '';
						targetDeckId = 'new';
					}
				}}
				aria-label="Close copy cards dialog"
			></button>
		</div>
		<div class="dialog copy-cards-dialog" role="dialog" aria-labelledby="copy-cards-title">
			<h2 id="copy-cards-title">Copy Cards</h2>
			<p>Copy {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''} to:</p>
			<div class="deck-selection-container">
				<select bind:value={targetDeckId}>
					<option value="new">New Deck</option>
					{#each availableDecks as d}
						<option value={d.id}>{d.meta.name}</option>
					{/each}
				</select>
				{#if targetDeckId === 'new'}
					<input
						type="text"
						bind:value={newDeckName}
						placeholder="New deck name"
						disabled={isCopyingCards}
					/>
				{/if}
			</div>
			<div class="dialog-buttons">
				<button
					class="secondary"
					onclick={() => {
						showCopyCardsDialog = false;
						newDeckName = '';
						targetDeckId = 'new';
					}}
					disabled={isCopyingCards}
				>
					Cancel
				</button>
				<button
					class="primary"
					onclick={executeCopyCards}
					disabled={isCopyingCards || (targetDeckId === 'new' && !newDeckName.trim())}
				>
					{isCopyingCards ? 'Copying...' : 'Copy Cards'}
				</button>
			</div>
		</div>
	{:else if showChangeThemeDialog}
		<div class="dialog-overlay">
			<button
				class="overlay-button"
				onclick={() => {
					showChangeThemeDialog = false;
					selectedThemeForCards = '';
				}}
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						showChangeThemeDialog = false;
						selectedThemeForCards = '';
					}
				}}
				aria-label="Close change theme dialog"
			></button>
		</div>
		<div class="dialog theme-dialog" role="dialog" aria-labelledby="change-theme-title">
			<h2 id="change-theme-title">Change Theme for Selected Cards</h2>
			<p>
				Change theme for {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''}:
			</p>
			<div class="theme-select-wrapper">
				<ThemeSelect
					selectedTheme={selectedThemeForCards}
					onSelect={(themeId: string) => {
						selectedThemeForCards = themeId;
						executeChangeTheme();
					}}
				/>
			</div>
		</div>
	{:else if showConfigSelector}
		<div class="dialog-overlay">
			<button
				class="overlay-button"
				onclick={() => (showConfigSelector = false)}
				onkeydown={(e) => e.key === 'Escape' && (showConfigSelector = false)}
				aria-label="Close config selector"
			></button>
		</div>
		<div class="dialog config-dialog" role="dialog" aria-labelledby="config-dialog-title">
			{#if currentVocabulary}
				<StatblockVocabularyEditor
					vocabulary={currentVocabulary}
					title="Customize Statblock Vocabulary for {deck.meta.name}"
					on:save={handleSaveVocabulary}
					on:cancel={handleCancelVocabulary}
				/>
			{:else}
				<h2>Loading vocabulary...</h2>
			{/if}
		</div>
	{/if}
</div>

<style>
	.deck-manager {
		padding: 0.75rem;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		margin-bottom: 0;
		background: var(--ui-bg);
		position: relative;
		display: flex;
		flex-direction: column;
		font-family: var(--ui-font-family);
	}

	.deck-manager:hover {
		background: var(--ui-hover-bg);
	}

	.title-section {
		width: 100%;
	}

	.name-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.name-edit {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
	}

	.name-edit input {
		flex: 1;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
	}

	h3 {
		margin: 0;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		font-weight: 600;
		flex: 1;
	}

	.deck-content {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-start;
		justify-content: space-between;
	}

	.deck-info {
		width: 40%;
		min-width: 15em;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-right: 0.5rem;
	}

	.info-line {
		color: var(--ui-muted);
		line-height: 1.4;
		display: flex;
		align-items: center;
		gap: 1rem;
		font-family: var(--ui-font-family);
		font-size: var(--ui-font-size);
		white-space: nowrap;
	}

	.info-line .cards {
		font-size: var(--ui-font-size);
		min-width: 4em;
	}

	.theme-info {
		color: var(--ui-text);
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
	}

	.info-line.date {
		font-size: calc(var(--ui-font-size) * 0.9);
		color: var(--ui-muted);
	}

	.actions {
		width: 55%;
		min-width: 280px;
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		align-items: flex-start;
		justify-content: flex-end;
	}

	.action-group {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		margin: 0;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		background: var(--ui-bg);
	}

	.action-group legend {
		font-size: calc(var(--ui-font-size) * 0.9);
		font-family: var(--ui-font-family);
		color: var(--ui-muted);
		padding: 0 0.25rem;
		background: var(--ui-bg);
	}

	.action-button {
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--button-border);
		border-radius: 4px;
		background: var(--button-bg);
		color: var(--button-text);
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-button:hover {
		background: var(--button-hover-bg);
		border-color: var(--button-primary-bg);
	}

	.action-button.danger {
		color: var(--toast-error);
		border-color: var(--toast-error);
	}

	.action-button.danger:hover {
		background: var(--toast-error);
		color: white;
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-button {
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		cursor: pointer;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		color: var(--ui-text);
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.icon-button:hover {
		opacity: 1;
	}

	.theme-info {
		color: var(--ui-text);
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
	}

	.info-line.date {
		font-size: calc(var(--ui-font-size) * 0.9);
		color: var(--ui-muted);
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1rem 0;
		max-height: 50vh;
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		background: var(--ui-bg);
	}

	.card-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 3px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.card-item input[type='checkbox'] {
		pointer-events: all;
	}

	.card-item-details {
		border: 1px solid transparent;
		border-radius: 4px;
	}

	.card-item-details[open] {
		border-color: var(--ui-border);
	}

	.card-preview {
		padding: 1rem;
		display: flex;
		justify-content: center;
		background: var(--ui-bg-secondary, var(--ui-bg));
	}

	.expand-indicator {
		margin-left: auto;
		display: flex;
		align-items: center;
		transition: transform 0.2s ease;
		color: var(--ui-muted);
	}

	.card-item-details[open] .expand-indicator {
		transform: rotate(180deg);
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.card-info strong {
		font-family: var(--ui-font-family);
		font-size: var(--ui-font-size);
		color: var(--ui-text);
	}

	.card-role {
		font-family: var(--ui-font-family);
		font-size: calc(var(--ui-font-size) * 0.9);
		color: var(--ui-muted);
	}

	.selection-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--ui-border);
	}

	.selection-count {
		margin-left: auto;
	}

	.dialog-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}

	.theme-dialog {
		width: 90vw;
		max-width: 1200px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.copy-cards-dialog {
		width: 90vw;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.copy-cards-dialog h2 {
		margin: 0 0 1rem 0;
		font-size: var(--ui-title-size);
		font-family: var(--ui-font-family);
		font-weight: 600;
	}

	.deck-selection-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.deck-selection-container select,
	.deck-selection-container input {
		padding: 0.5rem;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		font-family: var(--ui-font-family);
		font-size: var(--ui-font-size);
		background: var(--ui-bg);
		color: var(--ui-text);
	}

	.theme-dialog h2 {
		margin: 0 0 1rem 0;
		font-size: var(--ui-title-size);
		font-family: var(--ui-font-family);
		font-weight: 600;
	}

	/* Component-specific dialog styles - use global dialog styles for most */

	.config-dialog {
		width: 90vw;
		max-width: 800px;
		max-height: 85vh;
		overflow-y: auto;
	}

	.overlay-button {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
	}
</style>
