/**
 * Deck Merging Utilities
 * 
 * Handles diffing and merging of decks when importing conflicts with existing data.
 * Used for both URL imports and JSON imports.
 */

import type { Deck, Card } from '../types/deck.js';
import {
    METADATA_RESOLUTION,
    CARD_RESOLUTION, 
    FIELD_RESOLUTION,
    CONFLICT_TYPE,
    CARD_CONFLICT_TYPE,
    MERGE_ACTION,
    type MetadataResolution,
    type CardResolution,
    type FieldResolution,
    type ConflictType,
    type CardConflictType,
    type MergeAction
} from './mergeConstants.js';

// =============================================================================
// TYPES
// =============================================================================

export interface DeckConflict {
    type: ConflictType;
    existingDeck: Deck;
    importedDeck: Deck;
    metaConflicts: MetaConflict[];
    cardConflicts: CardConflict[];
}

export interface MetaConflict {
    field: keyof Deck['meta'];
    existingValue: any;
    importedValue: any;
    resolution?: MetadataResolution;
    customValue?: any;
    recommendation?: string;
}

export interface CardConflict {
    type: CardConflictType;
    cardId: string;
    existingCard?: Card;
    importedCard?: Card;
    fieldConflicts?: FieldConflict[];
    resolution?: CardResolution;
}

export interface FieldConflict {
    field: keyof Card;
    existing: any;
    imported: any;
    resolution?: FieldResolution;
}

export interface MergeResolution {
    existingDeck: Deck;
    deckMeta: Partial<Deck['meta']>;
    cardUpdates: Array<{
        action: MergeAction;
        cardId: string;
        cardData?: Partial<Card>;
    }>;
}

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * Check if importing a deck would create conflicts with existing deck
 */
export function detectDeckConflict(
    existingDeck: Deck,
    importedDeck: Deck
): DeckConflict {
    // Detect metadata conflicts
    const metaConflicts = detectMetaConflicts(existingDeck.meta, importedDeck.meta);
    
    // Detect card conflicts
    const cardConflicts = detectCardConflicts(existingDeck.cards, importedDeck.cards);
    
    return {
        type: CONFLICT_TYPE.DECK_EXISTS,
        existingDeck,
        importedDeck,
        metaConflicts,
        cardConflicts
    };
}

/**
 * Detect conflicts in deck metadata
 */
function detectMetaConflicts(existing: Deck['meta'], imported: Deck['meta']): MetaConflict[] {
    const conflicts: MetaConflict[] = [];
    const fieldsToCheck: Array<keyof Deck['meta']> = ['title', 'description', 'theme', 'layout'];
    
    for (const field of fieldsToCheck) {
        if (existing[field] !== imported[field]) {
            conflicts.push({
                field,
                existingValue: existing[field],
                importedValue: imported[field],
                resolution: METADATA_RESOLUTION.UNRESOLVED
            });
        }
    }
    
    return conflicts;
}

/**
 * Detect conflicts in cards
 */
function detectCardConflicts(existingCards: Card[], importedCards: Card[]): CardConflict[] {
    const conflicts: CardConflict[] = [];
    const existingCardMap = new Map(existingCards.map(c => [c.id, c]));
    const importedCardMap = new Map(importedCards.map(c => [c.id, c]));
    
    // Check for existing cards that conflict or are removed
    for (const [cardId, existingCard] of existingCardMap) {
        const importedCard = importedCardMap.get(cardId);
        
        if (!importedCard) {
            // Card exists in current deck but not in import
            conflicts.push({
                type: CARD_CONFLICT_TYPE.REMOVED,
                cardId,
                existingCard: existingCard,
                resolution: CARD_RESOLUTION.UNRESOLVED
            });
        } else {
            // Card exists in both - check for field conflicts
            const fieldConflicts = detectCardFieldConflicts(existingCard, importedCard);
            if (fieldConflicts.length > 0) {
                conflicts.push({
                    type: CARD_CONFLICT_TYPE.MODIFIED,
                    cardId,
                    existingCard: existingCard,
                    importedCard: importedCard,
                    fieldConflicts,
                    resolution: CARD_RESOLUTION.UNRESOLVED
                });
            }
        }
    }
    
    // Check for new cards in import
    for (const [cardId, importedCard] of importedCardMap) {
        if (!existingCardMap.has(cardId)) {
            conflicts.push({
                type: CARD_CONFLICT_TYPE.ADDED,
                cardId,
                importedCard: importedCard,
                resolution: CARD_RESOLUTION.UNRESOLVED
            });
        }
    }
    
    return conflicts;
}

/**
 * Detect field-level conflicts within a single card
 */
function detectCardFieldConflicts(existing: Card, imported: Card): FieldConflict[] {
    const conflicts: FieldConflict[] = [];
    const fieldsToCheck: Array<keyof Card> = [
        'title', 'subtitle', 'description', 'image'
    ];
    
    for (const field of fieldsToCheck) {
        if (existing[field] !== imported[field]) {
            conflicts.push({
                field,
                existing: existing[field],
                imported: imported[field]
            });
        }
    }
    
    // Check traits and stats arrays
    if (!arraysEqual(existing.traits || [], imported.traits || [])) {
        conflicts.push({
            field: 'traits',
            existing: existing.traits,
            imported: imported.traits
        });
    }
    
    if (!arraysEqual(existing.stats || [], imported.stats || [])) {
        conflicts.push({
            field: 'stats',
            existing: existing.stats,
            imported: imported.stats
        });
    }
    
    return conflicts;
}

/**
 * Deep equality check for arrays
 */
function arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return JSON.stringify(a) === JSON.stringify(b);
}

// =============================================================================
// SMART DEFAULTS
// =============================================================================

/**
 * Apply smart default resolutions to conflicts
 * Generally prefers newer content, but can be overridden by user
 */
export function applySmartDefaults(conflict: DeckConflict): DeckConflict {
    const resolvedConflict = { ...conflict };
    
    // For metadata: prefer imported if it has a newer timestamp
    resolvedConflict.metaConflicts = conflict.metaConflicts.map(metaConflict => ({
        ...metaConflict,
        resolution: conflict.importedDeck.meta.lastEdited > conflict.existingDeck.meta.lastEdited
            ? METADATA_RESOLUTION.USE_IMPORTED
            : METADATA_RESOLUTION.KEEP_EXISTING
    }));
    
    // For cards: prefer newer content, add new cards, keep removed cards by default
    resolvedConflict.cardConflicts = conflict.cardConflicts.map(cardConflict => {
        const resolved = { ...cardConflict };
        
        switch (cardConflict.type) {
            case CARD_CONFLICT_TYPE.ADDED:
                resolved.resolution = CARD_RESOLUTION.ADD; // Add new cards by default
                break;
            case CARD_CONFLICT_TYPE.REMOVED: 
                resolved.resolution = CARD_RESOLUTION.KEEP_EXISTING; // Keep removed cards by default (don't delete)
                break;
            case CARD_CONFLICT_TYPE.MODIFIED:
                // For field conflicts, prefer imported if deck is newer overall
                resolved.resolution = conflict.importedDeck.meta.lastEdited > conflict.existingDeck.meta.lastEdited
                    ? CARD_RESOLUTION.USE_IMPORTED
                    : CARD_RESOLUTION.KEEP_EXISTING;
                    
                // Apply same logic to field-level conflicts
                if (resolved.fieldConflicts) {
                    resolved.fieldConflicts = resolved.fieldConflicts.map(fieldConflict => ({
                        ...fieldConflict,
                        resolution: resolved.resolution === CARD_RESOLUTION.USE_IMPORTED 
                            ? FIELD_RESOLUTION.USE_IMPORTED 
                            : FIELD_RESOLUTION.KEEP_EXISTING
                    }));
                }
                break;
        }
        
        return resolved;
    });
    
    return resolvedConflict;
}

// =============================================================================
// MERGE RESOLUTION
// =============================================================================

/**
 * Convert resolved conflicts into concrete merge operations
 */
export function createMergeResolution(conflict: DeckConflict): MergeResolution {
    const deckMeta: Partial<Deck['meta']> = {};
    const cardUpdates: MergeResolution['cardUpdates'] = [];
    
    // Apply metadata resolutions
    for (const metaConflict of conflict.metaConflicts) {
        if (metaConflict.resolution === METADATA_RESOLUTION.USE_IMPORTED) {
            deckMeta[metaConflict.field] = metaConflict.importedValue;
        } else if (metaConflict.resolution === METADATA_RESOLUTION.CUSTOM) {
            deckMeta[metaConflict.field] = metaConflict.customValue;
        }
        // KEEP_EXISTING means don't update, so no action needed
    }
    
    // Always update lastEdited to mark this merge
    deckMeta.lastEdited = Date.now();
    
    // Apply card resolutions
    for (const cardConflict of conflict.cardConflicts) {
        switch (cardConflict.type) {
            case CARD_CONFLICT_TYPE.ADDED:
                if (cardConflict.resolution === CARD_RESOLUTION.ADD && cardConflict.importedCard) {
                    cardUpdates.push({
                        action: MERGE_ACTION.ADD,
                        cardId: cardConflict.cardId,
                        cardData: cardConflict.importedCard
                    });
                }
                break;
                
            case CARD_CONFLICT_TYPE.REMOVED:
                if (cardConflict.resolution === CARD_RESOLUTION.REMOVE) {
                    // User chose to remove the card
                    cardUpdates.push({
                        action: MERGE_ACTION.REMOVE,
                        cardId: cardConflict.cardId
                    });
                }
                // KEEP_EXISTING means don't remove, so no action needed
                break;
                
            case CARD_CONFLICT_TYPE.MODIFIED:
                if (cardConflict.resolution === CARD_RESOLUTION.USE_IMPORTED && cardConflict.importedCard) {
                    // Replace entire card with imported version
                    cardUpdates.push({
                        action: MERGE_ACTION.UPDATE,
                        cardId: cardConflict.cardId,
                        cardData: cardConflict.importedCard
                    });
                } else if (cardConflict.fieldConflicts && cardConflict.existingCard) {
                    // Apply field-level resolutions
                    const updatedCard = { ...cardConflict.existingCard };
                    let hasChanges = false;
                    
                    for (const fieldConflict of cardConflict.fieldConflicts) {
                        if (fieldConflict.resolution === FIELD_RESOLUTION.USE_IMPORTED) {
                            (updatedCard as any)[fieldConflict.field] = fieldConflict.imported;
                            hasChanges = true;
                        }
                    }
                    
                    if (hasChanges) {
                        cardUpdates.push({
                            action: MERGE_ACTION.UPDATE,
                            cardId: cardConflict.cardId,
                            cardData: updatedCard
                        });
                    }
                }
                break;
        }
    }
    
    return { 
        existingDeck: conflict.existingDeck,
        deckMeta, 
        cardUpdates 
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export interface ConflictSummary {
    metaChanges: number;
    cardsAdded: number;
    cardsModified: number;
    cardsRemoved: number;
    unresolvedConflicts: number;
}

/**
 * Check if a conflict has any unresolved items
 */
export function hasUnresolvedConflicts(conflict: DeckConflict): boolean {
    const metaConflicts = conflict.metaConflicts || [];
    const cardConflicts = conflict.cardConflicts || [];
    
    // Check meta conflicts
    if (metaConflicts.some(c => !c.resolution)) {
        return true;
    }
    
    // Check card conflicts
    if (cardConflicts.some(c => !c.resolution)) {
        return true;
    }
    
    // Check field-level conflicts
    return cardConflicts.some(c => 
        c.fieldConflicts && c.fieldConflicts.some(f => !f.resolution)
    );
}

/**
 * Get a summary of the conflicts for display
 */
export function getConflictSummary(conflict: DeckConflict): {
    metaChanges: number;
    cardsAdded: number;
    cardsModified: number;
    cardsRemoved: number;
    unresolvedConflicts: number;
} {
    const metaConflicts = conflict.metaConflicts || [];
    const cardConflicts = conflict.cardConflicts || [];
    
    return {
        metaChanges: metaConflicts.length,
        cardsAdded: cardConflicts.filter(c => c.type === CARD_CONFLICT_TYPE.ADDED).length,
        cardsModified: cardConflicts.filter(c => c.type === CARD_CONFLICT_TYPE.MODIFIED).length,
        cardsRemoved: cardConflicts.filter(c => c.type === CARD_CONFLICT_TYPE.REMOVED).length,
        unresolvedConflicts: hasUnresolvedConflicts(conflict) ? 1 : 0
    };
}

/**
 * Apply a merge resolution to create the final merged deck
 */
export function applyMergeResolution(resolution: MergeResolution): Deck {
    const { existingDeck, deckMeta, cardUpdates } = resolution;
    
    // Start with the existing deck
    const mergedDeck: Deck = {
        ...existingDeck,
        meta: {
            ...existingDeck.meta,
            ...deckMeta,
            lastEdited: Date.now() // Always update the timestamp
        }
    };
    
    // Apply card updates
    let cards = [...existingDeck.cards];
    
    for (const update of cardUpdates) {
        switch (update.action) {
            case MERGE_ACTION.ADD:
                if (update.cardData) {
                    // Ensure the card data is complete
                    cards.push(update.cardData as Card);
                }
                break;
                
            case MERGE_ACTION.UPDATE:
                if (update.cardData) {
                    const cardIndex = cards.findIndex(c => c.id === update.cardId);
                    if (cardIndex !== -1) {
                        cards[cardIndex] = {
                            ...cards[cardIndex],
                            ...update.cardData
                        };
                    }
                }
                break;
                
            case MERGE_ACTION.REMOVE:
                cards = cards.filter(c => c.id !== update.cardId);
                break;
        }
    }
    
    mergedDeck.cards = cards;
    return mergedDeck;
}
