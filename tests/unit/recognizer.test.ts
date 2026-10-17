import { describe, it, expect } from 'vitest';
import { builtinTemplates, GLYPH_STROKES, LETTERS, DIGITS } from '../../src/input/glyphs.js';
import { recognize, templateFromStrokes, extent, type XY } from '../../src/input/recognizer.js';

/* Deterministic PRNG so the test never flakes. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simulate a hand-drawn version of a template: wobble, skew, rotation,
 *  non-uniform scale, shuffled stroke order, random stroke direction. */
function handDrawn(strokes: XY[][], r: () => number, wobble: number): XY[][] {
  const rot = ((r() - 0.5) * 2 * 10 * Math.PI) / 180;
  const sx = 0.8 + r() * 0.4, sy = 0.8 + r() * 0.4;
  const skew = (r() - 0.5) * 0.25;
  const order = strokes.map((_, i) => i).sort(() => r() - 0.5);
  return order.map(i => {
    let s = strokes[i]!.map(p => ({ ...p }));
    if (r() < 0.3) s = s.reverse();
    // densify then jitter, like touch samples
    const dense: XY[] = [];
    for (let k = 1; k < s.length; k++) {
      const a = s[k - 1]!, b = s[k]!;
      for (let t = 0; t < 4; t++) dense.push({ x: a.x + ((b.x - a.x) * t) / 4, y: a.y + ((b.y - a.y) * t) / 4 });
    }
    dense.push(s[s.length - 1]!);
    return dense.map(p => {
      const x = (p.x + (r() - 0.5) * wobble) * sx + skew * p.y;
      const y = (p.y + (r() - 0.5) * wobble) * sy;
      return { x: x * Math.cos(rot) - y * Math.sin(rot), y: x * Math.sin(rot) + y * Math.cos(rot) };
    });
  });
}

const templates = builtinTemplates();

function accuracy(chars: string, wobble: number, trials: number, seed: number, topN: number) {
  const r = rng(seed);
  const allow = (c: string) => chars.includes(c);
  let ok = 0, total = 0;
  const confusions: Record<string, number> = {};
  for (const ch of chars) {
    const variants = GLYPH_STROKES[ch]!;
    for (let t = 0; t < trials; t++) {
      const variant = variants[Math.floor(r() * variants.length)]!;
      const out = recognize(handDrawn(variant, r, wobble), templates, allow, topN);
      total++;
      if (out.some(c => c.char === ch)) ok++;
      else {
        const k = `${ch}->${out[0]?.char}`;
        confusions[k] = (confusions[k] ?? 0) + 1;
      }
    }
  }
  return { rate: ok / total, confusions };
}

describe('handwriting recognizer (self-consistency on simulated writing)', () => {
  it('every glyph has at least one template', () => {
    for (const ch of LETTERS + DIGITS) expect(GLYPH_STROKES[ch], ch).toBeDefined();
    expect(templates.length).toBeGreaterThanOrEqual(36);
  });

  it('letters: correct in top-1 for clean-ish writing (wobble 4)', () => {
    const { rate, confusions } = accuracy(LETTERS, 4, 12, 7, 1);
    // eslint-disable-next-line no-console
    console.log('letters top1 wobble4', rate.toFixed(3), JSON.stringify(confusions));
    expect(rate).toBeGreaterThan(0.85);
  });

  it('letters: correct in top-3 under heavy wobble (wobble 10, e.g. tremor)', () => {
    const { rate } = accuracy(LETTERS, 10, 12, 11, 3);
    // eslint-disable-next-line no-console
    console.log('letters top3 wobble10', rate.toFixed(3));
    expect(rate).toBeGreaterThan(0.85);
  });

  it('digits: correct in top-1 for clean-ish writing', () => {
    const { rate } = accuracy(DIGITS, 4, 12, 3, 1);
    expect(rate).toBeGreaterThan(0.85);
  });

  it('stroke order and direction do not matter', () => {
    const E = GLYPH_STROKES.E![0]!;
    const forward = recognize(E, templates, c => LETTERS.includes(c), 1)[0]!.char;
    const backwards = recognize([...E].reverse().map(s => [...s].reverse()), templates, c => LETTERS.includes(c), 1)[0]!.char;
    expect(forward).toBe('E');
    expect(backwards).toBe('E');
  });

  it('restricting to digits removes the O/0 ambiguity', () => {
    const zero = GLYPH_STROKES.O![0]!;
    expect(recognize(zero, templates, c => DIGITS.includes(c), 1)[0]!.char).toBe('0');
    expect(recognize(zero, templates, c => LETTERS.includes(c), 1)[0]!.char).toBe('O');
  });

  it('learns from a correction: a user sample wins next time', () => {
    // A deliberately odd "A" (no crossbar, flat top) that built-ins miss
    const odd: XY[][] = [[{ x: 0, y: 100 }, { x: 20, y: 0 }, { x: 50, y: 0 }, { x: 70, y: 100 }]];
    const user = templateFromStrokes('A', odd, 'user');
    const all = [...templates, user];
    const out = recognize(odd, all, c => LETTERS.includes(c), 1)[0]!;
    expect(out.char).toBe('A');
    expect(out.source).toBe('user');
  });

  it('extent ignores nothing and reports 0 for empty input', () => {
    expect(extent([])).toBe(0);
    expect(extent([[{ x: 0, y: 0 }, { x: 30, y: 40 }]])).toBe(40);
  });
});
