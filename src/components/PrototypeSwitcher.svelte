<script lang="ts">
  // PROTOTYPE for #24, #27 and #28. Throwaway: it lives only on the prototype/card-header branch.
  import { proto, QUESTIONS, type Question } from '@/lib/prototype.svelte';

  const questions = Object.keys(QUESTIONS) as Question[];
  let current = $state<Question>('grip');

  function cycle(question: Question, by: number) {
    const keys = Object.keys(QUESTIONS[question].variants);
    proto[question] = keys[(keys.indexOf(proto[question]) + by + keys.length) % keys.length]!;
    current = question;
  }

  // Keeps the choice in the URL, so a reload shows the same thing.
  $effect(() => {
    const url = new URL(location.href);
    for (const question of questions) url.searchParams.set(question, proto[question]);
    history.replaceState(null, '', url);
  });

  // Left and right cycle the highlighted question, up and down pick another one. Only while
  // nothing has focus, since tabs, menus and keyboard dragging use the arrow keys too.
  function onkeydown(event: KeyboardEvent) {
    if (event.target !== document.body) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') cycle(current, event.key === 'ArrowLeft' ? -1 : 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const by = event.key === 'ArrowUp' ? -1 : 1;
      current = questions[(questions.indexOf(current) + by + questions.length) % questions.length]!;
    } else return;
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<div class="switcher">
  <span class="tag">Prototype</span>
  {#each questions as question (question)}
    {@const variants = QUESTIONS[question].variants as Record<string, string>}
    <div class="question" class:current={question === current}>
      <span class="label">{QUESTIONS[question].label}</span>
      <button aria-label="Previous" onclick={() => cycle(question, -1)}>‹</button>
      <span class="value">{proto[question].toUpperCase()} · {variants[proto[question]]}</span>
      <button aria-label="Next" onclick={() => cycle(question, 1)}>›</button>
    </div>
  {/each}
</div>

<style>
  .switcher {
    position: fixed;
    bottom: 16px;
    left: 50%;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 2px solid #ffd60a;
    border-radius: 999px;
    background: #000;
    color: #fff;
    font: 12px/1.2 system-ui, sans-serif;
    box-shadow: 0 8px 24px #000a;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .tag {
    padding: 2px 8px;
    border-radius: 999px;
    background: #ffd60a;
    color: #000;
    font-weight: 700;
  }
  .question {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
  }
  .current {
    background: #333;
  }
  .label {
    color: #aaa;
  }
  .value {
    min-width: 130px;
    text-align: center;
    font-weight: 600;
  }
  button {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: #fff;
    font-size: 16px;
    line-height: 1;
  }
  button:hover {
    background: #555;
  }
</style>
