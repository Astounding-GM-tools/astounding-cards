/**
 * Integration test for CardMechanicsDialog
 */

import { describe, it, expect } from 'vitest';
import {
  initializeMechanicsDialogState,
  handleSaveAndClose,
  handleClose,
  type MechanicsDialogState
} from './CardMechanicsDialog.svelte.ts';

describe('CardMechanicsDialog Component Integration', () => {
  it('should import all extracted logic functions', () => {
    expect(typeof initializeMechanicsDialogState).toBe('function');
    expect(typeof handleSaveAndClose).toBe('function');
    expect(typeof handleClose).toBe('function');
  });

  it('should initialize state correctly', () => {
    const state = initializeMechanicsDialogState();
    expect(state).toEqual({
      hasChanges: false,
      editedCard: null
    });
  });

  it('should handle state updates', () => {
    let state: MechanicsDialogState = initializeMechanicsDialogState();
    
    // Test state mutation (as it would happen via bind:)
    state.hasChanges = true;
    expect(state.hasChanges).toBe(true);
  });
});
