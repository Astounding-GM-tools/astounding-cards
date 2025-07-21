<script lang="ts">
  import { toasts, type Toast } from '$lib/stores/toast';
  import { fly } from 'svelte/transition';
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div
      class="toast {toast.type}"
      transition:fly={{ x: 100, duration: 300 }}
      on:click={() => toasts.remove(toast.id)}
    >
      <div class="toast-content">
        {toast.message}
      </div>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: var(--content-gap);
    right: var(--content-gap);
    display: flex;
    flex-direction: column;
    gap: var(--content-gap);
    z-index: 1000;
    pointer-events: none;
  }

  .toast {
    padding: calc(var(--content-gap) * 1.5) var(--content-gap);
    border-radius: 4px;
    box-shadow: var(--dialog-shadow);
    min-width: 200px;
    max-width: 400px;
    pointer-events: auto;
    cursor: pointer;
    font-size: var(--ui-font-size);
    background: var(--toast-bg);
    color: var(--toast-text);
    border: 1px solid var(--ui-border);
    opacity: 0.95;
    transition: opacity 0.2s;
  }

  .toast:hover {
    opacity: 1;
  }

  .success {
    background: var(--toast-success);
    color: white;
    border: none;
  }

  .info {
    background: var(--toast-info);
    color: white;
    border: none;
  }

  .warning {
    background: var(--toast-warning);
    color: white;
    border: none;
  }

  .error {
    background: var(--toast-error);
    color: white;
    border: none;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: var(--content-gap);
  }

  @media print {
    .toast-container {
      display: none;
    }
  }
</style> 