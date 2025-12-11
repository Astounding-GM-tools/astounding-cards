import type { Card, Stat, Trait } from '../types/card.js';

/**
 * Form data structure for card editing
 */
export interface CardFormData {
	title: string;
	subtitle: string;
	description: string;
	stats: Stat[];
	traits: Trait[];
	imageBlob: Blob | null;
	imageUrl: string | null;
	imageMetadata: Card['imageMetadata'] | null;
}

/**
 * Detects if form data has changes compared to the original card
 * Used for auto-save and unsaved changes detection
 */
export function hasCardChanges(formData: CardFormData, card: Card | null): boolean {
	if (!card) return false;

	const imageChanged = formData.imageUrl !== (card.image || null);

	return (
		formData.title !== card.title ||
		formData.subtitle !== card.subtitle ||
		formData.description !== card.description ||
		JSON.stringify(formData.stats) !== JSON.stringify(card.stats) ||
		JSON.stringify(formData.traits) !== JSON.stringify(card.traits) ||
		formData.imageBlob !== (card.imageBlob || null) ||
		imageChanged ||
		JSON.stringify(formData.imageMetadata) !== JSON.stringify(card.imageMetadata || null)
	);
}

/**
 * Creates a CardFormData object from a Card
 * Used to initialize form state
 */
export function cardToFormData(card: Card): CardFormData {
	return {
		title: card.title,
		subtitle: card.subtitle,
		description: card.description,
		stats: card.stats ? [...card.stats] : [],
		traits: card.traits ? [...card.traits] : [],
		imageBlob: card.imageBlob || null,
		imageUrl: card.image || null,
		imageMetadata: card.imageMetadata || null
	};
}

/**
 * Creates update payload for Canon Update from form data
 */
export function formDataToCardUpdate(formData: CardFormData): Partial<Card> {
	return {
		title: formData.title,
		subtitle: formData.subtitle,
		description: formData.description,
		stats: formData.stats,
		traits: formData.traits,
		image: formData.imageUrl,
		imageBlob: formData.imageBlob,
		imageMetadata: formData.imageMetadata
	};
}
