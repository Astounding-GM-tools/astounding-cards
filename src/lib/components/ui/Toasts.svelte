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
      transition:fly={TOAST_ANIMATION}
      on:click={createRemoveHandler(toasts.remove, toast.id)}
      on:keydown={(e) => handleToastKeydown(e, createRemoveHandler(toasts.remove, toast.id))}
      type="button"
    >
      <div class="toast-content">
        {toast.message}
      </div>
    </button>
  {/each}
</div>

