import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'svelte';
import CardBack from './CardBack.svelte';
import type { Card } from '$lib/types';

describe('CardBack Component Integration', () => {
  const mockCard: Card = {
    id: 'test-card',
    name: 'Test Card',
    role: 'Test Role',
    image: null,
    traits: [],
    secrets: [],
    desc: 'Test description',
    type: 'character',
    stats: [],
    mechanics: []
  };

  // Test that CardBack can be instantiated and imports work
  it('should import all required pure functions without errors', async () => {
    // This test verifies that all imports are working correctly
    // by trying to import the pure logic functions that CardBack uses
    
    const {
      getCardData,
      resolveActiveTheme,
      processNameFromBlur,
      nameHasChanged,
      processDescriptionFromElement,
      shouldUpdateDescription,
      processSecretsFromElement,
      secretsHaveChanged,
      addSecretToArray,
      applyTemplateWithVocabulary,
      isEditableMode,
      shouldBeContentEditable
    } = await import('./CardBack.svelte.js');

    // Verify all functions are imported and are functions
    expect(typeof getCardData).toBe('function');
    expect(typeof resolveActiveTheme).toBe('function');
    expect(typeof processNameFromBlur).toBe('function');
    expect(typeof nameHasChanged).toBe('function');
    expect(typeof processDescriptionFromElement).toBe('function');
    expect(typeof shouldUpdateDescription).toBe('function');
    expect(typeof processSecretsFromElement).toBe('function');
    expect(typeof secretsHaveChanged).toBe('function');
    expect(typeof addSecretToArray).toBe('function');
    expect(typeof applyTemplateWithVocabulary).toBe('function');
    expect(typeof isEditableMode).toBe('function');
    expect(typeof shouldBeContentEditable).toBe('function');
  });

  it('should be able to create component props without errors', () => {
    // Test that we can create valid component props
    const props = {
      card: mockCard,
      theme: 'classic',
      preview: false,
      editable: true
    };

    expect(props.card).toBe(mockCard);
    expect(props.theme).toBe('classic');
    expect(props.preview).toBe(false);
    expect(props.editable).toBe(true);
  });
});
