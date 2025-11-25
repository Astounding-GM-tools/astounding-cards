/**
 * Utility functions for safely cloning objects, especially those containing
 * non-cloneable data like Blob objects that are common in our card system.
 */

/**
 * Safely deep clone an object, handling non-cloneable types like Blobs.
 *
 * This function handles:
 * - Primitive values (return as-is)
 * - Blob objects (keeps reference since they're immutable)
 * - Arrays (recursively clones each item)
 * - Plain objects (recursively clones each property)
 * - Functions, Dates, RegExp, etc. (keeps reference)
 *
 * @param obj - The object to clone
 * @returns A deep clone of the object with safe handling of non-cloneable types
 */
export function safeDeepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Handle Blob objects - keep reference since they're immutable
	if (obj instanceof Blob) {
		return obj;
	}

	// Handle Date objects - create new Date
	if (obj instanceof Date) {
		return new Date(obj.getTime()) as T;
	}

	// Handle RegExp objects - create new RegExp
	if (obj instanceof RegExp) {
		return new RegExp(obj) as T;
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => safeDeepClone(item)) as T;
	}

	// Handle plain objects
	const cloned = {} as T;
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			cloned[key] = safeDeepClone(obj[key]);
		}
	}
	return cloned;
}

/**
 * Safely clone a card object with special handling for card-specific properties.
 * This is optimized for the Card interface used throughout the app.
 *
 * @param card - The card object to clone
 * @returns A deep clone of the card with proper isolation
 */
export function safeCloneCard<T extends { stats?: any[]; traits?: any[]; imageBlob?: Blob | null }>(
	card: T
): T {
	return {
		...card,
		stats: card.stats ? safeDeepClone(card.stats) : undefined,
		traits: card.traits ? safeDeepClone(card.traits) : undefined,
		imageBlob: card.imageBlob || null // Blobs are immutable, safe to share reference
	} as T;
}

/**
 * Check if an object contains non-cloneable properties.
 * Useful for debugging clone issues.
 *
 * @param obj - Object to check
 * @param path - Path for debugging (internal use)
 * @returns Array of paths where non-cloneable objects were found
 */
export function findNonCloneableProperties(obj: any, path: string = 'root'): string[] {
	const issues: string[] = [];

	try {
		// Try to clone the object
		structuredClone(obj);
		return []; // No issues found
	} catch (error) {
		// Object contains non-cloneable data, investigate further
	}

	if (typeof obj !== 'object' || obj === null) {
		return [];
	}

	// Check for common non-cloneable types
	if (obj instanceof Blob) {
		issues.push(`${path}: Blob object`);
	} else if (typeof obj === 'function') {
		issues.push(`${path}: Function`);
	} else if (obj instanceof Node) {
		issues.push(`${path}: DOM Node`);
	} else if (Array.isArray(obj)) {
		// Check array items
		obj.forEach((item, index) => {
			issues.push(...findNonCloneableProperties(item, `${path}[${index}]`));
		});
	} else {
		// Check object properties
		for (const [key, value] of Object.entries(obj)) {
			issues.push(...findNonCloneableProperties(value, `${path}.${key}`));
		}
	}

	return issues;
}

/**
 * Attempt to use structuredClone with fallback to safeDeepClone.
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function cloneWithFallback<T>(obj: T): T {
	try {
		return structuredClone(obj);
	} catch (error) {
		console.warn('structuredClone failed, falling back to safeDeepClone:', error);
		return safeDeepClone(obj);
	}
}
