/**
 * Safe Deep Clone Utility
 *
 * Provides safe deep cloning that handles Blob and other non-cloneable objects
 * that cause issues with structuredClone.
 *
 * This utility should be used throughout the project instead of structuredClone
 * when dealing with objects that might contain Blobs or other special objects.
 */

/**
 * Safely deep clones an object, handling Blob and other non-cloneable types
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function safeDeepClone(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Handle Blob objects - they're immutable so we can share the reference
	if (obj instanceof Blob) {
		return obj;
	}

	// Handle File objects (which extend Blob) - also immutable
	if (obj instanceof File) {
		return obj;
	}

	// Handle Date objects
	if (obj instanceof Date) {
		return new Date(obj.getTime());
	}

	// Handle Arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => safeDeepClone(item));
	}

	// Handle regular objects
	const cloned = {};
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			cloned[key] = safeDeepClone(obj[key]);
		}
	}

	return cloned;
}
