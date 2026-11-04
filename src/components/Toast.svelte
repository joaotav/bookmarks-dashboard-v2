<script lang="ts">
  import { onMount } from 'svelte';

  let {
    message,
    onundo,
    ondismiss,
  }: {
    message: string;
    /** Without it, the toast only shows the message. */
    onundo?: () => void;
    ondismiss: () => void;
  } = $props();

  const DURATION = 8000;

  onMount(() => {
    const timer = setTimeout(ondismiss, DURATION);
    return () => clearTimeout(timer);
  });
</script>

<div class="toast" role="status">
  <span class="message">{message}</span>
  {#if onundo}
    <button onclick={onundo}>Undo</button>
  {/if}
</div>

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: calc(100vw - 32px);
    padding: 10px 10px 10px 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    box-shadow: 0 12px 32px #0006;
    transform: translateX(-50%);
  }
  .message {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  button {
    flex: none;
    height: 28px;
    padding: 0 12px;
    border-radius: 6px;
    color: var(--accent);
    font-weight: 600;
  }
  button:hover {
    background: var(--row-hover);
  }
</style>
