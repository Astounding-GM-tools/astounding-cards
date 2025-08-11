import { describe, it, expect, vi } from 'vitest';
import type { Card } from '$lib/types';

describe('CardStatsEditor Component Integration', () => {

  it('should import all required pure functions without errors', async () => {
    // This test verifies that all imports from CardStatsEditor.svelte.js work
    const moduleImports = await import('./CardStatsEditor.svelte.js');
    
    expect(moduleImports.initializeStatsEditorState).toBeTypeOf('function');
    expect(moduleImports.initializeDragState).toBeTypeOf('function');
    expect(moduleImports.resetStatsEditorState).toBeTypeOf('function');
    expect(moduleImports.updateStatsEditorState).toBeTypeOf('function');
    expect(moduleImports.validateStatForm).toBeTypeOf('function');
    expect(moduleImports.addStatToArray).toBeTypeOf('function');
    expect(moduleImports.removeStatFromArray).toBeTypeOf('function');
    expect(moduleImports.updateStatInArray).toBeTypeOf('function');
    expect(moduleImports.reorderStats).toBeTypeOf('function');
    expect(moduleImports.startDrag).toBeTypeOf('function');
    expect(moduleImports.dragOver).toBeTypeOf('function');
    expect(moduleImports.clearDragOver).toBeTypeOf('function');
    expect(moduleImports.endDrag).toBeTypeOf('function');
    expect(moduleImports.handleDrop).toBeTypeOf('function');
    expect(moduleImports.getAvailableStats).toBeTypeOf('function');
    expect(moduleImports.findStatDefinition).toBeTypeOf('function');
    expect(moduleImports.getStatLabel).toBeTypeOf('function');
    expect(moduleImports.getStatIcon).toBeTypeOf('function');
    expect(moduleImports.groupStatsByCategory).toBeTypeOf('function');
    expect(moduleImports.statsChanged).toBeTypeOf('function');
  });

  it('should initialize pure functions correctly', async () => {
    const { initializeStatsEditorState, initializeDragState } = await import('./CardStatsEditor.svelte.js');
    
    const editorState = initializeStatsEditorState();
    expect(editorState.editingStats).toEqual([]);
    expect(editorState.selectedStatId).toBe('');
    expect(editorState.showAddStat).toBe(false);
    
    const dragState = initializeDragState();
    expect(dragState.draggedIndex).toBe(null);
    expect(dragState.dragOverIndex).toBe(null);
  });
});
