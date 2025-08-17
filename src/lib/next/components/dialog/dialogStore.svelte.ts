/**
 * Dialog Store
 * 
 * Manages state for the dialog system:
 * - Controls dialog visibility (isOpen)
 * - Manages dialog content (component to render)
 * - Handles state cleanup on close
 * 
 * Usage:
 * ```ts
 * import { dialogStore } from './dialogStore.svelte';
 * 
 * // Open dialog with content
 * dialogStore.setContent(MyComponent);
 * 
 * // Close dialog (also cleans up content)
 * dialogStore.close();
 * ```
 */
function createDialogStore() {
    let isOpen = $state(false);
    let content = $state<any | null>(null);

    return {
        get isOpen() { return isOpen; },
        get content() { return content; },
        open() { isOpen = true; },
        close() {
            isOpen = false;
            content = null;  // Clean up content when closing
        },
        setContent(component: any) {
            content = component;
            this.open();
        }
    };
}

export const dialogStore = createDialogStore();