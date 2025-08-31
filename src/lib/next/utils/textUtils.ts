/**
 * Text Formatting Utilities
 * 
 * Shared utilities for formatting label-value pairs, parsing HTML content,
 * and other common text processing operations.
 */

/**
 * Format an array of label-value strings into HTML with bold labels
 * @param items Array of strings in format "Label: Description"
 * @param cssClass CSS class name for the label (e.g., 'trait-label', 'secret-label')
 * @returns HTML string with formatted items
 */
export function formatLabelValueList(items: string[], cssClass: string = 'label'): string {
  return items?.map(item => {
    const [label, ...rest] = item.split(':');
    if (rest.length > 0) {
      return `<strong class="${cssClass}">${label.trim()}:</strong> ${rest.join(':').trim()}`;
    }
    return item;
  }).join('\n') || '';
}

/**
 * Parse HTML-formatted content back into array of plain strings
 * Removes HTML tags and splits by newlines
 * @param html HTML string from contenteditable element
 * @returns Array of plain text strings
 */
export function parseHtmlToStringArray(html: string): string[] {
  return html
    .replace(/<strong[^>]*>|<\/strong>/g, '')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Add a new item to an array with optional default template
 * @param items Current array
 * @param newItem New item to add (defaults to template)
 * @returns Updated array
 */
export function addToStringArray(items: string[], newItem: string = 'Label: Description'): string[] {
  return [...(items || []), newItem];
}

/**
 * Validate and trim a text field with length constraints
 * @param text Input text
 * @param maxLength Maximum allowed length (optional)
 * @param required Whether the field is required (default: true)
 * @param fieldName Name for error messages (default: 'Field')
 * @returns Validation result with trimmed text
 */
export function validateTextField(
  text: string, 
  maxLength?: number, 
  required: boolean = true,
  fieldName: string = 'Field'
): {
  isValid: boolean;
  trimmedText: string;
  error?: string;
} {
  const trimmedText = text.trim();
  
  if (required && !trimmedText) {
    return {
      isValid: false,
      trimmedText,
      error: `${fieldName} cannot be empty`
    };
  }
  
  if (maxLength && trimmedText.length > maxLength) {
    return {
      isValid: false,
      trimmedText,
      error: `${fieldName} cannot exceed ${maxLength} characters`
    };
  }
  
  return {
    isValid: true,
    trimmedText
  };
}

/**
 * Clean and normalize text input (trim, collapse whitespace, etc.)
 * @param text Input text
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text Input text
 * @param maxLength Maximum length including ellipsis
 * @param suffix Suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength - suffix.length);
  return truncated + suffix;
}
