import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize from localStorage if available
const storedDevMode = browser ? localStorage.getItem('devMode') === 'true' : false;
export const devMode = writable<boolean>(storedDevMode);

// Persist changes to localStorage
if (browser) {
  devMode.subscribe(value => {
    localStorage.setItem('devMode', value.toString());
  });
}

// Utility function to toggle dev mode from console
export function toggleDevMode() {
  devMode.update(v => !v);
  return `Dev mode ${!storedDevMode ? 'enabled' : 'disabled'}`;
}

// Make toggleDevMode available in console
if (browser) {
  (window as any).toggleDevMode = toggleDevMode;
} 