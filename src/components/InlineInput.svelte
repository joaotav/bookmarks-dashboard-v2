<script lang="ts">
  import { untrack } from 'svelte';

  let {
    value,
    label,
    placeholder,
    allowEmpty = false,
    onsave,
    oncancel,
  }: {
    value: string;
    /** Accessible name of the text field, like "Category name". */
    label: string;
    placeholder?: string;
    /** Saves an empty field instead of cancelling, for fields that have a default. */
    allowEmpty?: boolean;
    /** Receives the trimmed text. Returning a message keeps the field open and shows it. */
    onsave: (text: string) => string | void;
    oncancel: () => void;
  } = $props();

  let text = $state(untrack(() => value));
  let message = $state<string | null>(null);
  // Set once saved or cancelled, so the blur that follows doesn't act a second time.
  let done = false;

  const focusAndSelect = (input: HTMLInputElement) => {
    input.focus();
    input.select();
  };

  function finish(fromBlur: boolean) {
    if (done) return;
    const trimmed = text.trim();
    if ((!trimmed && !allowEmpty) || trimmed === value) return cancel();
    const error = onsave(trimmed);
    if (!error) {
      done = true;
    } else if (fromBlur) {
      // Leaving the field with something invalid in it drops the edit.
      cancel();
    } else {
      message = error;
    }
  }

  function cancel() {
    done = true;
    oncancel();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(false);
    } else if (event.key === 'Escape') {
      // Keeps the Escape from also closing a panel or menu around this field.
      event.stopPropagation();
      cancel();
    }
  }
</script>

<span class="inline">
  <input
    bind:value={text}
    aria-label={label}
    {placeholder}
    aria-invalid={message !== null}
    {@attach focusAndSelect}
    {onkeydown}
    onblur={() => finish(true)}
    oninput={() => (message = null)}
  />
  {#if message}<span class="message" role="alert">{message}</span>{/if}
</span>

<style>
  .inline {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  input {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--accent);
    border-radius: 6px;
    outline: none;
    background: var(--bg);
    color: var(--fg);
    font: inherit;
  }
  .message {
    color: var(--danger);
    font-size: 11px;
    font-weight: 400;
  }
</style>
