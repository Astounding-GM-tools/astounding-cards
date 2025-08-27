<script lang="ts" generics="T extends string">
    interface Option<T> {
        value: T;
        label: string;
        description?: string;
    }
    
    interface Props<T extends string> {
        options: Option<T>[];
        currentValue: T;
        onValueChange: (value: T) => void;
        disabled?: boolean;
        name?: string;
        size?: 'sm' | 'md';
    }
    
    let { 
        options, 
        currentValue, 
        onValueChange, 
        disabled = false,
        name = 'radio-toggle',
        size = 'sm'
    }: Props<T> = $props();
    
    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newValue = target.value as T;
        onValueChange(newValue);
    }
</script>

<div class="radio-toggle" class:disabled class:size-sm={size === 'sm'} class:size-md={size === 'md'}>
    {#each options as option (option.value)}
        <label class="radio-option" title={option.description}>
            <input 
                type="radio" 
                {name}
                value={option.value} 
                checked={currentValue === option.value}
                onchange={handleChange}
                {disabled}
            />
            <span class="radio-label">
                <span class="toggle-symbol">
                    {#if currentValue === option.value}◎{:else}○{/if}
                </span>
                {option.label}
            </span>
        </label>
    {/each}
</div>

<style>
    .radio-toggle {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .radio-toggle.size-sm {
        font-size: 0.875rem;
        gap: 0.75rem;
    }
    
    .radio-toggle.size-md {
        font-size: 1rem;
        gap: 1rem;
    }
    
    .radio-toggle.disabled {
        opacity: 0.6;
        pointer-events: none;
    }
    
    .radio-option {
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 0.25rem;
        transition: all 0.2s;
    }
    
    .radio-option:hover {
        transform: translateY(-1px);
    }
    
    .radio-option input[type="radio"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .radio-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--ui-muted, #64748b);
        transition: all 0.2s;
        padding: 0.125rem 0.25rem;
        border-radius: 4px;
    }
    
    .radio-option:hover .radio-label {
        color: var(--ui-text, #1a202c);
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .radio-option input[type="radio"]:checked + .radio-label {
        color: var(--ui-text, #1a202c);
        font-weight: 500;
        background: var(--ui-selected-bg, #eff6ff);
    }
    
    .toggle-symbol {
        font-size: 1em;
        color: var(--ui-muted, #64748b);
        transition: all 0.2s ease;
        flex-shrink: 0;
        min-width: 1.2em;
        text-align: center;
    }
    
    .radio-option input[type="radio"]:checked + .radio-label .toggle-symbol {
        color: var(--button-primary-bg, #3b82f6);
        transform: scale(1.1);
    }
    
    .radio-option:hover .radio-label .toggle-symbol {
        color: var(--ui-text, #1a202c);
    }
    
    /* Focus styles for accessibility */
    .radio-option input[type="radio"]:focus + .radio-label {
        outline: 2px solid var(--focus-ring, #3b82f6);
        outline-offset: 2px;
    }
</style>
