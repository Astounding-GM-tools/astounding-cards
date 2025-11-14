<script lang="ts">
	import { currentDeck, currentDeckId, saveCurrentDeck } from '$lib/stores/deck';
	import { deckList } from '$lib/stores/deckList';
	import { createEventDispatcher } from 'svelte';
	import { getAllDecks, getDeck, putDeck, clearDatabase, populateWithSampleData } from '$lib/db';
	import { canonUpdateDeck, isFieldLoading } from '$lib/stores/canonUpdate';
	import type { Deck, CardSize } from '$lib/types';
	import { devMode } from '$lib/stores/dev';
	import { baseThemes } from '$lib/themes';
	import ThemeSelect from '../ui/ThemeSelect.svelte';
	import { toasts } from '$lib/stores/toast';
	import {
		createDeckSelectorState,
		handleDeckDialogKeydown,
		createNewDeckObject,
		sortDecksByLastEdited,
		getCardSizeInfo,
		resetNewDeckDialog,
		openNewDeckDialog,
		setThemeSelectVisible,
		updateNewDeckName,
		type DeckSelectorState
	} from './DeckSelector.svelte.ts';

	const dispatch = createEventDispatcher<{
		deckchange: { action: 'create' | 'update'; deckId: string };
	}>();

	let state = $state<DeckSelectorState>(createDeckSelectorState());

	$effect(() => {
		deckList.load();
	});

	async function handleDeckChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		currentDeckId.set(select.value);
	}

	async function handleCreateDeck() {
		if (!state.showNewDeckDialog) {
			state = openNewDeckDialog(state);
			return;
		}

		if (!state.newDeckName.trim()) return;

		try {
			const newDeck = createNewDeckObject(state.newDeckName);

			await putDeck(newDeck, true); // Allow empty deck
			currentDeck.set(newDeck);
			currentDeckId.set(newDeck.id);
			state = resetNewDeckDialog(state);
			deckList.load(); // Refresh deck list
			dispatch('deckchange', { action: 'create', deckId: newDeck.id });
		} catch (error) {
			console.error('Failed to create deck:', error);
			toasts.error('Failed to create deck');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		handleDeckDialogKeydown(event, state.newDeckName, {
			onEnter: handleCreateDeck,
			onEscape: () => (state = resetNewDeckDialog(state))
		});
	}

	async function handleSizeChange(event: Event) {
		if (!$currentDeck) return;

		const select = event.target as HTMLSelectElement;
		const size = select.value as CardSize;

		await canonUpdateDeck(
			{ cardSize: size },
			['deck-size'],
			'Updating card size...',
			'Card size updated'
		);
	}

	async function handleThemeChange(themeId: string) {
		if (!$currentDeck) return;

		const success = await canonUpdateDeck(
			{ theme: themeId },
			['deck-theme'],
			'Updating theme...',
			'Theme updated'
		);

		if (success) {
			state = setThemeSelectVisible(state, false);
		}
	}

	async function handleClearDatabase() {
		if (confirm('This will delete all decks. Are you sure?')) {
			await clearDatabase();
			window.location.reload(); // Refresh to clear everything
		}
	}

	async function handlePopulateSampleData() {
		if (confirm('Add sample deck with example cards?')) {
			const deck = await populateWithSampleData();
			window.location.reload(); // Refresh to show new data
		}
	}

	const sortedDecks = $derived(sortDecksByLastEdited($deckList.decks));
</script>

<div class="deck-settings">
	<fieldset class="deck-selector">
		<legend>Select current deck</legend>
		{#if $deckList.loading}
			<span class="status">Loading decks...</span>
		{:else if $deckList.error}
			<span class="status error">{$deckList.error}</span>
		{:else}
			<div class="deck-controls">
				<select
					id="current-deck"
					name="current-deck"
					onchange={handleDeckChange}
					value={$currentDeck?.id}
					aria-label="Current deck"
				>
					{#each sortedDecks as deck (deck.id)}
						<option value={deck.id}>
							{deck.meta.name}
						</option>
					{/each}
				</select>
				<button class="create-deck" onclick={handleCreateDeck} aria-label="Create new deck">
					➕ Create New Deck
				</button>
			</div>
		{/if}
	</fieldset>

	{#if $currentDeck}
		<fieldset class="size-selector">
			<legend>Card size</legend>
			<select
				id="card-size"
				name="card-size"
				onchange={handleSizeChange}
				value={$currentDeck.meta.cardSize || 'poker'}
				aria-label="Card size"
			>
				<option value="poker">Poker (9 per page)</option>
				<option value="tarot">Tarot (4 per page)</option>
			</select>
			<p class="size-info">
				{getCardSizeInfo($currentDeck.meta.cardSize || 'poker')}
			</p>
		</fieldset>

		<fieldset class="theme-selector">
			<legend>Card theme</legend>
			<button
				class="theme-button"
				onclick={() => (state = setThemeSelectVisible(state, true))}
				aria-label="Change theme"
			>
				<div class="theme-info">
					<strong>{baseThemes[$currentDeck.meta.theme]?.name}</strong>
					<span class="theme-desc">{baseThemes[$currentDeck.meta.theme]?.preview?.role}</span>
				</div>
				<span class="change-theme">Change theme</span>
			</button>
		</fieldset>
	{/if}

	{#if $devMode}
		<fieldset class="dev-controls" data-testid="dev-tools-section">
			<legend>Dev Tools - be careful!</legend>
			<button
				class="danger"
				data-testid="clear-database-button"
				onclick={handleClearDatabase}
				title="Development only: Clear all data"
			>
				Clear Database
			</button>
			<button
				class="sample"
				data-testid="add-sample-data-button"
				onclick={handlePopulateSampleData}
				title="Development only: Add sample data"
			>
				Add Sample Data
			</button>
			<button
				class="sample"
				data-testid="test-toast-button"
				onclick={() => toasts.success('Test toast notification!')}
				title="Development only: Test toast system"
			>
				Test Toast
			</button>
		</fieldset>
	{/if}
</div>

{#if state.showThemeSelect}
	<div class="dialog-overlay">
		<button
			class="overlay-button"
			onclick={() => (state = setThemeSelectVisible(state, false))}
			onkeydown={(e) => e.key === 'Escape' && (state = setThemeSelectVisible(state, false))}
			aria-label="Close theme selector"
		></button>
	</div>
	<div class="dialog theme-dialog" role="dialog" aria-labelledby="theme-dialog-title">
		<h2 id="theme-dialog-title">Select Theme</h2>
		<ThemeSelect selectedTheme={$currentDeck?.meta.theme} onSelect={handleThemeChange} />
		<div class="dialog-buttons">
			<button class="secondary" onclick={() => (state = setThemeSelectVisible(state, false))}>
				Cancel
			</button>
		</div>
	</div>
{/if}

{#if state.showNewDeckDialog}
	<div class="dialog-overlay">
		<button
			class="overlay-button"
			onclick={() => (state = resetNewDeckDialog(state))}
			onkeydown={(e) => e.key === 'Escape' && (state = resetNewDeckDialog(state))}
			aria-label="Close new deck dialog"
		></button>
	</div>
	<div class="dialog" role="dialog" aria-labelledby="new-deck-dialog-title">
		<h2 id="new-deck-dialog-title">Create New Deck</h2>
		<input
			type="text"
			bind:value={state.newDeckName}
			placeholder="Enter deck name"
			onkeydown={handleKeydown}
		/>
		<div class="dialog-buttons">
			<button class="primary" onclick={handleCreateDeck} disabled={!state.newDeckName.trim()}>
				Create
			</button>
			<button class="secondary" onclick={() => (state = resetNewDeckDialog(state))}>
				Cancel
			</button>
		</div>
	</div>
{/if}

<style>
	.deck-settings {
		display: flex;
		flex-direction: column;
		gap: var(--content-gap);
		font-family: var(--ui-font-family);
	}

	fieldset {
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		padding: var(--content-gap);
		margin: 0;
		background: var(--ui-bg);
	}

	legend {
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		color: var(--ui-muted);
		padding: 0 var(--content-gap);
		background: var(--ui-bg);
	}

	select {
		width: 100%;
		padding: calc(var(--content-gap) * 0.75);
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		background: var(--ui-bg);
		color: var(--ui-text);
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		cursor: pointer;
	}

	select:hover {
		border-color: var(--button-primary-bg);
	}

	select:focus {
		outline: none;
		border-color: var(--button-primary-bg);
		box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
	}

	.status {
		display: block;
		padding: calc(var(--content-gap) * 0.75);
		color: var(--ui-muted);
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
	}

	.error {
		color: var(--toast-error);
	}

	.size-info {
		margin: var(--content-gap) 0 0;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		color: var(--ui-muted);
	}

	button {
		padding: calc(var(--content-gap) * 0.75) var(--content-gap);
		border: 1px solid var(--button-border);
		border-radius: 4px;
		background: var(--button-bg);
		color: var(--button-text);
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover {
		background: var(--button-hover-bg);
		border-color: var(--button-primary-bg);
	}

	button:active {
		background: var(--button-active-bg);
	}

	/* Dev tools section */
	.dev-controls {
		border-color: var(--toast-warning);
		background: rgba(255, 152, 0, 0.05);
		display: flex;
		gap: var(--content-gap);
	}

	.dev-controls legend {
		color: var(--toast-warning);
		background: none;
	}

	button.danger {
		background: var(--toast-error);
		border-color: var(--toast-error);
		color: white;
	}

	button.danger:hover {
		opacity: 0.9;
	}

	button.sample {
		background: var(--button-primary-bg);
		border-color: var(--button-primary-bg);
		color: var(--button-primary-text);
	}

	button.sample:hover {
		background: var(--button-primary-hover);
	}

	.theme-button {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--content-gap) * 0.75) var(--content-gap);
		text-align: left;
	}

	.theme-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.theme-desc {
		color: var(--ui-muted);
		font-size: calc(var(--ui-font-size) * 0.9);
	}

	.change-theme {
		color: var(--button-primary-bg);
		font-size: calc(var(--ui-font-size) * 0.9);
	}

	/* Use global dialog styles - only component-specific overrides here */

	.deck-controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.deck-controls select {
		flex: 1;
	}

	.create-deck {
		white-space: nowrap;
		background: var(--button-primary-bg);
		color: var(--button-primary-text);
		border-color: var(--button-primary-bg);
	}

	.create-deck:hover {
		background: var(--button-primary-hover);
	}

	input[type='text'] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
		margin: 1rem 0;
	}

	input[type='text']:focus {
		outline: none;
		border-color: var(--button-primary-bg);
		box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
	}

	.dialog h2 {
		margin: 0;
		font-size: var(--ui-title-size);
		font-family: var(--ui-font-family);
		font-weight: 600;
	}

	.dialog input {
		width: 100%;
		padding: 0.5rem;
		margin: 1rem 0;
		border: 1px solid var(--ui-border);
		border-radius: 4px;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
	}

	.dialog input:focus {
		outline: none;
		border-color: var(--button-primary-bg);
		box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
	}

	/* Dialog buttons now use global styles */
</style>
