<script lang="ts">
  import InlineInput from './InlineInput.svelte';

  let { oncreate }: { oncreate: (title: string) => void } = $props();

  let editing = $state(false);
</script>

<div class="new-category">
  {#if editing}
    <InlineInput
      value=""
      label="Category name"
      onsave={(title) => {
        oncreate(title);
        editing = false;
      }}
      oncancel={() => (editing = false)}
    />
  {:else}
    <button onclick={() => (editing = true)}>+ New category</button>
  {/if}
</div>

<style>
  .new-category {
    display: flex;
    width: var(--card-width);
    padding: var(--card-padding);
    border: 1px dashed var(--border);
    border-radius: 10px;
  }
  button {
    width: 100%;
    padding: 2px 4px;
    color: var(--muted);
    font-weight: 600;
    text-align: left;
  }
  button:hover {
    color: var(--fg);
  }
</style>
