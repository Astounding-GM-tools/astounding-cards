/**
 * Centralized constants for deck merging and conflict resolution
 *
 * This file contains all the string constants used throughout the merge system
 * to prevent magic string mismatches and improve maintainability.
 */

// =============================================================================
// RESOLUTION TYPES
// =============================================================================

export const METADATA_RESOLUTION = {
	KEEP_EXISTING: 'keep_existing',
	USE_IMPORTED: 'use_imported',
	CUSTOM: 'custom',
	UNRESOLVED: 'unresolved'
} as const;

export const CARD_RESOLUTION = {
	ADD: 'add',
	SKIP: 'skip',
	KEEP_EXISTING: 'keep_existing',
	USE_IMPORTED: 'use_imported',
	REMOVE: 'remove',
	UNRESOLVED: 'unresolved'
} as const;

export const FIELD_RESOLUTION = {
	KEEP_EXISTING: 'keep_existing',
	USE_IMPORTED: 'use_imported'
} as const;

// =============================================================================
// CONFLICT TYPES
// =============================================================================

export const CONFLICT_TYPE = {
	DECK_EXISTS: 'deck_exists'
} as const;

export const CARD_CONFLICT_TYPE = {
	ADDED: 'added',
	MODIFIED: 'modified',
	REMOVED: 'removed'
} as const;

// =============================================================================
// MERGE ACTIONS
// =============================================================================

export const MERGE_ACTION = {
	ADD: 'add',
	UPDATE: 'update',
	REMOVE: 'remove'
} as const;

// =============================================================================
// TYPE EXPORTS (for TypeScript)
// =============================================================================

export type MetadataResolution = (typeof METADATA_RESOLUTION)[keyof typeof METADATA_RESOLUTION];
export type CardResolution = (typeof CARD_RESOLUTION)[keyof typeof CARD_RESOLUTION];
export type FieldResolution = (typeof FIELD_RESOLUTION)[keyof typeof FIELD_RESOLUTION];
export type ConflictType = (typeof CONFLICT_TYPE)[keyof typeof CONFLICT_TYPE];
export type CardConflictType = (typeof CARD_CONFLICT_TYPE)[keyof typeof CARD_CONFLICT_TYPE];
export type MergeAction = (typeof MERGE_ACTION)[keyof typeof MERGE_ACTION];
