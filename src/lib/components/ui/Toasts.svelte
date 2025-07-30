<script lang="ts">
  import { toasts, type Toast } from '$lib/stores/toast';
  import { fly } from 'svelte/transition';

  function handleKeydown(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === 'Space') {
      toasts.remove(id);
    }
  }
</script>

<div class="toast-container" role="status" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <button
      class="toast {toast.type}"
      transition:fly={{ x: 100, duration: 300 }}
      on:click={() => toasts.remove(toast.id)}
      on:keydown={(e) => handleKeydown(e, toast.id)}
      type="button"
    >
      <div class="toast-content">
        {toast.message}
      </div>
    </button>
  {/each}
</div>

