/**
 * Svelte 5 runes-compatible debounce utility
 *
 * Usage in components:
 * ```
 * const debouncedSave = createDebounce(saveFunction, 2000);
 *
 * $effect(() => {
 *   if (hasChanges) {
 *     debouncedSave();
 *   }
 * });
 *
 * // Cleanup on destroy
 * $effect(() => {
 *   return () => debouncedSave.cancel();
 * });
 * ```
 */
export function createDebounce<T extends (...args: any[]) => any>(
	fn: T,
	delayMs: number
): {
	(...args: Parameters<T>): void;
	cancel: () => void;
} {
	let timeoutId: number | null = null;

	function debounced(...args: Parameters<T>): void {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		timeoutId = window.setTimeout(() => {
			fn(...args);
			timeoutId = null;
		}, delayMs);
	}

	debounced.cancel = () => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return debounced;
}
