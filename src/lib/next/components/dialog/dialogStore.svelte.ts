function createDialogStore() {
    let isOpen = $state(false);
    let content = $state<any | null>(null);

    return {
        get isOpen() { return isOpen; },
        get content() { return content; },
        open() { isOpen = true; },
        close() { isOpen = false; },
        setContent(component: any) {
            content = component;
            this.open();
        }
    };
}

export const dialogStore = createDialogStore();