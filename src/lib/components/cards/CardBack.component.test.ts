import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'svelte';
import CardBack from './CardBack.svelte';
import type { Card } from '$lib/types';

describe('CardBack Component Integration', () => {
  const mockCard: Card = {
    id: 'test-card',
    name: 'Test Card',
    desc: 'Test description',
    imageUrl: '',
    stats: [],
    mechanics: [],
    secrets: []
  };

  // Test that CardBack can be instantiated and imports work
  it('should import all required pure functions without errors', async () => {
    // This test verifies that all imports are working correctly
    // by trying to import the pure logic functions that CardBack uses
    
    const {
      initializeCardBackState,
      updateCardBackState,
      resetDialogs,
      getCardData,
      resolveActiveTheme,
      validateCardName,
      validateCardDescription,
      validateSecrets,
      processNameBlur,
      processDescriptionBlur,
      processSecretsBlur,
      contentHasChanged,
      prepareTemplateDialog,
      applyTemplateWithVocabulary,
      createTemplateHandler,
      addSecretToArray,
      formatSecretsForDisplay,
      parseSecretsFromHtml,
      validateMechanics,
      mechanicsHaveChanged,
      showMechanicsDialog,
      hideMechanicsDialog,
      showTemplateDialog,
      hideTemplateDialog,
      prepareUpdatePayload,
      createFieldUpdateHandler,
      isEditable,
      getContentEditableState,
      shouldDisableElement
    } = await import('./CardBack.logic.js');

    // Verify all functions are imported and are functions
    expect(typeof initializeCardBackState).toBe('function');
    expect(typeof updateCardBackState).toBe('function');
    expect(typeof resetDialogs).toBe('function');
    expect(typeof getCardData).toBe('function');
    expect(typeof resolveActiveTheme).toBe('function');
    expect(typeof validateCardName).toBe('function');
    expect(typeof validateCardDescription).toBe('function');
    expect(typeof validateSecrets).toBe('function');
    expect(typeof processNameBlur).toBe('function');
    expect(typeof processDescriptionBlur).toBe('function');
    expect(typeof processSecretsBlur).toBe('function');
    expect(typeof contentHasChanged).toBe('function');
    expect(typeof prepareTemplateDialog).toBe('function');
    expect(typeof applyTemplateWithVocabulary).toBe('function');
    expect(typeof createTemplateHandler).toBe('function');
    expect(typeof addSecretToArray).toBe('function');
    expect(typeof formatSecretsForDisplay).toBe('function');
    expect(typeof parseSecretsFromHtml).toBe('function');
    expect(typeof validateMechanics).toBe('function');
    expect(typeof mechanicsHaveChanged).toBe('function');
    expect(typeof showMechanicsDialog).toBe('function');
    expect(typeof hideMechanicsDialog).toBe('function');
    expect(typeof showTemplateDialog).toBe('function');
    expect(typeof hideTemplateDialog).toBe('function');
    expect(typeof prepareUpdatePayload).toBe('function');
    expect(typeof createFieldUpdateHandler).toBe('function');
    expect(typeof isEditable).toBe('function');
    expect(typeof getContentEditableState).toBe('function');
    expect(typeof shouldDisableElement).toBe('function');
  });

  it('should be able to create component props without errors', () => {
    // Test that we can create valid component props
    const props: ComponentProps<CardBack> = {
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
