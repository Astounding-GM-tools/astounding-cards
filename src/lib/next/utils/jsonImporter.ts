/**
 * JSON Import Utilities
 * 
 * Handles importing decks from JSON format with blob resolution and validation.
 * Supports both light (URL-only) and complete (with embedded blobs) formats.
 */

import type { Deck, Card } from '../types/deck.js';
import type { JsonExport, BlobData } from './jsonExporter.js';
import { generateId, generateKey } from './idUtils.js';

// =============================================================================
// IMPORT TYPES
// =============================================================================

export interface ImportResult {
    success: boolean;
    deck?: Deck;
    error?: string;
    warnings?: string[];
}

export interface ImportValidationResult {
    isValid: boolean;
    error?: string;
    warnings?: string[];
}

// =============================================================================
// MAIN IMPORT FUNCTIONS
// =============================================================================

/**
 * Import deck from JSON string with full validation and blob resolution
 */
export async function importDeckFromJson(jsonContent: string): Promise<ImportResult> {
    try {
        // Parse JSON
        const parsed = JSON.parse(jsonContent);
        
        // Validate structure
        const validation = validateJsonStructure(parsed);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error,
                warnings: validation.warnings
            };
        }
        
        // Resolve blobs and convert to standard deck format
        let deck = await resolveBlobsAndConvert(parsed as JsonExport);
        
        // Generate missing IDs for AI-generated decks
        deck = ensureAllIdsPresent(deck);
        
        return {
            success: true,
            deck,
            warnings: validation.warnings
        };
        
    } catch (error) {
        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: 'Invalid JSON format: ' + error.message
            };
        }
        
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown import error'
        };
    }
}

/**
 * Import deck from File object
 */
export async function importDeckFromFile(file: File): Promise<ImportResult> {
    try {
        const content = await file.text();
        return await importDeckFromJson(content);
    } catch (error) {
        return {
            success: false,
            error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate JSON structure matches expected format
 */
export function validateJsonStructure(parsed: any): ImportValidationResult {
    const warnings: string[] = [];
    
    // Check basic structure
    if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, error: 'Invalid JSON: expected object' };
    }
    
    // Check for deck data
    if (!parsed.deck) {
        return { isValid: false, error: 'Missing deck data' };
    }
    
    const deck = parsed.deck;
    
    // Validate deck structure - ID is optional (can be generated)
    if (deck.id !== undefined && typeof deck.id !== 'string') {
        return { isValid: false, error: 'Deck ID must be a string if provided' };
    }
    
    if (!deck.meta || typeof deck.meta !== 'object') {
        return { isValid: false, error: 'Deck missing metadata' };
    }
    
    if (!deck.meta.title || typeof deck.meta.title !== 'string') {
        return { isValid: false, error: 'Deck missing title' };
    }
    
    if (!Array.isArray(deck.cards)) {
        return { isValid: false, error: 'Deck missing cards array' };
    }
    
    // Validate export metadata
    if (parsed.exportMeta) {
        if (parsed.exportMeta.source && !parsed.exportMeta.source.includes('cards.astounding.games')) {
            warnings.push('Deck not exported from cards.astounding.games - compatibility not guaranteed');
        }
    }
    
    // Check for blob references without blob data
    const hasBlobReferences = deck.cards.some((card: any) => 
        card.image && typeof card.image === 'string' && card.image.startsWith('@blob:')
    );
    
    if (hasBlobReferences && !parsed.blobs) {
        return { isValid: false, error: 'Deck contains blob references but no blob data provided' };
    }
    
    return { isValid: true, warnings };
}

// =============================================================================
// BLOB RESOLUTION
// =============================================================================

/**
 * Resolve blob references and convert to standard deck format
 */
async function resolveBlobsAndConvert(jsonExport: JsonExport): Promise<Deck> {
    const { deck, blobs } = jsonExport;
    
    // Process each card and resolve blob references
    const resolvedCards = await Promise.all(
        deck.cards.map(card => resolveBlobsInCard(card, blobs || {}))
    );
    
    // Return clean deck with resolved blobs
    return {
        ...deck,
        cards: resolvedCards
    };
}

/**
 * Resolve blob references in a single card
 */
async function resolveBlobsInCard(card: Card, blobs: Record<string, BlobData>): Promise<Card> {
    // If no image or not a blob reference, return as-is
    if (!card.image || !card.image.startsWith('@blob:')) {
        return card;
    }
    
    // Extract blob ID from reference
    const blobId = card.image.substring(6); // Remove '@blob:' prefix
    const blobData = blobs[blobId];
    
    if (!blobData) {
        console.warn(`Blob reference ${blobId} not found, keeping reference`);
        return card;
    }
    
    // Create a blob from the data URL and convert to object URL
    try {
        const blob = dataUrlToBlob(blobData.data);
        
        return {
            ...card,
            image: blobData.data, // Keep as data URL for now
            imageBlob: blob,
            imageMetadata: blobData.metadata ? {
                filename: blobData.metadata.filename || 'imported-image',
                size: blobData.metadata.size || blob.size,
                type: blobData.metadata.type || blob.type,
                lastModified: blobData.metadata.lastModified || Date.now()
            } : undefined
        };
    } catch (error) {
        console.warn(`Failed to convert blob ${blobId}, keeping data URL:`, error);
        return {
            ...card,
            image: blobData.data // Fallback to data URL
        };
    }
}

/**
 * Convert data URL to Blob object
 */
function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    if (!header || !data) {
        throw new Error('Invalid data URL format');
    }
    
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    
    return new Blob([array], { type: mime });
}

/**
 * Ensure all required IDs are present, generating them if missing
 */
function ensureAllIdsPresent(deck: Deck): Deck {
    // Generate deck ID if missing
    const deckId = deck.id || generateId();
    
    // Process cards and ensure they all have IDs
    const cardsWithIds = deck.cards.map((card) => {
        const cardId = card.id || generateKey();
        return {
            ...card,
            id: cardId
        };
    });
    
    return {
        ...deck,
        id: deckId,
        cards: cardsWithIds
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a deck ID already exists in storage
 */
export async function checkDeckExists(deckId: string): Promise<boolean> {
    // This would check the database, but we don't have nextDb imported
    // We'll need to pass this in or handle it in the dialog
    return false; // Placeholder
}

/**
 * Generate a unique deck ID if the original conflicts
 */
export function generateUniqueDeckId(originalId: string, existingIds: string[]): string {
    if (!existingIds.includes(originalId)) {
        return originalId;
    }
    
    let counter = 1;
    let newId = `${originalId}-${counter}`;
    
    while (existingIds.includes(newId)) {
        counter++;
        newId = `${originalId}-${counter}`;
    }
    
    return newId;
}

/**
 * Estimate import file size impact
 */
export function estimateImportSize(jsonExport: JsonExport): {
    cardCount: number;
    blobCount: number;
    estimatedSize: number;
    hasBlobs: boolean;
} {
    const cardCount = jsonExport.deck.cards.length;
    const blobCount = jsonExport.blobs ? Object.keys(jsonExport.blobs).length : 0;
    const hasBlobs = blobCount > 0;
    
    let estimatedSize = JSON.stringify(jsonExport.deck).length;
    
    if (jsonExport.blobs) {
        Object.values(jsonExport.blobs).forEach(blob => {
            estimatedSize += blob.data.length;
        });
    }
    
    return {
        cardCount,
        blobCount,
        estimatedSize,
        hasBlobs
    };
}
