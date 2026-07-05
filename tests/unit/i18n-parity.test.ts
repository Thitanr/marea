/* ==========================================================================
   i18n integrity — world-class guard.
   1. Every language block exposes exactly the same keys (no missing, no extra).
   2. No empty values.
   3. Every data-i18n / data-i18n-aria / data-i18n-placeholder key used in
      index.html exists in the dictionary.
   4. CJK languages actually contain CJK text (catches copy-paste of Spanish
      into the zh/ja blocks); non-CJK languages contain no CJK.
   5. AAC board: same categories and card counts across all languages.
   ========================================================================== */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { i18n } from '../../src/data/i18n-dict.js';
import { aacBoardData } from '../../src/data/aac-board.js';

const LANGS = ['es', 'en', 'it', 'fr', 'de', 'zh', 'pt', 'ja'] as const;
const dict = i18n as Record<string, Record<string, string>>;
const board = aacBoardData as Record<string, Record<string, Array<{ text: string; spoken: string; icon: string }>>>;

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

describe('AAC board parity', () => {
  it('all languages expose the same categories with the same number of cards', () => {
    const es = board.es!;
    const refCats = Object.keys(es).sort();
    for (const lang of LANGS) {
      const langBoard = board[lang]!;
      expect(Object.keys(langBoard).sort(), `${lang} categories differ`).toEqual(refCats);
      for (const cat of refCats) {
        const cards = langBoard[cat]!;
        expect(cards.length, `${lang}.${cat} card count differs from es`)
          .toBe(es[cat]!.length);
        for (const card of cards) {
          expect(card.text.trim()).not.toBe('');
          expect(card.spoken.trim()).not.toBe('');
          expect(card.icon.trim()).not.toBe('');
        }
      }
    }
  });
});
