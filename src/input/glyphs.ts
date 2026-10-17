/* Built-in stroke templates for block capitals and digits.
   Coordinates are on a 0..100 canvas, y grows downward. Several letters have a
   second, differently-drawn variant (e.g. "I" with and without serifs) because
   people write them both ways. Order and direction of strokes are irrelevant. */

import { templateFromStrokes, type Template, type XY } from './recognizer.js';

type S = XY[];
const P = (...c: number[]): S => {
  const out: S = [];
  for (let i = 0; i < c.length; i += 2) out.push({ x: c[i]!, y: c[i + 1]! });
  return out;
};

/** Elliptical arc, angles in degrees (0 = right, 90 = down), either direction. */
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 18): S => {
  const out: S = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return out;
};

const GLYPHS: Record<string, S[][]> = {
  A: [[P(0, 100, 35, 0, 70, 100), P(12, 64, 58, 64)]],
  B: [[P(0, 0, 0, 100), [...P(0, 0, 36, 0), ...arc(36, 25, 28, 25, -90, 90), ...P(0, 50)], [...P(0, 50, 40, 50), ...arc(40, 75, 30, 25, -90, 90), ...P(0, 100)]]],
  C: [[arc(40, 50, 40, 50, -40, -320, 24)]],
  D: [[P(0, 0, 0, 100), [...P(0, 0, 20, 0), ...arc(20, 50, 50, 50, -90, 90, 20), ...P(0, 100)]]],
  E: [[P(70, 0, 0, 0, 0, 100, 70, 100), P(0, 50, 55, 50)]],
  F: [[P(70, 0, 0, 0, 0, 100), P(0, 50, 52, 50)]],
  G: [[[...arc(40, 50, 40, 50, -40, -330, 24), ...P(75, 56, 44, 56)]]],
  H: [[P(0, 0, 0, 100), P(70, 0, 70, 100), P(0, 50, 70, 50)]],
  I: [[P(0, 0, 0, 100)], [P(-18, 0, 18, 0), P(0, 0, 0, 100), P(-18, 100, 18, 100)]],
  J: [[[...P(50, 0, 50, 72), ...arc(28, 72, 22, 28, 0, 165, 12)]], [[...P(50, 0, 50, 72), ...arc(28, 72, 22, 28, 0, 165, 12)], P(24, 0, 76, 0)]],
  K: [[P(0, 0, 0, 100), P(66, 0, 0, 58), P(20, 40, 72, 100)]],
  L: [[P(0, 0, 0, 100, 62, 100)]],
  M: [[P(0, 100, 0, 0, 40, 60, 80, 0, 80, 100)]],
  N: [[P(0, 100, 0, 0, 70, 100, 70, 0)]],
  O: [[arc(35, 50, 35, 50, 0, 360, 30)]],
  P: [[P(0, 100, 0, 0, 34, 0), arc(34, 27, 32, 27, -90, 90), P(34, 54, 0, 54)]],
  Q: [[arc(35, 50, 35, 50, 0, 360, 30), P(46, 70, 84, 106)]],
  R: [[P(0, 100, 0, 0, 34, 0), arc(34, 27, 32, 27, -90, 90), P(34, 54, 0, 54), P(30, 54, 72, 100)]],
  S: [[P(62, 15, 50, 3, 32, 0, 12, 8, 5, 25, 15, 40, 35, 50, 55, 60, 65, 75, 58, 92, 40, 100, 20, 98, 5, 88)]],
  T: [[P(0, 0, 70, 0), P(35, 0, 35, 100)]],
  U: [[[...P(0, 0, 0, 70), ...arc(35, 70, 35, 30, 180, 0, 16), ...P(70, 0)]]],
  V: [[P(0, 0, 35, 100, 70, 0)]],
  W: [[P(0, 0, 20, 100, 45, 25, 70, 100, 90, 0)]],
  X: [[P(0, 0, 70, 100), P(70, 0, 0, 100)]],
  Y: [[P(0, 0, 35, 50, 70, 0), P(35, 50, 35, 100)]],
  Z: [[P(0, 0, 70, 0, 0, 100, 70, 100)]],
  0: [[arc(30, 50, 30, 50, 0, 360, 30)]],
  1: [[P(0, 26, 30, 0, 30, 100)], [P(30, 0, 30, 100)], [P(0, 26, 30, 0, 30, 100), P(8, 100, 52, 100)]],
  2: [[P(2, 28, 15, 8, 35, 0, 55, 8, 62, 28, 52, 48, 0, 100, 65, 100)]],
  3: [[P(2, 10, 20, 0, 45, 2, 58, 18, 48, 38, 25, 48, 50, 55, 62, 72, 55, 92, 32, 100, 8, 95, 0, 85)]],
  4: [[P(50, 100, 50, 0, 0, 68, 70, 68)], [P(0, 0, 0, 55, 62, 55), P(50, 0, 50, 100)]],
  5: [[P(60, 0, 10, 0, 4, 45, 30, 38, 52, 45, 62, 65, 52, 90, 30, 100, 8, 95)]],
  6: [[P(55, 5, 30, 15, 10, 45, 4, 70, 15, 95, 35, 100, 55, 92, 60, 72, 48, 55, 28, 52, 8, 65)]],
  7: [[P(0, 0, 65, 0, 25, 100)], [P(0, 0, 65, 0, 25, 100), P(15, 55, 52, 55)]],
  8: [[arc(30, 26, 24, 26, 0, 360, 24), arc(30, 76, 28, 24, 0, 360, 24)]],
  9: [[arc(30, 28, 28, 28, 0, 360, 24), P(58, 28, 58, 60, 45, 88, 25, 100, 5, 95)]],
};

/** All built-in templates (one per drawn variant). */
export function builtinTemplates(): Template[] {
  const out: Template[] = [];
  for (const [char, variants] of Object.entries(GLYPHS)) {
    for (const v of variants) out.push(templateFromStrokes(char, v, 'builtin'));
  }
  return out;
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGITS = '0123456789';
export const GLYPH_STROKES = GLYPHS;
