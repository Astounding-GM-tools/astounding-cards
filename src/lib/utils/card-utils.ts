// src/lib/utils/card-utils.ts

/**
 * Formats traits array into HTML string with bold labels
 * @param traits Array of trait strings in format "Label: Description"
 * @returns HTML string with formatted traits
 */
export function formatTraits(traits: string[]): string {
  return traits?.map(trait => {
    const [label, ...rest] = trait.split(':');
    if (rest.length > 0) {
      return `<strong class="trait-label">${label.trim()}:</strong> ${rest.join(':').trim()}`;
    }
    return trait;
  }).join('\n') || '';
}

/**
 * Parses HTML-formatted traits back into array of plain strings
 * @param html HTML string from contenteditable element
 * @returns Array of trait strings
 */
export function parseTraits(html: string): string[] {
  return html
    .replace(/<strong[^>]*>|<\/strong>/g, '')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Formats secrets array into HTML string with bold labels
 * @param secrets Array of secret strings in format "Label: Description"
 * @returns HTML string with formatted secrets
 */
export function formatSecrets(secrets: string[]): string {
  return secrets?.map(secret => {
    const [label, ...rest] = secret.split(':');
    if (rest.length > 0) {
      return `<strong class="secret-label">${label.trim()}:</strong> ${rest.join(':').trim()}`;
    }
    return secret;
  }).join('\n') || '';
}

/**
 * Parses HTML-formatted secrets back into array of plain strings
 * @param html HTML string from contenteditable element
 * @returns Array of secret strings
 */
export function parseSecrets(html: string): string[] {
  return html
    .replace(/<strong[^>]*>|<\/strong>/g, '')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Adds a new trait to the traits array
 * @param traits Current traits array
 * @param newTrait New trait to add (defaults to template)
 * @returns Updated traits array
 */
export function addTrait(traits: string[], newTrait: string = 'Label: Description'): string[] {
  return [...(traits || []), newTrait];
}

/**
 * Adds a new secret to the secrets array
 * @param secrets Current secrets array
 * @param newSecret New secret to add (defaults to template)
 * @returns Updated secrets array
 */
export function addSecret(secrets: string[], newSecret: string = 'Label: Description'): string[] {
  return [...(secrets || []), newSecret];
}
