<script lang="ts">
    interface Props {
        checked: boolean;
        onToggle: (checked: boolean) => void;
        trueLabel: string;   // Label shown when checked (e.g., "🀜 Tarot")
        falseLabel: string;  // Label shown when unchecked (e.g., "🀡 Poker") 
        disabled?: boolean;
        name?: string;
        size?: 'sm' | 'md';
    }
    
    let { 
        checked, 
        onToggle, 
        trueLabel, 
        falseLabel, 
        disabled = false,
        name = 'binary-toggle',
        size = 'sm' 
    }: Props = $props();
    
    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        onToggle(target.checked);
    }
</script>

<label class="binary-toggle" class:disabled class:size-sm={size === 'sm'} class:size-md={size === 'md'}>
    <input 
        type="checkbox" 
        {name}
        {checked}
        onchange={handleChange}
        {disabled}
    />
    <span class="toggle-label">
        {checked ? trueLabel : falseLabel}
    </span>
</label>

<style>
    .binary-toggle {
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 0.25rem;
        transition: all 0.2s;
        padding: 0.125rem 0.25rem;
        border-radius: 4px;
        user-select: none;
    }
    
    .binary-toggle.size-sm {
        font-size: 0.875rem;
    }
    
    .binary-toggle.size-md {
        font-size: 1rem;
    }
    
    .binary-toggle.disabled {
        opacity: 0.6;
        pointer-events: none;
        cursor: not-allowed;
    }
    
    .binary-toggle:hover:not(.disabled) {
        background: var(--ui-hover-bg, #f8fafc);
        transform: translateY(-1px);
    }
    
    .binary-toggle input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .toggle-label {
        color: var(--ui-muted, #64748b);
        transition: all 0.2s;
        font-weight: 500;
        white-space: nowrap;
    }
    
    .binary-toggle input[type="checkbox"]:checked + .toggle-label {
        color: var(--button-primary-bg, #3b82f6);
    }
    
    .binary-toggle:hover:not(.disabled) .toggle-label {
        color: var(--ui-text, #1a202c);
    }
    
    .binary-toggle input[type="checkbox"]:checked:hover + .toggle-label {
        color: var(--button-primary-hover-bg, #2563eb);
    }
    
    /* Focus styles for accessibility */
    .binary-toggle input[type="checkbox"]:focus + .toggle-label {
        outline: 2px solid var(--focus-ring, #3b82f6);
        outline-offset: 2px;
        border-radius: 2px;
    }
</style>
