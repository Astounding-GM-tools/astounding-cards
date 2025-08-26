/**
 * Drag and Drop Utilities
 * 
 * Reusable functions for implementing drag-and-drop reordering
 * of arrays in Svelte components.
 */

export interface DragState<T = any> {
    draggedIndex: number | null;
    draggedItem: T | null;
    isDragging: boolean;
}

/**
 * Create a drag state manager for array reordering
 */
export function createDragState<T>(): {
    state: DragState<T>;
    startDrag: (index: number, item: T) => void;
    endDrag: () => void;
    reorderArray: (array: T[], sourceIndex: number, targetIndex: number) => T[];
} {
    let state: DragState<T> = $state({
        draggedIndex: null,
        draggedItem: null,
        isDragging: false
    });

    function startDrag(index: number, item: T) {
        state.draggedIndex = index;
        state.draggedItem = item;
        state.isDragging = true;
    }

    function endDrag() {
        state.draggedIndex = null;
        state.draggedItem = null;
        state.isDragging = false;
    }

    function reorderArray(array: T[], sourceIndex: number, targetIndex: number): T[] {
        if (sourceIndex === targetIndex) return array;
        
        const newArray = [...array];
        const [removed] = newArray.splice(sourceIndex, 1);
        newArray.splice(targetIndex, 0, removed);
        return newArray;
    }

    return {
        state,
        startDrag,
        endDrag,
        reorderArray
    };
}

/**
 * Standard drag event handlers
 */
export function createDragHandlers<T>(
    dragState: ReturnType<typeof createDragState<T>>,
    onReorder: (newArray: T[]) => void,
    getCurrentArray: () => T[]
) {
    function handleDragStart(e: DragEvent, index: number) {
        const array = getCurrentArray();
        const item = array[index];
        
        dragState.startDrag(index, item);
        
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
        
        // Add visual feedback
        const target = e.target as HTMLElement;
        target.style.opacity = '0.6';
        target.classList.add('dragging');
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDrop(e: DragEvent, targetIndex: number) {
        e.preventDefault();
        
        const { draggedIndex } = dragState.state;
        
        if (draggedIndex === null || draggedIndex === targetIndex) {
            resetDragStyles();
            dragState.endDrag();
            return;
        }
        
        const currentArray = getCurrentArray();
        const newArray = dragState.reorderArray(currentArray, draggedIndex, targetIndex);
        onReorder(newArray);
        
        resetDragStyles();
        dragState.endDrag();
    }

    function handleDragEnd() {
        resetDragStyles();
        dragState.endDrag();
    }

    function resetDragStyles() {
        // Reset all dragging visual effects
        const draggingElements = document.querySelectorAll('.dragging');
        draggingElements.forEach(element => {
            (element as HTMLElement).style.opacity = '';
            element.classList.remove('dragging');
        });
    }

    return {
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        resetDragStyles
    };
}

/**
 * CSS classes for drag and drop styling
 */
export const DRAG_CLASSES = {
    draggable: 'draggable-item',
    dragging: 'dragging',
    dropTarget: 'drop-target',
    handle: 'drag-handle'
} as const;
