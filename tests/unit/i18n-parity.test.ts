/* ==========================================================================
   i18n integrity — world-class guard.
   1. Every language block exposes exactly the same keys (no missing, no extra).
   2. No empty values.
   3. Every data-i18n / data-i18n-aria / data-i18n-placeholder key used in
      index.html exists in the dictionary.
   4. CJK languages actually contain CJK text (catches copy-paste of Spanish
      into the zh/ja blocks); non-CJK languages contain no CJK.
   5. AAC board: one flat board, identical ids/order/icons in all languages.
   ========================================================================== */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { i18n } from '../../src/data/i18n-dict.js';
import { aacBoardData } from '../../src/data/aac-board.js';
import { svgIcons } from '../../src/data/svg-icons.js';

const LANGS = ['es', 'en', 'it', 'fr', 'de', 'zh', 'pt', 'ja'] as const;
const dict = i18n as Record<string, Record<string, string>>;
const board = aacBoardData as unknown as Record<string, Array<{ id: string; kind: string; text: string; spoken: string; icon: string }>>;

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('i18n dictionary parity', () => {
  it('contains all 8 languages', () => {
    for (const lang of LANGS) expect(dict[lang], `missing language block: ${lang}`).toBeDefined();
  });

  it('every language has exactly the same keys as Spanish (reference)', () => {
    const es = dict.es!;
    const ref = Object.keys(es).sort();
    for (const lang of LANGS) {
      if (lang === 'es') continue;
      const block = dict[lang]!;
      const keys = new Set(Object.keys(block));
      const missing = ref.filter(k => !keys.has(k));
      const extra = Object.keys(block).filter(k => !(k in es));
      expect(missing, `${lang} is missing keys`).toEqual([]);
      expect(extra, `${lang} has keys not present in es`).toEqual([]);
    }
  });

  it('has no empty or whitespace-only values', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(dict[lang]!)) {
        expect(value.trim(), `${lang}.${key} is empty`).not.toBe('');
      }
    }
  });

  it('every i18n key referenced in index.html exists in the dictionary', () => {
    const html = readFileSync(join(rootDir, 'index.html'), 'utf-8');
    const used = new Set<string>();
    for (const m of html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g)) {
      used.add(m[1]!);
    }
    const missing = [...used].filter(k => !(k in dict.es!));
    expect(missing, 'keys used in index.html but absent from dictionary').toEqual([]);
  });

  it('CJK languages contain CJK text; latin languages do not leak CJK', () => {
    const cjk = /[぀-ヿ㐀-鿿]/;
    for (const [key, value] of Object.entries(dict.zh!)) {
      // Values that are pure symbols/numbers (e.g. "✕") are exempt
      if (/[a-zA-ZÀ-ɏ]{4,}/.test(value) && !cjk.test(value)) {
        expect.fail(`zh.${key} looks non-Chinese: "${value}"`);
      }
    }
    for (const [key, value] of Object.entries(dict.ja!)) {
      if (/[a-zA-ZÀ-ɏ]{4,}/.test(value) && !cjk.test(value)) {
        expect.fail(`ja.${key} looks non-Japanese: "${value}"`);
      }
    }
    for (const lang of ['en', 'it', 'fr', 'de', 'pt'] as const) {
      for (const [key, value] of Object.entries(dict[lang]!)) {
        expect(cjk.test(value), `${lang}.${key} contains CJK text: "${value}"`).toBe(false);
      }
    }
  });
});

describe('AAC board (single prioritised board)', () => {
  const es = board.es!;

  it('every language has the same cards, in the same fixed order (positions never change)', () => {
    const refIds = es.map(c => c.id);
    for (const lang of LANGS) {
      expect(board[lang]!.map(c => c.id), `${lang} order/ids differ from es`).toEqual(refIds);
      expect(board[lang]!.map(c => c.kind), `${lang} kinds differ`).toEqual(es.map(c => c.kind));
      expect(board[lang]!.map(c => c.icon), `${lang} icons differ`).toEqual(es.map(c => c.icon));
    }
    expect(new Set(refIds).size, 'duplicate card ids').toBe(refIds.length);
  });

  it('urgent items come first: yes, no, help, pain, feeling unwell, toilet', () => {
    expect(es.slice(0, 6).map(c => c.id)).toEqual(['yes', 'no', 'help', 'pain', 'sick', 'bathroom']);
    // Every "urgent" card sits before every purely emotional card
    const lastUrgent = Math.max(...es.map((c, i) => (c.kind === 'urgent' ? i : -1)));
    const firstFeel = es.findIndex(c => c.kind === 'feel');
    expect(lastUrgent).toBeLessThan(firstFeel);
  });

  it('cards are short and concrete: no empty text, no unspeakable phrases, no duplicates per language', () => {
    for (const lang of LANGS) {
      const labels = new Set<string>();
      for (const card of board[lang]!) {
        expect(card.text.trim(), `${lang}.${card.id} text`).not.toBe('');
        expect(card.spoken.trim(), `${lang}.${card.id} spoken`).not.toBe('');
        expect(card.text.length, `${lang}.${card.id} label too long for a card`).toBeLessThanOrEqual(60);
        expect(card.spoken.length, `${lang}.${card.id} phrase too long`).toBeLessThanOrEqual(190);
        expect(labels.has(card.text), `${lang}: duplicate label ${card.text}`).toBe(false);
        labels.add(card.text);
      }
    }
  });

  it('every card icon exists in the icon set', () => {
    for (const card of es) expect(svgIcons[card.icon], `missing icon "${card.icon}" for ${card.id}`).toBeDefined();
  });
});
