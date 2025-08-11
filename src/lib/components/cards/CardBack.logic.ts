// CardBack.svelte.js - Pure logic functions for CardBack component
import type { Card, CardMechanic } from '$lib/types';
import type { StatblockTemplate } from '$lib/statblockTemplates';
import { instantiateTemplate, instantiateTemplateWithVocabulary } from '$lib/statblockTemplates';
import { configToSimpleVocabulary } from '$lib/statblockConfigs';
import { formatSecrets, parseSecrets, addSecret } from '$lib/utils/card-utils';

// ===== TYPES =====
export interface CardBackState {
  showMechanicsDialog: boolean;
  showTemplateDialog: boolean;
  templateDialogCardType: string;
}

export interface ContentValidationResult {
  isValid: boolean;
  error?: string;
}

export interface TemplateApplicationOptions {
  deckConfigId?: string;
  configLoader?: (id: string) => Promise<any>;
}

// ===== STATE MANAGEMENT =====

/**
 * Initialize CardBack component state
 */
export function initializeCardBackState(): CardBackState {
  return {
    showMechanicsDialog: false,
    showTemplateDialog: false,
    templateDialogCardType: ''
  };
}

/**
 * Update CardBack state with partial values
 */
export function updateCardBackState(
  state: CardBackState, 
  updates: Partial<CardBackState>
): CardBackState {
  return { ...state, ...updates };
}

/**
 * Reset dialog states
 */
export function resetDialogs(state: CardBackState): CardBackState {
  return {
    ...state,
    showMechanicsDialog: false,
    showTemplateDialog: false,
    templateDialogCardType: ''
  };
}

// ===== CARD RETRIEVAL =====

/**
 * Get card data based on preview mode and deck state
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
 */
export function resolveActiveTheme(
  propTheme?: string,
  deckTheme?: string,
  fallback: string = 'classic'
): string {
  return propTheme ?? deckTheme ?? fallback;
}

// ===== CONTENT VALIDATION =====

/**
 * Validate card name content
 */
export function validateCardName(name: string): ContentValidationResult {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'Card name cannot be empty' };
  }
  
  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Card name is too long (max 100 characters)' };
  }
  
  return { isValid: true };
}

/**
 * Validate card description content
 */
export function validateCardDescription(desc: string): ContentValidationResult {
  const trimmedDesc = desc.trim();
  
  if (trimmedDesc.length > 1000) {
    return { isValid: false, error: 'Description is too long (max 1000 characters)' };
  }
  
  return { isValid: true };
}

/**
 * Validate secrets content
 */
export function validateSecrets(secrets: any[]): ContentValidationResult {
  if (!Array.isArray(secrets)) {
    return { isValid: false, error: 'Secrets must be an array' };
  }
  
  if (secrets.length > 20) {
    return { isValid: false, error: 'Too many secrets (max 20)' };
  }
  
  for (let i = 0; i < secrets.length; i++) {
    const secret = secrets[i];
    if (!secret || typeof secret !== 'object') {
      return { isValid: false, error: `Secret ${i + 1} is invalid` };
    }
    
    if (!secret.label || typeof secret.label !== 'string') {
      return { isValid: false, error: `Secret ${i + 1} must have a label` };
    }
    
    if (secret.label.length > 50) {
      return { isValid: false, error: `Secret ${i + 1} label is too long (max 50 characters)` };
    }
  }
  
  return { isValid: true };
}

// ===== CONTENT PROCESSING =====

/**
 * Process name blur event to extract new name
 */
export function processNameBlur(event: FocusEvent): string | null {
  const target = event.target as HTMLElement;
  const newName = target.textContent?.trim() || '';
  return newName || null;
}

/**
 * Process description blur to extract new description
 */
export function processDescriptionBlur(element: HTMLElement | null): string | null {
  if (!element) return null;
  const newDesc = element.innerText?.trim();
  return newDesc || null;
}

/**
 * Process secrets blur to extract new secrets
 */
export function processSecretsBlur(element: HTMLElement | null): any[] {
  if (!element) return [];
  return parseSecrets(element.innerHTML);
}

/**
 * Check if content has changed
 */
export function contentHasChanged(oldValue: any, newValue: any): boolean {
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }
  return oldValue !== newValue;
}

// ===== TEMPLATE PROCESSING =====

/**
 * Prepare template dialog state
 */
export function prepareTemplateDialog(
  state: CardBackState,
  cardType: string
): CardBackState {
  return {
    ...state,
    templateDialogCardType: cardType,
    showTemplateDialog: true
  };
}

/**
 * Apply template with vocabulary support
 */
export async function applyTemplateWithVocabulary(
  template: StatblockTemplate,
  options: TemplateApplicationOptions = {}
): Promise<CardMechanic[]> {
  const { deckConfigId, configLoader } = options;
  
  if (deckConfigId && configLoader) {
    try {
      const deckConfig = await configLoader(deckConfigId);
      const vocabulary = configToSimpleVocabulary(deckConfig);
      return instantiateTemplateWithVocabulary(template, vocabulary);
    } catch (error) {
      console.error('Failed to load deck config:', error);
      // Fallback to default instantiation on error
      return instantiateTemplate(template);
    }
  }
  
  return instantiateTemplate(template);
}

/**
 * Create template application handler
 */
export function createTemplateHandler(
  options: TemplateApplicationOptions = {}
) {
  return async (template: StatblockTemplate): Promise<CardMechanic[]> => {
    return await applyTemplateWithVocabulary(template, options);
  };
}

// ===== SECRETS MANAGEMENT =====

/**
 * Add a new secret to the secrets array
 */
export function addSecretToArray(secrets: any[]): any[] {
  return addSecret(secrets);
}

/**
 * Format secrets for display
 */
export function formatSecretsForDisplay(secrets: any[]): string {
  return formatSecrets(secrets);
}

/**
 * Parse secrets from HTML content
 */
export function parseSecretsFromHtml(html: string): any[] {
  return parseSecrets(html);
}

// ===== MECHANICS MANAGEMENT =====

/**
 * Validate mechanics array
 */
export function validateMechanics(mechanics: CardMechanic[]): ContentValidationResult {
  if (!Array.isArray(mechanics)) {
    return { isValid: false, error: 'Mechanics must be an array' };
  }
  
  if (mechanics.length > 50) {
    return { isValid: false, error: 'Too many mechanics (max 50)' };
  }
  
  for (let i = 0; i < mechanics.length; i++) {
    const mechanic = mechanics[i];
    if (!mechanic || typeof mechanic !== 'object') {
      return { isValid: false, error: `Mechanic ${i + 1} is invalid` };
    }
    
    if (!mechanic.name || typeof mechanic.name !== 'string') {
      return { isValid: false, error: `Mechanic ${i + 1} must have a name` };
    }
    
    if (mechanic.name.length > 100) {
      return { isValid: false, error: `Mechanic ${i + 1} name is too long (max 100 characters)` };
    }
  }
  
  return { isValid: true };
}

/**
 * Check if mechanics have changed
 */
export function mechanicsHaveChanged(
  oldMechanics: CardMechanic[],
  newMechanics: CardMechanic[]
): boolean {
  return JSON.stringify(oldMechanics) !== JSON.stringify(newMechanics);
}

// ===== DIALOG STATE MANAGEMENT =====

/**
 * Show mechanics dialog
 */
export function showMechanicsDialog(state: CardBackState): CardBackState {
  return { ...state, showMechanicsDialog: true };
}

/**
 * Hide mechanics dialog
 */
export function hideMechanicsDialog(state: CardBackState): CardBackState {
  return { ...state, showMechanicsDialog: false };
}

/**
 * Show template dialog for specific card type
 */
export function showTemplateDialog(
  state: CardBackState,
  cardType: string
): CardBackState {
  return {
    ...state,
    showTemplateDialog: true,
    templateDialogCardType: cardType
  };
}

/**
 * Hide template dialog
 */
export function hideTemplateDialog(state: CardBackState): CardBackState {
  return {
    ...state,
    showTemplateDialog: false,
    templateDialogCardType: ''
  };
}

// ===== UPDATE HELPERS =====

/**
 * Prepare update payload for card field
 */
export function prepareUpdatePayload<T>(
  fieldName: string,
  newValue: T,
  validationFn?: (value: T) => ContentValidationResult
): { isValid: boolean; payload?: Record<string, T>; error?: string } {
  if (validationFn) {
    const validation = validationFn(newValue);
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
  }
  
  return {
    isValid: true,
    payload: { [fieldName]: newValue } as Record<string, T>
  };
}

/**
 * Create field update handlers
 */
export function createFieldUpdateHandler<T>(
  fieldName: string,
  validationFn?: (value: T) => ContentValidationResult
) {
  return (newValue: T) => {
    return prepareUpdatePayload(fieldName, newValue, validationFn);
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if component is in editable mode
 */
export function isEditable(
  editable: boolean,
  isUpdating: boolean = false
): boolean {
  return editable && !isUpdating;
}

/**
 * Get content editable state
 */
export function getContentEditableState(
  editable: boolean,
  isUpdating: boolean = false
): boolean {
  return editable && !isUpdating;
}

/**
 * Check if element should be disabled
 */
export function shouldDisableElement(
  editable: boolean,
  isUpdating: boolean = false
): boolean {
  return !editable || isUpdating;
}
