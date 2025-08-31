/**
 * Share URL Import/Export Utilities
 * 
 * Handles the full URL workflow:
 * - generateShareUrl(): Deck → ShareableDeck → Base64 → URL
 * - importFromUrl(): URL → Base64 → ShareableDeck → Deck
 * 
 * Supports both hash-based (#data=...) and query parameter (?data=...) formats
 */

import type { Deck } from '../types/deck.js';
import type { ShareableDeck } from '../types/shareable.js';
import { toShareable, fromShareable } from './shareUrlConverter.js';
import { createSlug } from './slugUtils.js';

// Re-export for convenience
export { toShareable } from './shareUrlConverter.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const SHARE_URL_PARAM = 'data';
const SHARE_URL_HASH_PREFIX = 'data=';

// =============================================================================
// URL GENERATION
// =============================================================================

/**
 * Generate a shareable URL from a deck
 * Uses base64 encoding of the JSON-stringified shareable format
 * Includes human-readable deck title slug in the URL path for better UX
 */
export function generateShareUrl(deck: Deck, baseUrl?: string): string {
    const shareable = toShareable(deck);
    const jsonString = JSON.stringify(shareable);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
    
    const finalBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
    
    // Create human-readable slug from deck title
    const slug = createSlug(deck.meta.title);
    
    // Use hash format with human-readable slug path
    return `${finalBaseUrl}/${slug}#${SHARE_URL_HASH_PREFIX}${base64Data}`;
}

/**
 * Generate a shareable URL with query parameter format (alternative)
 * Useful when hash format is not preferred
 */
export function generateShareUrlQuery(deck: Deck, baseUrl?: string): string {
    const shareable = toShareable(deck);
    const jsonString = JSON.stringify(shareable);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
    
    const finalBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
    
    return `${finalBaseUrl}?${SHARE_URL_PARAM}=${encodeURIComponent(base64Data)}`;
}

// =============================================================================
// URL PARSING AND IMPORT
// =============================================================================

/**
 * Extract shareable data from a URL (supports both hash and query formats)
 */
export function extractShareDataFromUrl(url: string): ShareableDeck | null {
    try {
        const urlObj = new URL(url);
        
        // Try hash format first (#data=...)
        if (urlObj.hash && urlObj.hash.startsWith('#' + SHARE_URL_HASH_PREFIX)) {
            const base64Data = urlObj.hash.substring(SHARE_URL_HASH_PREFIX.length + 1);
            return decodeShareData(base64Data);
        }
        
        // Try query parameter format (?data=...)
        const queryData = urlObj.searchParams.get(SHARE_URL_PARAM);
        if (queryData) {
            return decodeShareData(decodeURIComponent(queryData));
        }
        
        return null;
    } catch (error) {
        console.warn('Failed to parse share URL:', error);
        return null;
    }
}

/**
 * Import a deck from a share URL
 */
export function importFromUrl(url: string): Deck | null {
    const shareableData = extractShareDataFromUrl(url);
    
    if (!shareableData) {
        return null;
    }
    
    try {
        return fromShareable(shareableData);
    } catch (error) {
        console.warn('Failed to convert shareable data to deck:', error);
        return null;
    }
}

/**
 * Import a deck from the current page URL (browser only)
 * Useful for handling shared URLs when the page loads
 */
export function importFromCurrentUrl(): Deck | null {
    if (typeof window === 'undefined') {
        return null;
    }
    
    return importFromUrl(window.location.href);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract the slug from a share URL
 * Example: "https://example.com/heroes-of-the-realm#data=..." → "heroes-of-the-realm"
 */
export function extractSlugFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        return pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
    } catch (error) {
        return null;
    }
}

/**
 * Decode base64 shareable data back to ShareableDeck object
 */
function decodeShareData(base64Data: string): ShareableDeck | null {
    try {
        const jsonString = decodeURIComponent(escape(atob(base64Data)));
        const parsed = JSON.parse(jsonString);
        
        // Basic validation that this looks like shareable data
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.title && Array.isArray(parsed.cards)) {
            return parsed as ShareableDeck;
        }
        
        return null;
    } catch (error) {
        console.warn('Failed to decode share data:', error);
        return null;
    }
}

/**
 * Validate that a URL contains shareable data
 */
export function isShareUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        
        // Check hash format
        if (urlObj.hash && urlObj.hash.startsWith('#' + SHARE_URL_HASH_PREFIX)) {
            const base64Data = urlObj.hash.substring(SHARE_URL_HASH_PREFIX.length + 1);
            return base64Data.length > 0;
        }
        
        // Check query parameter format
        const queryData = urlObj.searchParams.get(SHARE_URL_PARAM);
        if (queryData) {
            return queryData.length > 0;
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Get the type of share URL (hash or query)
 */
export function getShareUrlType(url: string): 'hash' | 'query' | null {
    try {
        const urlObj = new URL(url);
        
        if (urlObj.hash && urlObj.hash.startsWith('#' + SHARE_URL_HASH_PREFIX)) {
            return 'hash';
        }
        
        if (urlObj.searchParams.has(SHARE_URL_PARAM)) {
            return 'query';
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Estimate the length of a share URL for a given deck
 */
export function estimateShareUrlLength(deck: Deck, baseUrl?: string): number {
    const url = generateShareUrl(deck, baseUrl || 'https://example.com');
    return url.length;
}

/**
 * Check if a deck would generate a URL that's too long for practical use
 * Most browsers support URLs up to ~2000 characters safely
 */
export function isShareUrlTooLong(deck: Deck, maxLength: number = 2000): boolean {
    return estimateShareUrlLength(deck) > maxLength;
}

/**
 * Validate that a deck can be successfully shared and imported via URL
 * Performs a full round-trip test
 */
export function validateShareUrlRoundTrip(deck: Deck): { isValid: boolean; errors: string[]; url?: string } {
    const errors: string[] = [];
    
    try {
        // Generate URL
        const url = generateShareUrl(deck);
        
        // Extract and validate data
        const shareableData = extractShareDataFromUrl(url);
        if (!shareableData) {
            errors.push('Failed to extract shareable data from generated URL');
            return { isValid: false, errors };
        }
        
        // Convert back to deck
        const importedDeck = fromShareable(shareableData);
        
        // Basic validation (similar to shareUrlConverter validation)
        if (importedDeck.id !== deck.id) {
            errors.push('Deck ID mismatch after URL round-trip');
        }
        
        if (importedDeck.meta.title !== deck.meta.title) {
            errors.push('Deck title mismatch after URL round-trip');
        }
        
        if (importedDeck.cards.length !== deck.cards.length) {
            errors.push('Card count mismatch after URL round-trip');
        }
        
        // Check URL length
        if (url.length > 2000) {
            errors.push(`Generated URL is very long (${url.length} characters) and may not work in all browsers`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            url
        };
    } catch (error) {
        errors.push(`URL round-trip validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { isValid: false, errors };
    }
}
