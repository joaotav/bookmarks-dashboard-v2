import '@testing-library/jest-dom/vitest';

// jsdom leaves out some browser APIs the components use. These stand-ins do the minimum.

// Svelte transitions run on the Web Animations API. Here every animation finishes right away.
Element.prototype.animate ??= function () {
  const animation = { currentTime: 0, playState: 'finished', onfinish: null as (() => void) | null, cancel() {} };
  setTimeout(() => animation.onfinish?.());
  return animation as unknown as Animation;
};

// SpaceTabs remeasures once web fonts have loaded. There are none to wait for.
if (!document.fonts) Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve() } });

// The search results scroll the selected one into view. Nothing scrolls here.
Element.prototype.scrollIntoView ??= function () {};
