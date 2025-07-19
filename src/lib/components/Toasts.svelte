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
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
    pointer-events: none;
  }

  .toast {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    max-width: 400px;
    pointer-events: auto;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .success {
    background: #4caf50;
    color: white;
  }

  .info {
    background: #2196f3;
    color: white;
  }

  .warning {
    background: #ff9800;
    color: white;
  }

  .error {
    background: #f44336;
    color: white;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style> 