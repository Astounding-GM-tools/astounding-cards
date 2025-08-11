// Global test setup for Vitest
import { vi } from 'vitest';

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-1234-5678-90ab-cdef'),
  },
});

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T12:00:00Z');
vi.setSystemTime(mockDate);

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock indexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    deleteDatabase: vi.fn(() => ({
      onsuccess: null,
      onerror: null,
      onblocked: null,
    })),
  },
});
