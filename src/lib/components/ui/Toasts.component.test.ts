// Toasts.component.test.ts - Integration test for Toasts component

import { describe, it, expect, vi } from 'vitest';
import { handleToastKeydown, createRemoveHandler, TOAST_ANIMATION } from './Toasts.svelte.ts';

describe('Toasts Component Integration', () => {
	it('should import all required extracted functions without errors', () => {
		// Verify all functions are available
		expect(handleToastKeydown).toBeDefined();
		expect(createRemoveHandler).toBeDefined();
		expect(TOAST_ANIMATION).toBeDefined();
	});

	it('should handle keydown events correctly', () => {
		const mockRemove = vi.fn();

		// Test Enter key
		const enterEvent = {
			key: 'Enter',
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent;

		handleToastKeydown(enterEvent, mockRemove);
		expect(enterEvent.preventDefault).toHaveBeenCalled();
		expect(mockRemove).toHaveBeenCalledOnce();

		// Test Space key
		mockRemove.mockClear();
		const spaceEvent = {
			key: 'Space',
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent;

		handleToastKeydown(spaceEvent, mockRemove);
		expect(spaceEvent.preventDefault).toHaveBeenCalled();
		expect(mockRemove).toHaveBeenCalledOnce();

		// Test other key (should not call remove)
		mockRemove.mockClear();
		const escapeEvent = {
			key: 'Escape',
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent;

		handleToastKeydown(escapeEvent, mockRemove);
		expect(escapeEvent.preventDefault).not.toHaveBeenCalled();
		expect(mockRemove).not.toHaveBeenCalled();
	});

	it('should create remove handler correctly', () => {
		const mockRemoveFunction = vi.fn();
		const testId = 'test-toast-id';

		const removeHandler = createRemoveHandler(mockRemoveFunction, testId);

		expect(typeof removeHandler).toBe('function');

		// Call the handler
		removeHandler();

		expect(mockRemoveFunction).toHaveBeenCalledWith(testId);
		expect(mockRemoveFunction).toHaveBeenCalledOnce();
	});

	it('should have correct animation configuration', () => {
		expect(TOAST_ANIMATION).toEqual({
			x: 100,
			duration: 300
		});

		expect(TOAST_ANIMATION.x).toBe(100);
		expect(TOAST_ANIMATION.duration).toBe(300);
	});

	it('should handle multiple toast removals independently', () => {
		const mockRemoveFunction = vi.fn();

		const handler1 = createRemoveHandler(mockRemoveFunction, 'toast-1');
		const handler2 = createRemoveHandler(mockRemoveFunction, 'toast-2');

		handler1();
		expect(mockRemoveFunction).toHaveBeenCalledWith('toast-1');

		handler2();
		expect(mockRemoveFunction).toHaveBeenCalledWith('toast-2');

		expect(mockRemoveFunction).toHaveBeenCalledTimes(2);
	});
});
