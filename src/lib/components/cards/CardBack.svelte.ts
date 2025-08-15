// CardBack.logic.clean.ts - Only functions actually used by CardBack component
import type { Card, CardMechanic } from '$lib/types';
import type { StatblockTemplate } from '$lib/statblockTemplates';
import { instantiateTemplate, instantiateTemplateWithVocabulary } from '$lib/statblockTemplates';
import { configToSimpleVocabulary } from '$lib/statblockConfigs';
import { parseSecrets, addSecret } from '$lib/utils/card-utils';

// ===== CARD RETRIEVAL =====

/**
 * Get card data based on preview mode and deck state
 * Used in: getCard() function (lines 36-45)
 */
export function getCardData(
  cardId: string,
  previewCard: Card,
  isPreview: boolean,
  deckCards?: Card[]
): Card {
  if (isPreview) {
    return previewCard;
  }
  
  if (!deckCards) {
    return previewCard;
  }
  
  const foundCard = deckCards.find(c => c.id === cardId);
  return foundCard || previewCard;
}

// ===== THEME RESOLUTION =====

/**
 * Resolve the active theme based on props and deck settings
 * Used in: activeTheme derived (line 27)
 */
export function resolveActiveTheme(
  propTheme?: string,
  deckTheme?: string,
  fallback: string = 'classic'
): string {
  return propTheme ?? deckTheme ?? fallback;
}

// ===== NAME PROCESSING =====

/**
 * Process name blur event to extract new name
 * Used in: handleNameBlur() function (lines 49-55)
 */
export function processNameFromBlur(event: FocusEvent): string {
  const target = event.target as HTMLElement;
  return target.textContent?.trim() || '';
}

/**
 * Check if name has changed
 * Used in: handleNameBlur() function (line 52)
 */
export function nameHasChanged(newName: string, currentName: string): boolean {
  return newName !== currentName;
}

// ===== DESCRIPTION PROCESSING =====

/**
 * Process description from element
 * Used in: handleDescBlur() function (lines 67-73)
 */
export function processDescriptionFromElement(element: HTMLElement | null): string | null {
  if (!element) return null;
  const newDesc = element.innerText?.trim();
  return newDesc || null;
}

/**
 * Check if description has changed and is valid for update
 * Used in: handleDescBlur() function (line 70)
 */
export function shouldUpdateDescription(newDesc: string | null, currentDesc: string): boolean {
  return !!(newDesc && newDesc !== currentDesc);
}

// ===== SECRETS PROCESSING =====

/**
 * Process secrets from HTML element
 * Used in: handleSecretsBlur() function (line 77)
 */
export function processSecretsFromElement(element: HTMLElement | null): any[] {
  if (!element) return [];
  return parseSecrets(element.innerHTML);
}

/**
 * Check if secrets have changed
 * Used in: handleSecretsBlur() function (line 78)
 */
export function secretsHaveChanged(newSecrets: any[], currentSecrets: any[]): boolean {
  return JSON.stringify(newSecrets) !== JSON.stringify(currentSecrets);
}

/**
 * Add a new secret to the secrets array
 * Used in: handleAddSecret() function (line 85)
 */
export function addSecretToArray(secrets: any[]): any[] {
  return addSecret(secrets);
}

// ===== TEMPLATE PROCESSING =====

/**
 * Apply template with vocabulary support (matches the exact logic from component)
 * Used in: handleTemplateSelect() function (lines 102-128)
 */
export async function applyTemplateWithVocabulary(
  template: StatblockTemplate,
  deckConfigId?: string,
  configLoader?: (id: string) => Promise<any>
): Promise<CardMechanic[]> {
  if (deckConfigId && configLoader) {
    try {
      const deckConfig = await configLoader(deckConfigId);
      const vocabulary = configToSimpleVocabulary(deckConfig);
      return instantiateTemplateWithVocabulary(template, vocabulary);
    } catch (error) {
    // Failed to load deck config
      // Fallback to default instantiation on error
      return instantiateTemplate(template);
    }
  }
  
  return instantiateTemplate(template);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if component is in editable mode
 * Used throughout component for conditional logic
 */
export function isEditableMode(editable: boolean): boolean {
  return editable;
}

/**
 * Check if element should be content editable
 * Used in: contenteditable attributes (lines 157, 170, 195)
 */
export function shouldBeContentEditable(editable: boolean, isUpdating: boolean): boolean {
  return editable && !isUpdating;
}
