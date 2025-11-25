// UrlSizeIndicator.svelte.ts - Extracted logic for UrlSizeIndicator component

import type { Deck } from '$lib/types';

// === Type Definitions ===

export type WarningLevel = 'low' | 'medium' | 'high';

export interface UrlSizeInfo {
	urlSize: number;
	sizeInKB: string;
	warningLevel: WarningLevel;
}

// === Constants ===

export const SIZE_THRESHOLDS = {
	HIGH: 30000,
	MEDIUM: 25000
} as const;

// === Utility Functions ===

/**
 * Calculates URL size in bytes
 */
export function calculateUrlSize(url: string): number {
	if (typeof TextEncoder !== 'undefined') {
		return new TextEncoder().encode(url).length;
	}
	// Fallback for environments without TextEncoder
	return url.length;
}

/**
 * Converts bytes to KB string with one decimal place
 */
export function formatSizeInKB(bytes: number): string {
	return (bytes / 1024).toFixed(1);
}

/**
 * Determines warning level based on URL size
 */
export function getWarningLevel(urlSize: number): WarningLevel {
	if (urlSize > SIZE_THRESHOLDS.HIGH) {
		return 'high';
	} else if (urlSize > SIZE_THRESHOLDS.MEDIUM) {
		return 'medium';
	} else {
		return 'low';
	}
}

/**
 * Gets warning message for the given warning level
 */
export function getWarningMessage(warningLevel: WarningLevel): string | null {
	switch (warningLevel) {
		case 'high':
			return 'Near limit - consider creating new deck';
		case 'medium':
			return 'Approaching size limit';
		case 'low':
			return null;
		default:
			return null;
	}
}

/**
 * Processes URL size information for display
 */
export function getUrlSizeInfo(url: string): UrlSizeInfo {
	const urlSize = calculateUrlSize(url);
	const sizeInKB = formatSizeInKB(urlSize);
	const warningLevel = getWarningLevel(urlSize);

	return {
		urlSize,
		sizeInKB,
		warningLevel
	};
}
