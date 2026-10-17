/* On-screen keyboard layouts. Pure data/logic — no DOM — so it can be tested. */

import type { Lang } from '../types.js';

export type KeyKind = 'char' | 'shift' | 'back' | 'space' | 'layout';
export interface KeyDef { kind: KeyKind; value: string; label: string }
export interface RowDef { keys: KeyDef[]; digits?: boolean }
export type LayoutMode = 'qwerty' | 'abc';

/** Languages whose script the on-screen keyboard can type. Others use the OS keyboard/IME. */
export const OWN_KEYBOARD_LANGS: readonly Lang[] = ['es', 'en', 'it', 'fr', 'de', 'pt'];
export const isLatinKeyboardLang = (l: Lang): boolean => OWN_KEYBOARD_LANGS.includes(l);

const ACCENTS: Partial<Record<Lang, string[]>> = {
  es: ['á', 'é', 'í', 'ó', 'ú', 'ü', '¿', '¡'],
  fr: ['é', 'è', 'ê', 'à', 'ù', 'ç', 'î', 'ô', 'œ'],
  it: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
  de: ['ä', 'ö', 'ü', 'ß'],
  pt: ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
};

const char = (c: string, upper = false): KeyDef => ({ kind: 'char', value: c, label: upper ? c.toLocaleUpperCase() : c });

const PUNCT: Partial<Record<Lang, string[]>> = { en: [','], es: [','], fr: [','], it: [','], de: [','], pt: [','] };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function qwertyRows(lang: Lang): string[][] {
  if (lang === 'fr') return [[...'azertyuiop'], [...'qsdfghjklm'], [...'wxcvbn']];
  if (lang === 'de') return [[...'qwertzuiop'], [...'asdfghjkl'], [...'yxcvbnm']];
  const row2 = [...'asdfghjkl'];
  if (lang === 'es') row2.push('ñ');
  return [[...'qwertyuiop'], row2, [...'zxcvbnm']];
}

function abcLetters(lang: Lang): string[] {
  const letters = [...'abcdefghijklmnopqrstuvwxyz'];
  if (lang === 'es') letters.splice(letters.indexOf('o'), 0, 'ñ');
  return letters;
}

/**
 * Build the rows for a language.
 * qwerty: familiar phone layout (AZERTY for French, QWERTZ for German).
 * abc: alphabetical order, bigger keys, 7 per row — easier to scan when the
 *      QWERTY layout is not automatic for the person.
 */
export function buildLayout(lang: Lang, mode: LayoutMode, upper: boolean, shiftActive: boolean): RowDef[] {
  // The layout switch shows the layout you would switch TO.
  const rows: RowDef[] = [];
  rows.push({ digits: true, keys: [...'1234567890'].map(d => char(d)) });

  const shift: KeyDef = { kind: 'shift', value: 'shift', label: shiftActive ? '⇪' : '⇧' };
  const back: KeyDef = { kind: 'back', value: 'back', label: '⌫' };

  if (mode === 'qwerty') {
    const [r1, r2, r3] = qwertyRows(lang) as [string[], string[], string[]];
    rows.push({ keys: r1.map(c => char(c, upper)) });
    rows.push({ keys: r2.map(c => char(c, upper)) });
    rows.push({ keys: [shift, ...r3.map(c => char(c, upper)), back] });
  } else {
    for (const part of chunk(abcLetters(lang), 7)) rows.push({ keys: part.map(c => char(c, upper)) });
  }

  const accents = ACCENTS[lang];
  if (accents) {
    for (const part of chunk(accents, accents.length > 9 ? 6 : 9)) rows.push({ keys: part.map(c => char(c, upper)) });
  }

  const comma = (PUNCT[lang] ?? [','])[0]!;
  const switchKey: KeyDef = { kind: 'layout', value: 'layout', label: mode === 'abc' ? 'QWE' : 'ABC' };
  const bottom: KeyDef[] = mode === 'abc' ? [switchKey, shift] : [switchKey];
  bottom.push(char(comma), { kind: 'space', value: ' ', label: '␣' }, char('.'), char('?'), char('!'));
  if (mode === 'abc') bottom.push(back);
  rows.push({ keys: bottom });
  return rows;
}

/** Should the next typed letter be a capital? (start of text / after . ! ? ¿ ¡ or newline) */
export function wantsCapital(textBeforeCaret: string): boolean {
  if (textBeforeCaret.trim() === '') return true;
  return /[.!?\n]\s*$/.test(textBeforeCaret) || /[¿¡]\s*$/.test(textBeforeCaret);
}
