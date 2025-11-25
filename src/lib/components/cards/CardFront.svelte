<script lang="ts">
	import type { Card } from '$lib/types';
	import CardBase from './CardBase.svelte';
	import CardStatsEditor from './CardStatsEditor.svelte';
	import { currentDeck } from '$lib/stores/deck';
	import { canonUpdateCard, isFieldLoading } from '$lib/stores/canonUpdate';
	import ImageSelector from '../ui/ImageSelector.svelte';
	import { formatTraits, parseTraits, addTrait } from '$lib/utils/card-utils';
	import { createBlobUrl, revokeBlobUrl } from '$lib/utils/image-handler';
	import { untrack } from 'svelte';
	import {
		resolveCardTheme,
		hasImageDataChanged,
		createBackgroundImageValue,
		createImageUpdateParams,
		validateCardName,
		validateCardRole,
		hasContentChanged,
		getImageButtonText,
		getImageButtonTitle,
		shouldShowTopRightFlourish,
		initializeImageState,
		updateImageState,
		type ImageState
	} from './CardFront.svelte.ts';

	// Props - for theme, preview, and cardSize
	const props = $props<{
		card: Card;
		theme?: string;
		preview?: boolean;
		cardSize?: string;
	}>();
	const theme = props.theme;
	const preview = props.preview ?? false;
	const cardSize = props.cardSize;

	// Use pure function for theme resolution - use props.card to avoid circular dependency
	const activeTheme = $derived(
		resolveCardTheme(props.card.theme, theme, $currentDeck?.meta?.theme)
	);

	// Get loading states for different fields
	const isNameUpdating = $derived(isFieldLoading('card-name'));
	const isRoleUpdating = $derived(isFieldLoading('card-role'));
	const isTraitsUpdating = $derived(isFieldLoading('card-traits'));
	const isImageUpdating = $derived(isFieldLoading('card-image'));

	// Get card from context
	const cardId = props.card.id;
	function getCard(id: string): Card {
		if (preview) {
			return props.card;
		}
		const found = $currentDeck?.cards.find((c) => c.id === id);
		if (!found) {
			return props.card;
		}
		return found;
	}
	const card = $derived(getCard(cardId));

	async function handleNameBlur(e: FocusEvent) {
		const newName = (e.target as HTMLElement).textContent?.trim() || '';
		const validation = validateCardName(newName);

		if (!validation.isValid) {
			// Reset to original name if invalid
			if (e.target) {
				(e.target as HTMLElement).textContent = card.name;
			}
			return;
		}

		if (hasContentChanged(card.name, validation.trimmedName)) {
			await canonUpdateCard(
				card.id,
				{ name: validation.trimmedName },
				['card-name'],
				'Updating name...'
			);
		}
	}

	// Image URL management using pure state management
	let imageState = $state<ImageState>(initializeImageState());

	// Effect to manage image URL based on card data - only respond to actual changes
	$effect(() => {
		const currentImageBlob = card.imageBlob;
		const currentImageUrl = card.image;

		// Use untrack to read current imageState to avoid circular dependency
		const currentState = untrack(() => imageState);

		// Use pure function to check if data has changed
		if (hasImageDataChanged(card, currentState.lastBlob, currentState.lastUrl)) {
			// Clean up previous URL if it was a blob URL
			if (currentState.currentUrl && currentState.currentUrl.startsWith('blob:')) {
				revokeBlobUrl(currentState.currentUrl);
			}

			// Set new URL
			let newUrl: string | null = null;
			if (currentImageBlob) {
				// Create blob URL from stored blob
				newUrl = createBlobUrl(currentImageBlob);
			} else if (currentImageUrl) {
				// Use external URL directly
				newUrl = currentImageUrl;
			}

			// Update state using pure function - use untrack to prevent infinite loop
			untrack(() => {
				imageState = updateImageState(currentState, {
					currentUrl: newUrl,
					lastBlob: currentImageBlob || null,
					lastUrl: currentImageUrl || null
				});
			});
		}
	});

	// Clean up on destroy
	$effect(() => {
		return () => {
			if (imageState.currentUrl && imageState.currentUrl.startsWith('blob:')) {
				revokeBlobUrl(imageState.currentUrl);
			}
		};
	});

	// Use pure function for background image CSS generation
	const backgroundImageValue = $derived(createBackgroundImageValue(imageState.currentUrl));

	// Use pure functions for button text and title
	const imageButtonText = $derived(getImageButtonText(!!imageState.currentUrl, isImageUpdating));
	const imageButtonTitle = $derived(getImageButtonTitle(!!imageState.currentUrl));

	// Use pure function for flourish visibility
	const showTopRightFlourish = $derived(shouldShowTopRightFlourish(card));

	// Elements
	let roleElement = $state<HTMLDivElement | null>(null);
	let traitsElement = $state<HTMLDivElement | null>(null);
	let showImageSelector = $state(false);

	// Image selector using pure function for update parameters
	async function handleImageSave(blob: Blob | null, sourceUrl: string | undefined) {
		try {
			// Use pure function to create update parameters
			const updates = createImageUpdateParams(blob, sourceUrl);

			const success = await canonUpdateCard(card.id, updates, ['card-image'], 'Saving image...');
			if (success) {
				showImageSelector = false;
			}
		} catch (error) {
			// Failed to save image
			throw error; // Re-throw so ImageSelector can handle it
		}
	}

	async function handleRoleBlur() {
		const newRole = roleElement?.innerText.trim() || '';
		const validation = validateCardRole(newRole);

		if (!validation.isValid) {
			// Reset to original role if invalid
			if (roleElement) {
				roleElement.textContent = card.role;
			}
			return;
		}

		if (hasContentChanged(card.role || '', validation.trimmedRole)) {
			await canonUpdateCard(
				card.id,
				{ role: validation.trimmedRole },
				['card-role'],
				'Updating role...'
			);
		}
	}

	async function handleTraitsBlur() {
		const newTraits = parseTraits(traitsElement?.innerHTML || '');
		if (JSON.stringify(newTraits) !== JSON.stringify(card.traits)) {
			await canonUpdateCard(card.id, { traits: newTraits }, ['card-traits'], 'Updating traits...');
		}
	}

	async function handleAddTrait() {
		const newTraits = addTrait(card.traits);
		await canonUpdateCard(card.id, { traits: newTraits }, ['card-traits'], 'Adding trait...');
	}
</script>

{#if card}
	<CardBase theme={activeTheme} {preview} {cardSize}>
		<div class="card-content" class:preview style:background-image={backgroundImageValue}>
			<!-- Top portrait flourishes -->
			<svg class="flourish portrait-flourish top-left" viewBox="0 0 100 100">
				<use href="#flourish-{activeTheme}" />
			</svg>
			{#if showTopRightFlourish}
				<svg class="flourish portrait-flourish top-right" viewBox="0 0 100 100">
					<use href="#flourish-{activeTheme}" />
				</svg>
			{/if}

			<!-- Portrait area with controls and bottom flourishes -->
			<div class="portrait-area">
				<!-- Portrait controls -->
				<div class="portrait-container">
					<button
						class="change-portrait"
						class:updating={isImageUpdating}
						onclick={() => (showImageSelector = true)}
						disabled={preview || isImageUpdating}
						title={imageButtonTitle}
					>
						{imageButtonText}
					</button>

					{#if showImageSelector}
						<div class="image-input">
							<ImageSelector
								onSave={handleImageSave}
								onClose={() => (showImageSelector = false)}
								hasExistingImage={!!imageState.currentUrl}
							/>
						</div>
					{/if}
				</div>

				<!-- Stats container -->
				<div class="stats-container">
					<CardStatsEditor {card} />
				</div>

				<!-- Bottom portrait flourishes -->
				<div class="bottom-flourishes">
					<svg class="flourish portrait-flourish bottom-left" viewBox="0 0 100 100">
						<use href="#flourish-{activeTheme}" />
					</svg>
					<svg class="flourish portrait-flourish bottom-right" viewBox="0 0 100 100">
						<use href="#flourish-{activeTheme}" />
					</svg>
				</div>
			</div>

			<!-- Content box -->
			<div class="content">
				<!-- Content flourishes -->
				<svg class="flourish content-flourish top-left" viewBox="0 0 100 100">
					<use href="#flourish-{activeTheme}" />
				</svg>
				<svg class="flourish content-flourish top-right" viewBox="0 0 100 100">
					<use href="#flourish-{activeTheme}" />
				</svg>

				<h2
					class="title front"
					class:updating={isNameUpdating}
					contenteditable={!preview && !isNameUpdating}
					onblur={handleNameBlur}
				>
					{#if isNameUpdating}
						<span class="updating-text">Updating...</span>
					{:else}
						{card.name}
					{/if}
				</h2>
				<div
					class="role"
					class:updating={isRoleUpdating}
					contenteditable={!preview && !isRoleUpdating}
					onblur={handleRoleBlur}
					bind:this={roleElement}
				>
					{#if isRoleUpdating}
						<span class="updating-text">Updating...</span>
					{:else}
						{card.role}
					{/if}
				</div>
				<div class="traits">
					<div
						class="traits-content"
						class:updating={isTraitsUpdating}
						contenteditable={!preview && !isTraitsUpdating}
						onblur={handleTraitsBlur}
						bind:this={traitsElement}
					>
						{#if isTraitsUpdating}
							<span class="updating-text">Updating...</span>
						{:else}
							{@html formatTraits(card.traits)}
						{/if}
					</div>
					<button class="add-trait" onclick={handleAddTrait} disabled={preview || isTraitsUpdating}>
						{#if isTraitsUpdating}
							Adding...
						{:else}
							Add Trait
						{/if}
					</button>
				</div>
			</div>
		</div>
	</CardBase>
{/if}

<style>
	.card-content {
		position: relative;
		height: 100%;
		display: flex;
		flex-direction: column;
		background-color: var(--theme-background);
		background-size: cover;
		background-position: top center;
		container-type: inline-size;
		width: 100%;
		font-size: var(--base-font-size);
		padding: var(--content-gap);
	}

	.portrait-area {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.bottom-flourishes {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;
		margin-top: auto;
	}

	.flourish {
		width: var(--flourish-size);
		aspect-ratio: var(--flourish-aspect);
		pointer-events: none;
		z-index: 2;
		color: var(--flourish-color);
	}

	/* Portrait flourishes */
	.portrait-flourish {
		width: var(--portrait-flourish-size);
		aspect-ratio: var(--portrait-flourish-aspect);
	}

	.portrait-flourish.top-left {
		position: absolute;
		left: 0;
		top: 0;
		opacity: var(--flourish-portrait-top-left-opacity);
	}

	.portrait-flourish.top-right {
		position: absolute;
		right: 0;
		top: 0;
		transform: rotate(90deg);
		opacity: var(--flourish-portrait-top-right-opacity);
	}

	.portrait-flourish.bottom-left {
		transform: rotate(-90deg);
		opacity: var(--flourish-portrait-bottom-left-opacity);
	}

	.portrait-flourish.bottom-right {
		transform: rotate(180deg);
		opacity: var(--flourish-portrait-bottom-right-opacity);
	}

	/* Content flourishes */
	.content-flourish {
		width: var(--content-flourish-size);
		aspect-ratio: var(--content-flourish-aspect);
	}

	.content-flourish.top-left {
		position: absolute;
		left: calc(-1 * var(--content-box-border-width, 0px));
		top: calc(-1 * var(--content-box-border-width, 0px));
		z-index: 1; /* Put behind text */
		opacity: var(--flourish-content-top-left-opacity);
	}

	.content-flourish.top-right {
		position: absolute;
		right: calc(-1 * var(--content-box-border-width, 0px));
		top: calc(-1 * var(--content-box-border-width, 0px));
		transform: rotate(90deg);
		z-index: 1; /* Put behind text */
		opacity: var(--flourish-content-top-right-opacity);
	}

	/* Debug styles for flourishes - only show in dev mode */
	:global(.dev-mode) .flourish {
		border-top: 2px solid #ff3e00; /* Svelte orange for debug borders */
		border-left: 2px solid #ff3e00;
	}

	:global(.dev-mode) .portrait-flourish.top-left {
		background-color: rgba(255, 0, 0, 0.3);
	}
	:global(.dev-mode) .portrait-flourish.top-right {
		background-color: rgba(0, 255, 0, 0.3);
	}
	:global(.dev-mode) .portrait-flourish.bottom-left {
		background-color: rgba(0, 0, 255, 0.3);
	}
	:global(.dev-mode) .portrait-flourish.bottom-right {
		background-color: rgba(255, 0, 255, 0.3);
	}

	:global(.dev-mode) .content-flourish.top-left {
		background-color: rgba(255, 255, 0, 0.3);
	}
	:global(.dev-mode) .content-flourish.top-right {
		background-color: rgba(0, 255, 255, 0.3);
	}

	/* Portrait and stat containers */
	.portrait-container {
		position: absolute;
		top: var(--page-margin);
		left: var(--page-margin);
	}

	.stats-container {
		position: absolute;
		top: var(--page-margin);
		right: var(--page-margin);
	}

	/* Content section */
	.content {
		position: relative;
		background: var(--content-box-bg);
		color: var(--theme-text);
		opacity: var(--content-opacity, 1);
		padding: var(--content-gap);
		border-radius: var(--content-box-radius);
		border: var(--content-box-border-width) var(--frame-style) var(--theme-primary);
		box-shadow: var(--content-box-shadow);
		overflow: hidden; /* Keep flourishes contained */
	}

	h2.title {
		margin: 0 auto;
		max-width: 80%;
		font-size: 1.2em;
		font-weight: var(--theme-title-weight);
		font-family: var(--theme-title-font);
		text-align: var(--title-text-align);
		line-height: var(--title-line-height, 1.2);
		position: relative;
		z-index: 3; /* Ensure text stays on top */
	}

	/* For larger containers (tarot size), use theme's title size */
	@container (min-width: 63mm) {
		h2.title {
			font-size: var(--title-font-size);
		}
	}

	/* Preview cards should still use smaller font */
	.card-content.preview .title {
		font-size: calc(var(--title-font-size) * 0.8);
	}

	.role {
		margin: 0.25rem auto 0;
		max-width: 80%;
		text-align: var(--role-text-align);
		font-family: var(--role-font-family, var(--theme-body-font));
		font-size: var(--role-font-size);
		line-height: var(--role-line-height, 1.2);
		position: relative;
		z-index: 3;
	}

	.traits {
		position: relative;
		margin: var(--content-gap) 0 0;
		padding-top: var(--content-gap);
		border-top: calc(var(--divider-width) * var(--show-dividers)) var(--divider-style)
			var(--theme-primary);
	}

	.traits-content {
		white-space: pre-wrap;
		line-height: var(--body-line-height, 1.4);
		font-size: var(--trait-font-size);
		position: relative;
		z-index: 3;
		text-align: var(--desc-text-align);
		font-family: var(--theme-body-font);
	}

	.traits-content :global(.trait-label) {
		font-weight: bold;
		color: var(--theme-text);
		opacity: 0.8;
		display: inline-block;
		min-width: 5em;
	}

	.add-trait {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 5mm;
		height: 5mm;
		border: none;
		border-radius: 50%;
		background: var(--border-color);
		color: var(--content-text);
		font-size: var(--ui-font-size);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.traits:hover .add-trait {
		opacity: 0.8;
	}

	.add-trait:hover {
		opacity: 1 !important;
	}

	.change-portrait {
		background: var(--content-box-bg);
		opacity: var(--content-opacity);
		border: none;
		padding: var(--content-gap);
		border-radius: 1mm;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s;
		font-size: var(--ui-font-size);
	}

	.card-content:hover .change-portrait {
		opacity: 0.8;
	}

	.change-portrait:hover {
		opacity: 1 !important;
	}

	.image-input {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--theme-bg, white);
		padding: 1rem;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	.image-input :global(.image-selector) {
		margin-bottom: 0.5rem;
	}

	@container (height < 20mm) {
		.portrait-container {
			display: none;
		}
		.traits {
			display: none;
		}
	}

	@media print {
		.change-portrait,
		.image-input {
			display: none;
		}
		.add-trait {
			display: none;
		}
	}

	/* Preview card styles */
	.card-content.preview {
		font-size: calc(var(--base-font-size) * 0.8);
	}

	.card-content.preview .role {
		font-size: calc(var(--role-font-size) * 0.8);
	}

	.card-content.preview .traits {
		font-size: calc(var(--trait-font-size) * 0.8);
	}

	.card-content.preview .traits :global(.trait-label) {
		min-width: clamp(15mm, 20cqw, 25mm);
	}

	.card-content.preview .portrait-container,
	.card-content.preview .image-input {
		display: none;
	}

	/* Loading states */
	.updating {
		opacity: 0.6;
		pointer-events: none;
	}

	.updating-text {
		font-style: italic;
		opacity: 0.8;
	}

	.add-trait:disabled,
	.change-portrait:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
