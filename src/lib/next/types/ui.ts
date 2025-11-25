/**
 * Shared UI type definitions for consistent styling across components
 */

/**
 * Alert/notification variant types used across InfoBox, Pill, ActionButton, Toast, etc.
 */
export type AlertVariant = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

/**
 * Extended variants for specific UI elements that need additional states
 */
export type ExtendedVariant = AlertVariant | 'primary' | 'secondary';
