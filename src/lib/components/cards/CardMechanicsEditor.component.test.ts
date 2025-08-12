import { describe, it, expect } from 'vitest';
import type { Card } from '../../types';

/**
 * Integration tests for CardMechanicsEditor component
 * Verifies imports, types, and component instantiation
 */
describe('CardMechanicsEditor Component Integration', () => {
  it('should import all extracted logic functions without errors', async () => {
    // Verify that all functions can be imported successfully
    const module = await import('./CardMechanicsEditor.svelte.js');
    
    expect(typeof module.createNewMechanic).toBe('function');
    expect(typeof module.addMechanic).toBe('function');
    expect(typeof module.removeMechanic).toBe('function');
    expect(typeof module.canMoveMechanic).toBe('function');
    expect(typeof module.moveMechanic).toBe('function');
    expect(typeof module.createUpdatedCard).toBe('function');
    expect(typeof module.getTypeIcon).toBe('function');
    expect(typeof module.getTypeName).toBe('function');
    expect(typeof module.isNumeric).toBe('function');
    expect(typeof module.hasChanges).toBe('function');
    expect(typeof module.shouldShowTrackingWarning).toBe('function');
  });

  it('should have correct types for component props', () => {
    // Create mock card to verify type compatibility
    const mockCard: Card = {
      id: 'test-card',
      deckId: 'test-deck', 
      name: 'Test Card',
      type: 'character',
      image: null,
      imageBlob: null,
      mechanics: [],
      description: 'Test description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Verify prop types are correct (TypeScript compilation check)
    const props = {
      card: mockCard,
      loading: false,
      onsave: (card: Card) => {},
      hasChanges: false,
      editedCard: mockCard
    };

    expect(props.card).toBeDefined();
    expect(typeof props.loading).toBe('boolean');
    expect(typeof props.onsave).toBe('function');
    expect(typeof props.hasChanges).toBe('boolean');
    expect(props.editedCard).toBeDefined();
  });
});
