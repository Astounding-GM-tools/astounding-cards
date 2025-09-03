import { writable } from 'svelte/store';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  timeout?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function addToast(message: string, type: ToastType = 'info', timeout = 5000) {
    const id = crypto.randomUUID();
    update(toasts => [...toasts, { id, type, message }]);

    // Log errors and warnings to console for debugging
    if (type === 'error') {
      console.error('Toast Error:', message);
    } else if (type === 'warning') {
      console.warn('Toast Warning:', message);
    }

    if (timeout) {
      setTimeout(() => {
        removeToast(id);
      }, timeout);
    }
  }

  function removeToast(id: string) {
    update(toasts => toasts.filter(t => t.id !== id));
  }

  return {
    subscribe,
    success: (msg: string, timeout?: number) => addToast(msg, 'success', timeout),
    info: (msg: string, timeout?: number) => addToast(msg, 'info', timeout),
    warning: (msg: string, timeout?: number) => addToast(msg, 'warning', timeout),
    error: (msg: string, timeout?: number) => addToast(msg, 'error', timeout),
    remove: removeToast
  };
}

export const toasts = createToastStore(); 