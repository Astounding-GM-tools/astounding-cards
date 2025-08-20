/**
 * Dialog Store
 * 
 * Manages state for the dialog system:
 * - Controls dialog visibility (isOpen)
 * - Manages dialog content (snippet to render)
 * - Handles state cleanup on close
 * 
 * Usage:
 * ```ts
 * import { dialogStore } from './dialogStore.svelte';
 * 
 * // Open dialog with content snippet
 * dialogStore.setContent(MyContentSnippet);
 * 
 * // Close dialog (also cleans up content)
 * dialogStore.close();
 * ```
 */
function createDialogStore() {
    let isOpen = $state(false);
    let content = $state<any | null>(null);
    let contentProps = $state<any>({});

    return {
        get isOpen() { return isOpen; },
        get content() { return content; },
        get contentProps() { return contentProps; },
        open() { isOpen = true; },
        close() {
            isOpen = false;
            content = null;
            contentProps = {};
        },
        setContent(component: any, props: any = {}) {
            content = component;
            contentProps = props;
            this.open();
        }
    };
}

export const dialogStore = createDialogStore();