/* ==========================================================================
   MAREA — On-device handwriting recognizer ($P point-cloud, Vatavu et al. 2012)
   No model download, no network, no cloud: letters are matched against
   built-in stroke templates plus the user's own corrected samples.
   Stroke order, stroke count and direction do not matter (a "T" drawn with
   the bar first or last is the same T).
   ========================================================================== */

export interface XY { x: number; y: number }
export interface Point extends XY { id: number }
export interface Template { char: string; points: Point[]; source: 'builtin' | 'user' }
export interface Candidate { char: string; distance: number; source: 'builtin' | 'user' }

export const RESAMPLE_N = 32;

const dist = (a: XY, b: XY): number => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(pts: Point[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!;
    if (a.id === b.id) d += dist(a, b);
  }
  return d;
}

export function resample(input: Point[], n: number = RESAMPLE_N): Point[] {
  const pts = input.map(p => ({ ...p }));
  const first = pts[0];
  if (!first) return [];
  const I = pathLength(pts) / (n - 1);
  if (!(I > 0)) return Array.from({ length: n }, () => ({ ...first }));
  let D = 0;
  const out: Point[] = [{ ...first }];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!, cur = pts[i]!;
    if (prev.id !== cur.id) continue;
    const d = dist(prev, cur);
    if (D + d >= I) {
      const t = (I - D) / d;
      const q: Point = { x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y), id: cur.id };
      out.push(q);
      pts.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
  }
  const last = pts[pts.length - 1]!;
  while (out.length < n) out.push({ ...last });
  return out.slice(0, n);
}

function scaleAndCentre(pts: Point[]): Point[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  const scaled = pts.map(p => ({ x: (p.x - minX) / size, y: (p.y - minY) / size, id: p.id }));
  const cx = scaled.reduce((s, p) => s + p.x, 0) / scaled.length;
  const cy = scaled.reduce((s, p) => s + p.y, 0) / scaled.length;
  return scaled.map(p => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

/** Strokes (arrays of {x,y}) -> normalised, resampled point cloud. */
export function normalize(strokes: XY[][]): Point[] {
  const pts: Point[] = [];
  strokes.forEach((s, id) => s.forEach(p => pts.push({ x: p.x, y: p.y, id })));
  if (pts.length === 0) return [];
  return scaleAndCentre(resample(pts));
}

function cloudDistance(a: Point[], b: Point[], start: number): number {
  const n = a.length;
  const matched = new Array<boolean>(b.length).fill(false);
  let sum = 0;
  let i = start;
  do {
    let min = Infinity, idx = -1;
    const ai = a[i]!;
    for (let j = 0; j < b.length; j++) {
      if (matched[j]) continue;
      const d = dist(ai, b[j]!);
      if (d < min) { min = d; idx = j; }
    }
    if (idx >= 0) matched[idx] = true;
    const weight = 1 - ((i - start + n) % n) / n;
    sum += weight * min;
    i = (i + 1) % n;
  } while (i !== start);
  return sum;
}

function greedyCloudMatch(a: Point[], b: Point[]): number {
  const e = 0.5;
  const step = Math.max(1, Math.floor(Math.pow(a.length, 1 - e)));
  let min = Infinity;
  for (let i = 0; i < a.length; i += step) {
    min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  }
  return min;
}

export function templateFromStrokes(char: string, strokes: XY[][], source: Template['source']): Template {
  return { char, points: normalize(strokes), source };
}

/**
 * Rank characters by best matching template. `allow` restricts the alphabet
 * (letters mode vs numbers mode removes the O/0, I/1, S/5, Z/2, B/8 ambiguity).
 * A user's own corrected samples are slightly preferred over built-ins.
 */
export function recognize(
  strokes: XY[][],
  templates: Template[],
  allow: (char: string) => boolean = () => true,
  topN = 3,
): Candidate[] {
  const gesture = normalize(strokes);
  if (gesture.length === 0) return [];
  const best = new Map<string, Candidate>();
  for (const t of templates) {
    if (!allow(t.char)) continue;
    const raw = greedyCloudMatch(gesture, t.points);
    const d = t.source === 'user' ? raw * 0.9 : raw;
    const cur = best.get(t.char);
    if (!cur || d < cur.distance) best.set(t.char, { char: t.char, distance: d, source: t.source });
  }
  return [...best.values()].sort((a, b) => a.distance - b.distance).slice(0, topN);
}

/** Smallest bounding side (in the strokes' own units) that counts as writing. */
export function extent(strokes: XY[][]): number {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) for (const p of s) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!isFinite(minX)) return 0;
  return Math.max(maxX - minX, maxY - minY);
}
