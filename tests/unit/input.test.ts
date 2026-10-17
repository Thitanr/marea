import { describe, it, expect, beforeEach } from 'vitest';
import { buildLayout, wantsCapital, isLatinKeyboardLang, type RowDef } from '../../src/input/layouts.js';
import { suggest, learnWords, stripAccents, insertText, backspace, completeWord, wordBeforeCaret } from '../../src/input/predict.js';
import { i18n } from '../../src/data/i18n-dict.js';

const chars = (rows: RowDef[]): string => rows.flatMap(r => r.keys).filter(k => k.kind === 'char').map(k => k.value).join('');
const kinds = (rows: RowDef[]): string[] => rows.flatMap(r => r.keys).map(k => k.kind);

describe('on-screen keyboard layouts', () => {
  it('Spanish has ñ and accented vowels ("año" is not "ano")', () => {
    const all = chars(buildLayout('es', 'qwerty', false, false));
    for (const c of 'ñáéíóúü¿¡') expect(all, c).toContain(c);
  });

  it('French is AZERTY, German is QWERTZ, others QWERTY', () => {
    const first = (l: Parameters<typeof buildLayout>[0]) => buildLayout(l, 'qwerty', false, false)[1]!.keys.map(k => k.value).join('');
    expect(first('fr')).toBe('azertyuiop');
    expect(first('de')).toBe('qwertzuiop');
    expect(first('en')).toBe('qwertyuiop');
  });

  it('ABC layout lists every letter alphabetically, 7 per row', () => {
    const rows = buildLayout('en', 'abc', false, false);
    const letters = rows.slice(1, 5).map(r => r.keys.map(k => k.value).join(''));
    expect(letters.join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(letters[0]!.length).toBe(7);
  });

  it('every layout has space, backspace, shift and a layout switch; digits row first', () => {
    for (const lang of ['es', 'en', 'it', 'fr', 'de', 'pt'] as const) {
      for (const mode of ['qwerty', 'abc'] as const) {
        const rows = buildLayout(lang, mode, false, false);
        const k = kinds(rows);
        for (const need of ['space', 'back', 'shift', 'layout']) expect(k, `${lang}/${mode} missing ${need}`).toContain(need);
        expect(rows[0]!.digits).toBe(true);
        expect(rows[0]!.keys.map(x => x.value).join('')).toBe('1234567890');
      }
    }
  });

  it('upper-case labels follow shift/auto-capital', () => {
    expect(buildLayout('en', 'qwerty', true, false)[1]!.keys[0]!.label).toBe('Q');
    expect(buildLayout('en', 'qwerty', false, false)[1]!.keys[0]!.label).toBe('q');
  });

  it('auto-capital at the start and after sentence ends only', () => {
    expect(wantsCapital('')).toBe(true);
    expect(wantsCapital('Hola. ')).toBe(true);
    expect(wantsCapital('¿')).toBe(true);
    expect(wantsCapital('Hola ')).toBe(false);
    expect(wantsCapital('Hola')).toBe(false);
  });

  it('Chinese and Japanese use the device keyboard (IME) instead', () => {
    expect(isLatinKeyboardLang('zh')).toBe(false);
    expect(isLatinKeyboardLang('ja')).toBe(false);
    expect(isLatinKeyboardLang('es')).toBe(true);
  });
});

describe('word prediction', () => {
  beforeEach(() => localStorage.clear());

  it('suggests starters when nothing is typed', () => {
    expect(suggest('', 'es', 3)).toEqual(['quiero', 'necesito', 'tengo']);
  });

  it('completes a prefix, ignoring accents ("medi" -> médico)', () => {
    expect(suggest('medi', 'es', 4)).toContain('médico');
    expect(suggest('qu', 'es', 4)).toContain('quiero');
    expect(stripAccents('Médico')).toBe('medico');
  });

  it('never suggests the word already typed in full', () => {
    expect(suggest('agua', 'es', 4)).not.toContain('agua');
  });

  it('floats the words the person actually uses to the top', () => {
    const before = suggest('ca', 'es', 4);
    expect(before[0]).not.toBe('caminar');
    learnWords('caminar caminar caminar');
    const after = suggest('ca', 'es', 4);
    expect(after[0]).toBe('caminar');
  });

  it('has nothing for languages typed with the OS keyboard', () => {
    expect(suggest('a', 'zh', 4)).toEqual([]);
  });
});

describe('text pad helpers (caret-aware)', () => {
  const mk = (value: string, caretAt?: number): HTMLTextAreaElement => {
    const ta = document.createElement('textarea');
    ta.value = value;
    const c = caretAt ?? value.length;
    ta.setSelectionRange(c, c);
    return ta;
  };

  it('inserts at the caret, not only at the end', () => {
    const ta = mk('ho a', 2);
    insertText(ta, 'l');
    expect(ta.value).toBe('hol a');
    expect(ta.selectionStart).toBe(3);
  });

  it('backspace removes one character, or the selection', () => {
    const ta = mk('hola');
    backspace(ta);
    expect(ta.value).toBe('hol');
    ta.setSelectionRange(0, 2);
    backspace(ta);
    expect(ta.value).toBe('l');
  });

  it('backspace removes a whole emoji, not half of it', () => {
    const ta = mk('hi😀');
    backspace(ta);
    expect(ta.value).toBe('hi');
  });

  it('completes the word being typed and adds a space', () => {
    const ta = mk('quiero ag');
    expect(wordBeforeCaret(ta)).toBe('ag');
    completeWord(ta, 'agua');
    expect(ta.value).toBe('quiero agua ');
  });
});

describe('helpline labels (safety)', () => {
  const dict = i18n as Record<string, Record<string, string>>;

  it('a label never embeds a phone number or claims 988 covers Latin America', () => {
    // A label once described a different, local line per language while the button dialled the
    // Spanish number. Labels must describe the number that is actually dialled.
    for (const [lang, block] of Object.entries(dict)) {
      for (const key of ['safety.helpline_es', 'safety.helpline_hope', 'safety.helpline_988', 'safety.helpline_mx']) {
        const v = block[key]!;
        expect(/\d{3}/.test(v), `${lang}.${key} embeds a number: ${v}`).toBe(false);
        expect(/LATAM|拉美|中南米/.test(v), `${lang}.${key} claims LATAM: ${v}`).toBe(false);
      }
    }
  });

  it('the 988 line is shown for the United States and Canada only', () => {
    for (const block of Object.values(dict)) expect(block['safety.country_us_ca']!.length).toBeGreaterThan(0);
  });
});
