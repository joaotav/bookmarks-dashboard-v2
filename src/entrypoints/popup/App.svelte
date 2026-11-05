<script lang="ts">
  import { onMount } from 'svelte';
  import SaveForm from '@/components/SaveForm.svelte';
  import { getWorkspace } from '@/lib/bookmarks';
  import { getLastCategoryId } from '@/lib/meta';
  import { currentPage, savePage, type Page } from '@/lib/save';
  import { getSettings } from '@/lib/settings';
  import { placeName, toSpaces, toWebUrl, type Space } from '@/lib/tree';

  // How long "Saved to …" shows before the popup closes.
  const CLOSE_AFTER_MS = 1000;

  let loaded = $state<{ page: Page | null; spaces: Space[]; lastCategoryId?: string } | null>(null);
  let saved = $state<string | null>(null);
  let error = $state<string | null>(null);

  const hasCategories = $derived(loaded?.spaces.some((space) => space.categories.length > 0));

  onMount(async () => {
    try {
      const [page, workspace, lastCategoryId, settings] = await Promise.all([
        currentPage(),
        getWorkspace(),
        getLastCategoryId(),
        getSettings(),
      ]);
      Object.assign(document.documentElement.dataset, settings);
      loaded = { page, spaces: toSpaces(workspace), lastCategoryId };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  });

  async function save(categoryId: string, url: string, title: string) {
    const { page, spaces } = loaded!;
    // The tab's icon only belongs to pages on the same site.
    const sameSite = new URL(url).hostname === new URL(page!.url).hostname;
    try {
      await savePage(categoryId, { url, title, ...(sameSite && page!.favIconUrl && { favIconUrl: page!.favIconUrl }) });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      return;
    }
    const space = spaces.find((space) => space.categories.some((category) => category.id === categoryId))!;
    saved = placeName(space, space.categories.find((category) => category.id === categoryId));
    setTimeout(() => window.close(), CLOSE_AFTER_MS);
  }
</script>

<main>
  <h1>Save to workspace</h1>
  {#if error}
    <p class="notice">Couldn't save: {error}</p>
  {:else if saved}
    <p class="saved" role="status"><span aria-hidden="true">✓</span> Saved to {saved}</p>
  {:else if !loaded}
    <!-- Still loading. -->
  {:else if !loaded.page || !toWebUrl(loaded.page.url)}
    <p class="notice">Only web pages can be saved.</p>
  {:else if !hasCategories}
    <p class="notice">Create a category on the new tab page first, then save pages into it.</p>
  {:else}
    <SaveForm
      url={loaded.page.url}
      title={loaded.page.title}
      spaces={loaded.spaces}
      categoryId={loaded.lastCategoryId}
      onsave={save}
      oncancel={() => window.close()}
    />
  {/if}
</main>

<style>
  main {
    width: 320px;
    padding: 14px 16px 16px;
  }
  h1 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
  }
  .notice {
    margin: 0;
    color: var(--muted);
  }
  .saved {
    margin: 0;
    padding: 12px 0;
    font-weight: 600;
  }
  .saved span {
    color: var(--accent);
  }
</style>
