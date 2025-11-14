/**
 * Pure logic functions extracted from StatblockTemplateDialog.svelte
 *
 * This module contains all the extracted business logic for the statblock template
 * dialog component, separated from the Svelte-specific UI concerns.
 */

import type { StatblockTemplate } from '../statblockTemplates';
import type { StatblockVocabulary } from '../types';

/**
 * Maps a card type string to the corresponding template category
 * Handles case-insensitive mapping and provides fallback to 'character'
 *
 * @param cardType - The type of card (e.g., 'Character', 'ITEM', 'spell')
 * @returns The corresponding template category
 */
export function mapCardTypeToCategory(cardType: string): StatblockTemplate['category'] {
	const typeMap: Record<string, StatblockTemplate['category']> = {
		character: 'character',
		creature: 'character', // Map creatures to character category
		item: 'item',
		spell: 'spell'
	};

	return typeMap[cardType.toLowerCase()] || 'character';
}

/**
 * Creates a template selection state update
 * Pure function that returns the new selection state
 *
 * @param template - The template to select
 * @returns The new selected template state
 */
export function selectTemplate(template: StatblockTemplate): StatblockTemplate {
	return template;
}

/**
 * Validates whether a selection can be confirmed
 * Checks if either a template is selected or custom category is active
 *
 * @param selectedTemplate - Currently selected template (if any)
 * @param selectedCategory - Currently selected category
 * @returns True if selection can be confirmed
 */
export function validateSelectionForConfirm(
	selectedTemplate: StatblockTemplate | null,
	selectedCategory: StatblockTemplate['category']
): boolean {
	return selectedTemplate !== null || selectedCategory === 'other';
}

/**
 * Determines the action type for selection confirmation
 * Returns either the selected template or indicates custom creation
 *
 * @param selectedTemplate - Currently selected template (if any)
 * @param selectedCategory - Currently selected category
 * @returns Object indicating the action type and payload
 */
export function confirmSelection(
	selectedTemplate: StatblockTemplate | null,
	selectedCategory: StatblockTemplate['category']
): { action: 'select' | 'custom'; template?: StatblockTemplate } {
	if (selectedTemplate) {
		return { action: 'select', template: selectedTemplate };
	} else if (selectedCategory === 'other') {
		return { action: 'custom' };
	}

	// This should not happen if validation is used, but provide fallback
	return { action: 'custom' };
}

/**
 * Creates the action for custom template creation
 * Pure function that returns the custom action state
 *
 * @returns Object indicating custom template creation
 */
export function createCustom(): { action: 'custom' } {
	return { action: 'custom' };
}

/**
 * Creates the new dialog state after reset
 * Resets selection and returns clean state
 *
 * @returns Object with reset dialog state
 */
export function resetDialogState(): {
	show: boolean;
	selectedTemplate: StatblockTemplate | null;
} {
	return {
		show: false,
		selectedTemplate: null
	};
}

/**
 * Handles keydown events for the template dialog
 * Returns appropriate action based on key pressed
 *
 * @param event - The keyboard event
 * @returns Object indicating the action to take
 */
export function handleTemplateKeydown(event: KeyboardEvent): {
	action: 'cancel' | 'none';
} {
	if (event.key === 'Escape') {
		return { action: 'cancel' };
	}
	return { action: 'none' };
}

/**
 * Handles category change logic
 * Returns new state with updated category and reset selection
 *
 * @param newCategory - The category to change to
 * @returns Object with new category and reset template selection
 */
export function handleCategoryChange(newCategory: StatblockTemplate['category']): {
	selectedCategory: StatblockTemplate['category'];
	selectedTemplate: StatblockTemplate | null;
} {
	return {
		selectedCategory: newCategory,
		selectedTemplate: null
	};
}

/**
 * Formats a stat name using vocabulary mapping or fallback
 * Handles vocabulary lookup with graceful fallback to mechanic name
 *
 * @param mechanic - The mechanic object containing type and name
 * @param vocabulary - Optional vocabulary mapping object
 * @returns The formatted stat name with colon
 */
export function formatStatWithVocabulary(
	mechanic: { type: string; name: string },
	vocabulary: StatblockVocabulary | null
): string {
	const lookupKey = mechanic.name.toLowerCase();
	const statName = vocabulary?.[lookupKey] || mechanic.name;
	return `${statName}:`;
}

/**
 * Determines if the confirm button should be disabled
 * Based on current selection and category state
 *
 * @param selectedTemplate - Currently selected template (if any)
 * @param selectedCategory - Currently selected category
 * @returns True if button should be disabled
 */
export function isConfirmDisabled(
	selectedTemplate: StatblockTemplate | null,
	selectedCategory: StatblockTemplate['category']
): boolean {
	return !validateSelectionForConfirm(selectedTemplate, selectedCategory);
}

/**
 * Gets the appropriate text for the confirm button
 * Returns different text based on current state
 *
 * @param selectedTemplate - Currently selected template (if any)
 * @param selectedCategory - Currently selected category
 * @returns The button text to display
 */
export function getConfirmButtonText(
	selectedTemplate: StatblockTemplate | null,
	selectedCategory: StatblockTemplate['category']
): string {
	if (selectedCategory === 'other') {
		return 'Create Custom';
	} else if (selectedTemplate) {
		return `Add ${selectedTemplate.mechanics.length} Stats`;
	} else {
		return 'Select Template';
	}
}

/**
 * Type definitions for the dialog state and actions
 */
export type TemplateDialogState = {
	show: boolean;
	selectedTemplate: StatblockTemplate | null;
	selectedCategory: StatblockTemplate['category'];
};

export type TemplateDialogAction =
	| { action: 'select'; template: StatblockTemplate }
	| { action: 'custom' }
	| { action: 'cancel' }
	| { action: 'none' };

/**
 * Validation helpers
 */

/**
 * Validates if a card type string is supported
 *
 * @param cardType - The card type to validate
 * @returns True if the card type is supported
 */
export function isValidCardType(cardType: string): boolean {
	const validTypes = ['character', 'creature', 'item', 'spell'];
	return validTypes.includes(cardType.toLowerCase());
}

/**
 * Gets all available template categories
 *
 * @returns Array of all valid template categories
 */
export function getAvailableCategories(): StatblockTemplate['category'][] {
	return ['character', 'item', 'spell', 'other'];
}

/**
 * Validates if a category is valid
 *
 * @param category - The category to validate
 * @returns True if the category is valid
 */
export function isValidCategory(category: string): category is StatblockTemplate['category'] {
	return getAvailableCategories().includes(category as StatblockTemplate['category']);
}
