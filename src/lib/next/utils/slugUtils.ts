/**
 * Slug Generation Utilities
 * 
 * Shared utilities for creating URL-friendly and filename-friendly slugs
 * from deck titles and other text content.
 */

/**
 * Create a URL-friendly slug from text
 * Supports international characters better than standard ASCII-only slugs
 * Examples:
 *   "Heroes of the Realm" → "heroes-of-the-realm"
 *   "Verdens Største Pære" → "verdens-største-pære"
 *   "魔法の冒険" → "魔法の冒険"
 *   "Café München" → "café-münchen"
 *   "Heroes & Dragons 🐉" → "heroes-dragons"
 */
export function createSlug(text: string): string {
    let slug = text
        .toLowerCase()
        .trim();
    
    // Handle common symbols and punctuation that should become separators
    slug = slug
        .replace(/[&+]/g, '')  // Remove ampersands and plus signs
        .replace(/[\s_.,:;!?()\[\]{}"'`~@#$%^*=|\\/<>]/g, '-')  // Convert punctuation to hyphens
        .replace(/[\u2013\u2014\u2015\u2212]/g, '-')  // Convert various dash types to hyphens
        .replace(/[\u201C\u201D\u2018\u2019]/g, '')  // Remove curly quotes
        .replace(/\u2026/g, '')  // Remove ellipsis
        .replace(/[\uFE0F\u200D]/g, '');  // Remove emoji modifiers and zero-width joiners
    
    // Remove emoji characters (but keep other Unicode like letters, numbers)
    // This regex matches most emoji ranges while preserving international text
    slug = slug.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    // Clean up hyphens
    slug = slug
        .replace(/-+/g, '-')  // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
    
    return slug;
}

/**
 * Create a filename-safe slug from text
 * Similar to createSlug but more restrictive for file system compatibility
 */
export function createFilenameSlug(text: string, maxLength: number = 50): string {
    let slug = createSlug(text);
    
    // Additional restrictions for filenames
    slug = slug
        .replace(/[<>:"/\\|?*]/g, '-')  // Remove characters that are problematic in filenames
        .substring(0, maxLength);  // Limit length
    
    // Ensure it doesn't end with a period (Windows issue)
    if (slug.endsWith('.')) {
        slug = slug.slice(0, -1);
    }
    
    return slug || 'unnamed';  // Fallback if slug becomes empty
}

/**
 * Create a URL slug specifically for deck routes
 */
export function createDeckSlug(title: string): string {
    return createSlug(title);
}

/**
 * Create a filename for deck exports (JSON, etc.)
 */
export function createDeckFilename(title: string, extension: string, includeDate: boolean = true): string {
    const baseSlug = createFilenameSlug(title);
    const timestamp = includeDate ? `-${new Date().toISOString().split('T')[0]}` : '';
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    
    return `${baseSlug}${timestamp}${ext}`;
}
