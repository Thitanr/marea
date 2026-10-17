/* Word prediction + the text-pad helpers shared by keyboard and handwriting.
   All state (word counts) stays in localStorage on this device. */

import type { Lang } from '../types.js';
import { LEXICON, STARTERS } from './lexicon.js';

const COUNTS_KEY = 'marea_word_counts';
const MAX_TRACKED = 400;

export const stripAccents = (s: string): string => s.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

type Counts = Record<string, number>;

function loadCounts(): Counts {
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}');
    return raw && typeof raw === 'object' ? (raw as Counts) : {};
  } catch {
    return {};
  }
}

/** Remember the words the person actually uses so they float to the top. */
export function learnWords(text: string): void {
  const words = text.toLocaleLowerCase().match(/\p{L}+/gu);
  if (!words) return;
  const counts = loadCounts();
  for (const word of words) if (word.length > 1) counts[word] = (counts[word] ?? 0) + 1;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, MAX_TRACKED);
  try { localStorage.setItem(COUNTS_KEY, JSON.stringify(Object.fromEntries(entries))); } catch { /* storage full: prediction just stops learning */ }
}

/** Suggestions for the word being typed (`prefix`), or starters when empty. */
export function suggest(prefix: string, lang: Lang, limit = 4, counts: Counts = loadCounts()): string[] {
  const lex = LEXICON[lang] ?? [];
  const p = stripAccents(prefix);
  if (p === '') return (STARTERS[lang] ?? []).slice(0, limit);

  const rank = new Map<string, number>();
  lex.forEach((word, i) => { if (!rank.has(word)) rank.set(word, i); });
  const pool = new Set<string>(lex);
  for (const word of Object.keys(counts)) pool.add(word);

  const hits = [...pool].filter(word => {
    const n = stripAccents(word);
    return n.startsWith(p) && n !== p;
  });
  hits.sort((a, b) => {
    const ca = counts[a] ?? 0, cb = counts[b] ?? 0;
    if (ca !== cb) return cb - ca;
    return (rank.get(a) ?? 9999) - (rank.get(b) ?? 9999) || a.length - b.length;
  });
  return hits.slice(0, limit);
}

/* ---- Text pad (the <textarea> the board and both input panels write into) ---- */

function fire(ta: HTMLTextAreaElement): void {
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

export function caret(ta: HTMLTextAreaElement): { start: number; end: number } {
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? start;
  return { start, end };
}

export function textBeforeCaret(ta: HTMLTextAreaElement): string {
  return ta.value.slice(0, caret(ta).start);
}

export function insertText(ta: HTMLTextAreaElement, text: string): void {
  const { start, end } = caret(ta);
  ta.setRangeText(text, start, end, 'end');
  fire(ta);
}

/** Delete the selection, or the character before the caret. */
export function backspace(ta: HTMLTextAreaElement): void {
  const { start, end } = caret(ta);
  if (start !== end) {
    ta.setRangeText('', start, end, 'end');
  } else if (start > 0) {
    // Remove a whole code point (emoji/CJK safe) rather than half a surrogate pair
    const before = ta.value.slice(0, start);
    const last = [...before].pop() ?? '';
    ta.setRangeText('', start - last.length, start, 'end');
  }
  fire(ta);
}

/** The letters immediately before the caret (the word being typed). */
export function wordBeforeCaret(ta: HTMLTextAreaElement): string {
  const m = textBeforeCaret(ta).match(/\p{L}+$/u);
  return m ? m[0] : '';
}

/** Replace the word being typed with `word` and add a space. */
export function completeWord(ta: HTMLTextAreaElement, word: string): void {
  const typed = wordBeforeCaret(ta);
  const { start } = caret(ta);
  ta.setRangeText(word + ' ', start - typed.length, start, 'end');
  fire(ta);
}
