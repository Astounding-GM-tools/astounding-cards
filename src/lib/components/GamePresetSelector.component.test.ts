import { describe, it, expect } from 'vitest';

describe('GamePresetSelector Component Integration', () => {
  it('should import all extracted logic functions without errors', async () => {
    // This test verifies that the GamePresetSelector component can import all extracted logic
    const module = await import('./GamePresetSelector.svelte.ts');
    
    // Verify all expected exports are present and are functions
    expect(typeof module.createGamePresetSelectorState).toBe('function');
    expect(typeof module.toggleCustomPresets).toBe('function');
    expect(typeof module.formatTags).toBe('function');
    expect(typeof module.getPresetIcon).toBe('function');
    expect(typeof module.getPresetStatsText).toBe('function');
    
    // Test a quick functionality check
    const initialState = module.createGamePresetSelectorState();
    expect(initialState.showCustom).toBe(false);
    
    const toggledState = module.toggleCustomPresets(initialState);
    expect(toggledState.showCustom).toBe(true);
  });
});
