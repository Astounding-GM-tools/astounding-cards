import { writable } from 'svelte/store';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	timeout?: number;
	dismissible?: boolean;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function addToast(message: string, type: ToastType = 'info', timeout = 5000, dismissible = true) {
		// Use crypto.randomUUID if available (HTTPS), otherwise fallback to Date.now + random
		const id = typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		update((toasts) => [...toasts, { id, type, message, timeout, dismissible }]);

		// Log errors and warnings to console for debugging
		if (type === 'error') {
			console.error('Toast Error:', message);
		} else if (type === 'warning') {
			console.warn('Toast Warning:', message);
		}

		if (timeout && timeout > 0) {
			setTimeout(() => {
				removeToast(id);
			}, timeout);
		}

		return id; // Return ID for spinner toasts that need to be updated/removed
	}

	function removeToast(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	function updateToast(id: string, updates: Partial<Toast>) {
		update((toasts) => toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)));
	}

	return {
		subscribe,
		success: (msg: string, timeout = 5000) => addToast(msg, 'success', timeout), // Auto-dismiss after 5s
		info: (msg: string, timeout = 5000) => addToast(msg, 'info', timeout), // Auto-dismiss after 5s
		warning: (msg: string, timeout = 0) => addToast(msg, 'warning', timeout), // Manual dismiss
		error: (msg: string, timeout = 0) => addToast(msg, 'error', timeout), // Manual dismiss
		loading: (msg: string) => addToast(msg, 'loading', 0, false), // No timeout, not dismissible
		remove: removeToast,
		update: updateToast
	};
}

export const toasts = createToastStore();
