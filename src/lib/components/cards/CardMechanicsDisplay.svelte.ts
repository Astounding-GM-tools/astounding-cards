/**
 * Pure logic functions for CardMechanicsDisplay component
 * Handles icon mapping, numeric validation, tracking boxes, and event logic
 */

import type { CardMechanic } from '../../types';
import { MechanicType } from '../../types';

/**
 * Get the emoji icon for a given mechanic type
 * @param type - The mechanic type enum value
 * @returns The corresponding emoji icon
 */
export function getTypeIcon(type: MechanicType): string {
	switch (type) {
		case MechanicType.DEFENSE:
			return '🛡️';
		case MechanicType.INITIATIVE:
			return '⚡';
		case MechanicType.MOVEMENT:
			return '👟';
		case MechanicType.ATTACK:
			return '⚔️';
		case MechanicType.HEALTH:
			return '❤️';
		case MechanicType.RESOURCE:
			return '📦';
		default:
			return '📋';
	}
}

/**
 * Check if a value is numeric (number or numeric string)
 * @param value - The value to check
 * @returns True if the value is numeric
 */
export function isNumeric(value: string | number): boolean {
	if (typeof value === 'number') {
		return true;
	}
	// Handle empty string and whitespace-only strings as non-numeric
	if (typeof value === 'string' && value.trim() === '') {
		return false;
	}
	return !isNaN(Number(value));
}

/**
 * Determine if tracking boxes should be displayed for a mechanic
 * Requirements: must be tracked, numeric, and <= 30
 * @param mechanic - The card mechanic to check
 * @returns True if tracking boxes should be shown
 */
export function shouldShowTrackingBoxes(mechanic: CardMechanic): boolean {
	return mechanic.tracked && isNumeric(mechanic.value) && Number(mechanic.value) <= 30;
}

/**
 * Generate array of indices for rendering tracking boxes
 * Limits count to a maximum of 30 and minimum of 0
 * @param count - The number of tracking boxes to create
 * @returns Array of indices from 0 to count-1
 */
export function renderTrackingBoxes(count: number): number[] {
	return Array.from({ length: Math.max(0, Math.min(count, 30)) }, (_, i) => i);
}

/**
 * Determine the appropriate action for adding stats based on current mechanics
 * @param hasMechanics - Whether the card already has mechanics
 * @returns Object indicating which action to take
 */
export function getAddStatsAction(hasMechanics: boolean): {
	shouldShowTemplate: boolean;
	shouldOpenEditor: boolean;
} {
	if (hasMechanics) {
		return {
			shouldShowTemplate: false,
			shouldOpenEditor: true
		};
	} else {
		return {
			shouldShowTemplate: true,
			shouldOpenEditor: false
		};
	}
}
