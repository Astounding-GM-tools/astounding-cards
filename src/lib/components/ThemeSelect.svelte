<script lang="ts">
  import type { CardTheme } from '$lib/themes';
  import { baseThemes } from '$lib/themes';
  import CardFront from './CardFront.svelte';

  const props = $props();
  const selectedTheme = props.selectedTheme ?? 'classic';
  const onSelect = props.onSelect as (themeId: string) => void;

  const themes = Object.values(baseThemes);

  function createPreviewCard(theme: CardTheme) {
    return {
      id: 'preview',  // Required by Card type
      name: theme.preview?.title || theme.name,
      role: theme.preview?.role || theme.description,
      traits: theme.preview?.traits || [],
      image: theme.preview?.portrait || null,
      stat: {
        type: 'character' as const,
        value: 'Preview'
      },
      desc: '',  // Required by type but not used in preview
      secrets: [],  // Required by type but not used in preview
      type: 'Preview'  // Required by Card type
    };
  }
</script>

<div class="theme-select">
  <div class="theme-grid">
    {#each themes as theme}
      <button
        class="theme-option"
        class:selected={selectedTheme === theme.id}
        onclick={() => onSelect(theme.id)}
      >
        <div class="preview-wrapper">
          <CardFront
            card={createPreviewCard(theme)}
            theme={theme.id}
            preview={true}
          />
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .theme-select {
    padding: 1rem;
    background: var(--ui-bg);
    border-radius: var(--content-box-radius);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .theme-option {
    position: relative;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.2s;
    width: 100%;
    aspect-ratio: 2.5 / 3.5;
  }

  .theme-option:hover {
    transform: translateY(-2px);
  }

  .theme-option.selected {
    outline: 2px solid var(--theme-primary);
    outline-offset: 2px;
  }

  .preview-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .preview-wrapper :global(.card) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style> 