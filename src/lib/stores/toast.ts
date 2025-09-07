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
    const id = crypto.randomUUID();
    update(toasts => [...toasts, { id, type, message, timeout, dismissible }]);

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
    update(toasts => toasts.filter(t => t.id !== id));
  }
  
  function updateToast(id: string, updates: Partial<Toast>) {
    update(toasts => toasts.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  return {
    subscribe,
    success: (msg: string, timeout?: number) => addToast(msg, 'success', timeout),
    info: (msg: string, timeout?: number) => addToast(msg, 'info', timeout),
    warning: (msg: string, timeout?: number) => addToast(msg, 'warning', timeout),
    error: (msg: string, timeout?: number) => addToast(msg, 'error', timeout),
    loading: (msg: string) => addToast(msg, 'loading', 0, false), // No timeout, not dismissible
    remove: removeToast,
    update: updateToast
  };
}

export const toasts = createToastStore(); 