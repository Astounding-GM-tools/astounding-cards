<script lang="ts">
  import { toasts, type Toast } from '$lib/stores/toast';
  import { fly } from 'svelte/transition';
  import {
    handleToastKeydown,
    createRemoveHandler,
    TOAST_ANIMATION
  } from './Toasts.svelte.ts';
</script>

<div class="toast-container" role="status" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <button
      class="toast {toast.type}"
      class:dismissible={toast.dismissible !== false}
      transition:fly={TOAST_ANIMATION}
      on:click={toast.dismissible !== false ? createRemoveHandler(toasts.remove, toast.id) : undefined}
      on:keydown={toast.dismissible !== false ? (e) => handleToastKeydown(e, createRemoveHandler(toasts.remove, toast.id)) : undefined}
      type="button"
      disabled={toast.dismissible === false}
    >
      <div class="toast-content">
        {#if toast.type === 'loading'}
          <div class="spinner" aria-label="Loading" role="status"></div>
        {/if}
        {toast.message}
      </div>
    </button>
  {/each}
</div>

<style>
  .toast.loading {
    background: var(--toast-info);
    color: white;
    cursor: default;
  }
  
  .toast.loading:hover {
    opacity: 0.95; /* Less opacity change for non-dismissible */
  }
  
  .toast:not(.dismissible) {
    cursor: default;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: toast-spinner-spin 1s linear infinite;
    flex-shrink: 0;
  }
  
  @keyframes toast-spinner-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>

