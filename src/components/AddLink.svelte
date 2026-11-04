<script lang="ts">
  import { toWebUrl } from '@/lib/tree';

  let { onadd }: { onadd: (url: string, title: string) => void } = $props();

  let open = $state(false);
  let url = $state('');
  let title = $state('');
  let message = $state<string | null>(null);

  const focus = (input: HTMLInputElement) => input.focus();

  function close() {
    open = false;
    url = title = '';
    message = null;
  }

  function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    const webUrl = toWebUrl(url);
    if (!webUrl) {
      message = 'Enter a web address, like example.com';
      return;
    }
    onadd(webUrl, title.trim());
    close();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }
</script>

{#if open}
  <!-- The listener catches Escape from the fields inside, which are interactive. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form {onsubmit} {onkeydown}>
    <input
      bind:value={url}
      aria-label="URL"
      placeholder="URL"
      aria-invalid={message !== null}
      oninput={() => (message = null)}
      {@attach focus}
    />
    <input bind:value={title} aria-label="Title" placeholder="Title (optional)" />
    {#if message}<p class="message" role="alert">{message}</p>{/if}
    <div class="buttons">
      <button type="button" onclick={close}>Cancel</button>
      <button type="submit" class="primary">Add</button>
    </div>
  </form>
{:else}
  <button class="add" onclick={() => (open = true)}>+ Add bookmark</button>
{/if}

<style>
  .add {
    width: 100%;
    height: var(--row-height);
    padding: 0 8px;
    border-radius: 6px;
    color: var(--muted);
    text-align: left;
  }
  .add:hover {
    background: var(--row);
    color: var(--fg);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  input {
    width: 100%;
    height: 30px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    outline: none;
    background: var(--bg);
    color: var(--fg);
    font: inherit;
  }
  input:focus {
    border-color: var(--accent);
  }
  .message {
    margin: 0;
    color: var(--danger);
    font-size: 11px;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  .buttons button {
    height: 28px;
    padding: 0 12px;
    border-radius: 6px;
    color: var(--muted);
  }
  .buttons button:hover {
    background: var(--row-hover);
    color: var(--fg);
  }
  .buttons .primary {
    background: var(--accent);
    color: var(--bg);
    font-weight: 600;
  }
  .buttons .primary:hover {
    background: var(--accent);
    color: var(--bg);
    filter: brightness(1.1);
  }
</style>
