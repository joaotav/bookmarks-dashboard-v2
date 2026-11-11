// PROTOTYPE for #24, #27 and #28. Throwaway: it lives only on the prototype/card-header branch.
// Each question has its own variants, picked with ?icon=, ?chevron= and ?grip= in the URL.

export const QUESTIONS = {
  icon: {
    label: 'Settings icon (#24)',
    variants: { a: 'Sliders (now)', b: 'Gear', c: 'Palette', d: 'Gear with text' },
  },
  chevron: {
    label: 'Chevron (#28)',
    variants: { a: 'Plain v (now)', b: 'Filled triangle', c: 'Right side, round' },
  },
  grip: {
    label: 'Card grip (#27)',
    variants: {
      a: 'In the padding (now)',
      b: 'In the header',
      c: 'Top edge',
      d: 'Right, before ⋯',
      e: 'Drag the header',
    },
  },
} as const;

export type Question = keyof typeof QUESTIONS;

// The user's picks so far: the gear and chevron C. The grip is still open.
const DEFAULTS: Record<Question, string> = { icon: 'b', chevron: 'c', grip: 'e' };

const params = new URLSearchParams(location.search);
const pick = (question: Question) => {
  const value = params.get(question);
  return value && value in QUESTIONS[question].variants ? value : DEFAULTS[question];
};

export const proto = $state({ icon: pick('icon'), chevron: pick('chevron'), grip: pick('grip') });
