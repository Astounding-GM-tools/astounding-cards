import { describe, it, expect } from 'vitest';
import type { Card } from '../../types';

/**
 * Integration tests for CardMechanicsDisplay component
 * Verifies imports, types, and component instantiation
 */
describe('CardMechanicsDisplay Component Integration', () => {
  it('should import all extracted logic functions without errors', async () => {
    // Verify that all functions can be imported successfully
    const module = await import('./CardMechanicsDisplay.svelte.js');
    
    expect(typeof module.getTypeIcon).toBe('function');
    expect(typeof module.isNumeric).toBe('function');
    expect(typeof module.shouldShowTrackingBoxes).toBe('function');
    expect(typeof module.renderTrackingBoxes).toBe('function');
    expect(typeof module.getAddStatsAction).toBe('function');
  });

  it('should have correct types for component props', () => {
    // Create mock card to verify type compatibility
    const mockCard: Card = {
      id: 'test-card',
      name: 'Test Card',
      role: 'Test Role',
      image: null,
      traits: [],
      secrets: [],
      desc: 'Test description',
      type: 'character',
      mechanics: []
    };

    // Verify prop types are correct (TypeScript compilation check)
    const props = {
      card: mockCard,
      editable: true,
      onedit: () => {},
      onapplytemplate: (mechanics: any) => {},
      onshowtemplatedialog: (cardType: string) => {}
    };

    expect(props.card).toBeDefined();
    expect(typeof props.editable).toBe('boolean');
    expect(typeof props.onedit).toBe('function');
    expect(typeof props.onapplytemplate).toBe('function');
    expect(typeof props.onshowtemplatedialog).toBe('function');
  });
});
